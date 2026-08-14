-- 009_administration_tables.sql
-- Administration: company information, settings

-- Company information (single record, configurable)
CREATE TABLE IF NOT EXISTS company_info (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_path TEXT,
    fiscal_id TEXT,
    legal_form TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (id = 1)
);

-- Application settings (key-value store for configurable rules)
CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    description TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Contract rules (configurable business rules per service/contract type)
CREATE TABLE IF NOT EXISTS contract_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    contract_type_id INTEGER,
    rule_key TEXT NOT NULL,
    rule_value TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (contract_type_id) REFERENCES contract_types(id) ON DELETE CASCADE
);
