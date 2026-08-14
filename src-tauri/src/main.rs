// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod migrations;
mod auth;

use tauri::{Manager};
use tauri_plugin_sql::{Migration, MigrationKind};

fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_core_tables",
            sql: include_str!("../migrations/001_core_tables.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_organization_tables",
            sql: include_str!("../migrations/002_organization_tables.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_contract_tables",
            sql: include_str!("../migrations/003_contract_tables.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create_history_tables",
            sql: include_str!("../migrations/004_history_tables.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create_leave_tables",
            sql: include_str!("../migrations/005_leave_tables.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "create_medical_discipline_training_tables",
            sql: include_str!("../migrations/006_medical_discipline_training.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "create_accidents_attendance_tables",
            sql: include_str!("../migrations/007_accidents_attendance.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "create_system_tables",
            sql: include_str!("../migrations/008_system_tables.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "create_administration_tables",
            sql: include_str!("../migrations/009_administration_tables.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "seed_default_data",
            sql: include_str!("../migrations/010_seed_defaults.sql"),
            kind: MigrationKind::Up,
        },
    ]
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![auth::login])
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:hrtrack.db", get_migrations())
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Apply migrations using a DB connection opened to the app data directory
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data directory");

            let db_path = crate::database::get_db_path(app_data_dir.as_path());

            // Open connection and apply migrations; propagate errors to the setup result
            match crate::database::open_connection(&db_path) {
                Ok(conn) => {
                    if let Err(e) = crate::migrations::apply_migrations(&conn) {
                        return Err(Box::new(e) as Box<dyn std::error::Error>);
                    }
                }
                Err(e) => return Err(Box::new(e) as Box<dyn std::error::Error>),
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running HR Track application");
}
