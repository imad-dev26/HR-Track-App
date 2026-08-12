-- 007_accidents_attendance.sql
-- Work accidents and attendance exceptions

-- Work accidents
CREATE TABLE IF NOT EXISTS accidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    accident_date TEXT NOT NULL,
    stop_start TEXT,
    stop_end TEXT,
    location TEXT,
    type TEXT,
    cause TEXT,
    injury TEXT,
    investigation TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accidents_employee ON accidents(employee_id);
CREATE INDEX IF NOT EXISTS idx_accidents_date ON accidents(accident_date);

-- Attendance exceptions (only exceptions are recorded; default = Present)
CREATE TABLE IF NOT EXISTS attendance_exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    reason TEXT,
    observation TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_exceptions(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_exceptions(date);
