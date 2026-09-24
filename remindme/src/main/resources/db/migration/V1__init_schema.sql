-- RemindMe Schema Initialization
-- Migration V1: Core Tables and Indexes

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    google_id VARCHAR(128) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    profile_image_url TEXT,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Nairobi',
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    web_notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_reminder_minutes INT NOT NULL DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(32) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_category UNIQUE (user_id, name)
);

CREATE INDEX idx_categories_user ON categories(user_id);

CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date_time TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    recurrence_type VARCHAR(32) NOT NULL DEFAULT 'NONE',
    recurrence_end_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_start_time ON events(start_date_time);
CREATE INDEX idx_events_user_start ON events(user_id, start_date_time);

CREATE TABLE IF NOT EXISTS reminders (
    id VARCHAR(64) PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    minutes_before INT NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    web_notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_event ON reminders(event_id);

CREATE TABLE IF NOT EXISTS notification_deliveries (
    id VARCHAR(64) PRIMARY KEY,
    reminder_id VARCHAR(64) NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
    event_id VARCHAR(64) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    notification_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    recipient_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_reminder_delivery UNIQUE (reminder_id, scheduled_for, notification_type)
);

CREATE INDEX idx_deliveries_status ON notification_deliveries(status);
CREATE INDEX idx_deliveries_scheduled ON notification_deliveries(scheduled_for);
