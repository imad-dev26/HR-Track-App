use rusqlite::Connection;

const MIGRATION_FILES: &[(&str, &str)] = &[
    ("001_core_tables", include_str!("../migrations/001_core_tables.sql")),
    ("002_organization_tables", include_str!("../migrations/002_organization_tables.sql")),
    ("003_contract_tables", include_str!("../migrations/003_contract_tables.sql")),
    ("004_history_tables", include_str!("../migrations/004_history_tables.sql")),
    ("005_leave_tables", include_str!("../migrations/005_leave_tables.sql")),
    ("006_medical_discipline_training", include_str!("../migrations/006_medical_discipline_training.sql")),
    ("007_accidents_attendance", include_str!("../migrations/007_accidents_attendance.sql")),
    ("008_system_tables", include_str!("../migrations/008_system_tables.sql")),
    ("009_administration_tables", include_str!("../migrations/009_administration_tables.sql")),
    ("010_seed_defaults", include_str!("../migrations/010_seed_defaults.sql")),
    ("011_fix_default_admin_password", include_str!("../migrations/011_fix_default_admin_password.sql")),
];

pub fn apply_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    // Disable FK checks during migration so tables can be created in order
    // even when forward references exist (e.g. employees -> professional_categories).
    conn.execute_batch("PRAGMA foreign_keys=OFF;")?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (
            version INTEGER PRIMARY KEY,
            description TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );"
    )?;

    for (index, (description, sql)) in MIGRATION_FILES.iter().enumerate() {
        let version = (index + 1) as i64;

        let already_applied: bool = conn
            .query_row(
                "SELECT COUNT(*) > 0 FROM _migrations WHERE version = ?1",
                rusqlite::params![version],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if already_applied {
            continue;
        }

        eprintln!("[migrations] applying {} (v{})", description, version);

        if let Err(e) = conn.execute_batch(sql) {
            eprintln!("[migrations] FAILED v{} {}: {}", version, description, e);
            let _ = conn.execute_batch("PRAGMA foreign_keys=ON;");
            return Err(e);
        }

        conn.execute(
            "INSERT INTO _migrations (version, description) VALUES (?1, ?2)",
            rusqlite::params![version, description],
        )?;

        eprintln!("[migrations] applied {} (v{}) OK", description, version);
    }

    conn.execute_batch("PRAGMA foreign_keys=ON;")?;
    eprintln!("[migrations] all migrations applied successfully");

    Ok(())
}



#[cfg(test)]
mod tests {
    use super::*;

    // --- A. Fresh database: all 11 migrations applied + admin password works ---
    #[test]
    fn test_fresh_db_all_migrations_and_admin_password() {
        let conn = Connection::open_in_memory().expect("open in-memory db");
        apply_migrations(&conn).expect("migrations failed on fresh db");

        // All 11 migrations must be recorded
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM _migrations", [], |r| r.get(0))
            .expect("query _migrations");
        assert_eq!(count, MIGRATION_FILES.len() as i64, "expected {} migrations", MIGRATION_FILES.len());

        // admin user must exist and be active with correct role
        let (username, role, active): (String, String, i32) = conn
            .query_row(
                "SELECT username, role, active FROM users WHERE username = 'admin'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .expect("admin user not found");
        assert_eq!(username, "admin");
        assert_eq!(role, "Admin");
        assert_eq!(active, 1, "admin must be active");

        // Password hash must be valid bcrypt that accepts admin123
        let hash: String = conn
            .query_row(
                "SELECT password_hash FROM users WHERE username = 'admin'",
                [],
                |r| r.get(0),
            )
            .expect("get password_hash");
        assert!(
            hash.starts_with("$2b$") || hash.starts_with("$2a$"),
            "password_hash must be bcrypt format, got: {}",
            hash
        );
        let verified = bcrypt::verify("admin123", &hash).expect("bcrypt::verify failed");
        assert!(verified, "admin123 must verify against the stored hash");
    }

    // --- B. Existing database (001-010 applied, placeholder hash): migration 011 repairs it ---
    #[test]
    fn test_existing_db_upgrade_via_migration_011() {
        let conn = Connection::open_in_memory().expect("open in-memory db");

        // Run all migrations
        apply_migrations(&conn).expect("initial migrations");

        // Overwrite admin password with the known broken placeholder
        conn.execute(
            "UPDATE users SET password_hash = '$2a$10$placeholder_hash_replace_on_first_run' WHERE username = 'admin'",
            [],
        ).expect("plant bad placeholder hash");

        // Remove migration 011 record so the runner will re-apply it
        conn.execute("DELETE FROM _migrations WHERE version = 11", [])
            .expect("remove migration 011 record");

        // Confirm the bad state is in place
        let bad_hash: String = conn
            .query_row("SELECT password_hash FROM users WHERE username = 'admin'", [], |r| r.get(0))
            .expect("get hash");
        assert_eq!(bad_hash, "$2a$10$placeholder_hash_replace_on_first_run",
            "test setup: placeholder must be in place before re-run");

        // Re-run migrations — only 011 should execute
        apply_migrations(&conn).expect("upgrade migrations failed");

        // Migration count must still be 11
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM _migrations", [], |r| r.get(0))
            .expect("query _migrations after upgrade");
        assert_eq!(count, 11, "must have 11 migrations after upgrade");

        // admin123 must now authenticate
        let new_hash: String = conn
            .query_row("SELECT password_hash FROM users WHERE username = 'admin'", [], |r| r.get(0))
            .expect("get new hash");
        let verified = bcrypt::verify("admin123", &new_hash).expect("bcrypt::verify failed");
        assert!(verified, "admin123 must verify after migration 011 upgrade");
    }

    // --- C. Idempotency ---
    #[test]
    fn test_idempotency() {
        let conn = Connection::open_in_memory().expect("open in-memory db");
        apply_migrations(&conn).expect("first run");
        apply_migrations(&conn).expect("second run (idempotency)");

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM _migrations", [], |r| r.get(0))
            .expect("query _migrations");
        assert_eq!(count, 11, "idempotency: migration count must remain 11");

        let hash: String = conn
            .query_row("SELECT password_hash FROM users WHERE username = 'admin'", [], |r| r.get(0))
            .expect("get hash");
        let verified = bcrypt::verify("admin123", &hash).expect("bcrypt::verify failed");
        assert!(verified, "admin123 must still verify after idempotent re-run");
    }

    // --- D. Verify the embedded hash round-trips correctly ---
    #[test]
    fn test_embedded_bcrypt_hash_round_trip() {
        let hash = "$2b$10$0VhA9Hg.jTBd/bzmenZFAu5ghEAQdUzozRiYH2G4PWICK5ZIvlTee";
        let verified = bcrypt::verify("admin123", hash).expect("bcrypt::verify failed");
        assert!(verified, "the embedded hash must verify against admin123");
        let wrong = bcrypt::verify("wrongpassword", hash).expect("bcrypt::verify failed");
        assert!(!wrong, "the hash must NOT verify against a wrong password");
    }
}
