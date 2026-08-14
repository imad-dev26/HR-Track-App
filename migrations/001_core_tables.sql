-- 001_core_tables.sql
-- Core employee tables and employee status management

-- Employee status types (configurable)
CREATE TABLE IF NOT EXISTS employee_status_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Main employee record
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricule TEXT NOT NULL UNIQUE,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    date_naissance TEXT,
    lieu_naissance TEXT,
    national_id TEXT,
    securite_sociale TEXT,
    telephone TEXT,
    adresse TEXT,
    compte_bancaire TEXT,
    situation_familiale TEXT,
    nombre_enfants INTEGER DEFAULT 0,
    category_id INTEGER,
    current_status_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES professional_categories(id),
    FOREIGN KEY (current_status_id) REFERENCES employee_status_types(id)
);

CREATE INDEX IF NOT EXISTS idx_employees_matricule ON employees(matricule);
CREATE INDEX IF NOT EXISTS idx_employees_nom ON employees(nom);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(current_status_id);

-- Employee status history (preserves all status changes)
CREATE TABLE IF NOT EXISTS employee_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    date_change TEXT NOT NULL,
    reason TEXT,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_status_history_employee ON employee_status_history(employee_id);
