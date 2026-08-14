use rusqlite::Connection;
use std::path::Path;

pub fn open_connection(db_path: &Path) -> Result<Connection, rusqlite::Error> {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error {
                    code: rusqlite::ErrorCode::CannotOpen,
                    extended_code: 0,
                },
                Some(format!("Cannot create database directory: {}", e)),
            )
        })?;
    }
    let conn = Connection::open(db_path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    Ok(conn)
}

pub fn get_db_path(app_data_dir: &Path) -> std::path::PathBuf {
    app_data_dir.join("hrtrack.db")
}
