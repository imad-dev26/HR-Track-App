use rusqlite::Connection;
use std::path::Path;

pub fn open_connection(db_path: &Path) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open(db_path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    Ok(conn)
}

pub fn get_db_path(app_data_dir: &Path) -> std::path::PathBuf {
    app_data_dir.join("hrtrack.db")
}
