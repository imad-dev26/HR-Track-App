-- 004_history_tables.sql
-- Employee history: service mobility and career changes

-- Service history (tracks service and section changes)
CREATE TABLE IF NOT EXISTS service_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    old_service TEXT,
    old_section TEXT,
    new_service TEXT NOT NULL,
    new_section TEXT,
    movement_date TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_history_employee ON service_history(employee_id);

-- Career history (tracks function, level, and category changes)
CREATE TABLE IF NOT EXISTS career_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    old_function TEXT,
    old_level TEXT,
    old_category TEXT,
    new_function TEXT NOT NULL,
    new_level TEXT,
    new_category TEXT,
    date_change TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_career_history_employee ON career_history(employee_id);
