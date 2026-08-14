-- 006_medical_discipline_training.sql
-- Medical, discipline, and training modules

-- Medical records (Guest users cannot see details)
CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    restriction_type TEXT,
    decision TEXT,
    type TEXT NOT NULL DEFAULT 'temporary',
    start_date TEXT NOT NULL,
    duration_months INTEGER,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'actif',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_medical_employee ON medical_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_medical_status ON medical_records(status);

-- Disciplinary actions (Avertissement, Blâme, Mise à pied)
CREATE TABLE IF NOT EXISTS disciplinary_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_disciplinary_employee ON disciplinary_actions(employee_id);

-- Training records
CREATE TABLE IF NOT EXISTS training_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    mission_order_number TEXT,
    subject TEXT,
    location TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_training_employee ON training_records(employee_id);
