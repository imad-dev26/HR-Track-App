-- 010_seed_defaults.sql
-- Seed default configuration data (no fake HR data)
-- Only seeds system configuration, not employee/business data

-- Default employee status types
INSERT OR IGNORE INTO employee_status_types (name, sort_order) VALUES
    ('Actif', 1),
    ('Déclassé médical temporaire', 2),
    ('Déclassé médical définitif', 3),
    ('Retraité', 4),
    ('Muté', 5),
    ('Affecté', 6),
    ('Détaché', 7),
    ('Démission', 8),
    ('Licencié', 9),
    ('Fin CDD', 10);

-- Default services
INSERT OR IGNORE INTO services (name, sort_order) VALUES
    ('Administration', 1),
    ('Maintenance', 2),
    ('Exploitation', 3),
    ('Transport', 4),
    ('Sécurité Industrielle', 5),
    ('Sûreté Interne', 6);

-- Default professional categories
INSERT OR IGNORE INTO professional_categories (name, sort_order) VALUES
    ('Exécution', 1),
    ('Maîtrise', 2),
    ('Cadre', 3),
    ('Cadre supérieur', 4);

-- Default levels
INSERT OR IGNORE INTO levels (name, sort_order) VALUES
    ('NIV 1', 1),
    ('NIV 2', 2),
    ('NIV 3', 3);

-- Default contract types
INSERT OR IGNORE INTO contract_types (name, sort_order) VALUES
    ('CDI', 1),
    ('CDD', 2);

-- Default leave types
INSERT OR IGNORE INTO leave_types (name, sort_order) VALUES
    ('Congé annuel', 1),
    ('Congé récupération', 2),
    ('Maladie', 3),
    ('Sans solde', 4),
    ('Exceptionnel', 5),
    ('Maternité', 6),
    ('Accident travail', 7),
    ('Formation', 8),
    ('Mission', 9),
    ('Mutation', 10),
    ('Détachement', 11),
    ('Mise à pied', 12);

-- Default admin user (password: admin123 — to be changed on first login)
INSERT OR IGNORE INTO users (username, password_hash, role, display_name) VALUES
    ('admin', '$2a$10$placeholder_hash_replace_on_first_run', 'Admin', 'Administrateur');

-- Default app settings
INSERT OR IGNORE INTO app_settings (key, value, category, description) VALUES
    ('app_name', 'HR Track', 'general', 'Nom de l''application'),
    ('app_version', '1.0.0', 'general', 'Version de l''application'),
    ('language', 'fr', 'general', 'Langue de l''interface'),
    ('currency', 'DA', 'general', 'Devise'),
    ('date_format', 'DD/MM/YYYY', 'general', 'Format de date'),
    ('surete_interne_cdd_only', 'true', 'business_rules', 'Sûreté Interne accepte uniquement les contrats CDD'),
    ('medical_guest_restricted', 'true', 'business_rules', 'Les invités ne peuvent pas voir les détails médicaux');

-- Default company info (empty, to be filled by admin)
INSERT OR IGNORE INTO company_info (id, name) VALUES (1, '');
