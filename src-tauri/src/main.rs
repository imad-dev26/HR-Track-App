// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod migrations;

use tauri::Manager;
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
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:hrtrack.db", get_migrations())
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|_app| {
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running HR Track application");
}
