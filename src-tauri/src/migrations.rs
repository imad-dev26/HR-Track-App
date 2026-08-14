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
