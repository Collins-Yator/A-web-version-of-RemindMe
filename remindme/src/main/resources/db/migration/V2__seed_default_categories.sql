-- RemindMe Schema Initialization
-- Migration V2: Seed Default Categories function / trigger template

-- Seed system template category definitions (can be copied for new users upon signup)
CREATE TABLE IF NOT EXISTS default_category_templates (
    name VARCHAR(100) PRIMARY KEY,
    color VARCHAR(32) NOT NULL
);

INSERT INTO default_category_templates (name, color) VALUES
    ('Personal', '#2563EB'),
    ('Work', '#4F46E5'),
    ('School', '#7C3AED'),
    ('Meeting', '#0284C7'),
    ('Appointment', '#059669'),
    ('Birthday', '#E11D48'),
    ('Exercise', '#EA580C'),
    ('Deadline', '#DC2626'),
    ('Important', '#D97706'),
    ('Other', '#475569')
ON CONFLICT (name) DO NOTHING;
