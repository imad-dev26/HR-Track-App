use crate::database::{get_db_path, open_connection};
use bcrypt::verify;
use rusqlite::params;
use serde::Serialize;
use tauri::{AppHandle, Manager};

#[derive(Serialize)]
pub struct PublicUser {
    pub id: i64,
    pub username: String,
    pub role: String,
    pub display_name: Option<String>,
}

#[tauri::command]
pub fn login(app_handle: AppHandle, username: String, password: String) -> Result<PublicUser, String> {
    // Resolve DB path from app data dir (Tauri v2 API)
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|_| "Erreur de configuration de l'application.".to_string())?;

    let db_path = get_db_path(app_data_dir.as_path());
    let conn = open_connection(&db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, username, password_hash, role, display_name, active FROM users WHERE username = ?1 LIMIT 1")
        .map_err(|e| e.to_string())?;

    let mut rows = stmt.query(params![username]).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let id: i64 = row.get(0).map_err(|e| e.to_string())?;
        let uname: String = row.get(1).map_err(|e| e.to_string())?;
        let password_hash: String = row.get(2).map_err(|e| e.to_string())?;
        let role: String = row.get(3).map_err(|e| e.to_string())?;
        let display_name: Option<String> = row.get(4).map_err(|e| e.to_string())?;
        let active: i32 = row.get(5).map_err(|e| e.to_string())?;

        if active == 0 {
            return Err("Utilisateur introuvable ou inactif.".to_string());
        }

        let verified = verify(password, &password_hash)
            .map_err(|_| "Erreur lors de la vérification du mot de passe.".to_string())?;

        if verified {
            Ok(PublicUser { id, username: uname, role, display_name })
        } else {
            Err("Identifiants invalides".to_string())
        }
    } else {
        Err("Utilisateur introuvable ou inactif.".to_string())
    }
}
