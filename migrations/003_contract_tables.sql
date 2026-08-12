-- 003_contract_tables.sql
-- Contract types and contract records (with history)

-- Contract types (configurable: CDI, CDD, etc.)
CREATE TABLE IF NOT EXISTS contract_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Contracts (keeps full contract history per employee)
CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    contract_type_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    is_current INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (contract_type_id) REFERENCES contract_types(id)
);

CREATE INDEX IF NOT EXISTS idx_contracts_employee ON contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_current ON contracts(is_current);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(contract_type_id);
