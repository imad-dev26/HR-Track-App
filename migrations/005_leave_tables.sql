-- 005_leave_tables.sql
-- Leave management: types, exercises, leaves, recovery balance and history

-- Leave types (configurable)
CREATE TABLE IF NOT EXISTS leave_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Leave exercises (annual leave periods, e.g. CA EX26/27)
CREATE TABLE IF NOT EXISTS leave_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Leaves (individual leave records)
CREATE TABLE IF NOT EXISTS leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    leave_type_id INTEGER NOT NULL,
    exercise_id INTEGER,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    number_days REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Validé',
    observation TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    FOREIGN KEY (exercise_id) REFERENCES leave_exercises(id)
);

CREATE INDEX IF NOT EXISTS idx_leaves_employee ON leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_type ON leaves(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leaves_exercise ON leaves(exercise_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);

-- Recovery balance (current DAC/Reliquat balance per employee)
CREATE TABLE IF NOT EXISTS recovery_balance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL UNIQUE,
    balance REAL NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Recovery history (tracks additions and consumption)
CREATE TABLE IF NOT EXISTS recovery_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    operation_type TEXT NOT NULL,
    amount REAL NOT NULL,
    reason TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recovery_history_employee ON recovery_history(employee_id);
