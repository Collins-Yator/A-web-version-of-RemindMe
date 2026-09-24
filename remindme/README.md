# RemindMe — Event & Reminder Application

> **Never forget what matters.**  
> *Your time. Your events. Your reminders.*

RemindMe is a modern, production-grade event and activity management platform built with **Kotlin**, **Spring Boot 3**, and **PostgreSQL**. It allows authenticated users to create, schedule, categorize, and track daily activities with dynamic reminders, recurring occurrences, automated email delivery, and browser notifications.

---

## Architecture Overview

```text
Browser / Web Client
       │
       ▼
Spring Security (OAuth 2.0 Google Auth)
       │
       ▼
REST Controllers / Thymeleaf Web Controllers
       │
       ▼
Service Layer (Event, Category, Recurrence, Idempotency)
       │
       ▼
Spring Data JPA / Hibernate
       │
       ▼
PostgreSQL Database (Flyway Migrations V1, V2)

                ┌───────────────────────────────────┐
                │ Spring Task Scheduler (@Scheduled) │
                └─────────────────┬─────────────────┘
                                  │ (Every minute)
                                  ▼
                 Find Due & Active Event Reminders
                                  │
                                  ▼
                  Idempotency Check (No Duplicates)
                                  │
                                  ▼
                 Spring Mailer / Transactional SMTP
                                  │
                                  ▼
                   HTML Template Delivered to User
```

---

## Key Features

1. **Google OAuth 2.0 Authentication**  
   - Secure sign-in with Google, session management, and strict ownership authorization (users can only access their own records).

2. **Event Management (CRUD)**  
   - Create, view, edit, and delete events with date, start time, end time, location, categories, and preparation notes.
   - Fast client & server search over title, description, and location.

3. **Recurrence Engine**  
   - Supports `NONE`, `WEEKLY`, `MONTHLY`, and `YEARLY` recurrence without generating infinite redundant database rows.

4. **Multi-Reminder System**  
   - Configure multiple alerts per event (e.g., 24 hours before, 1 hour before, 15 minutes before).
   - Independent channels: **Email** and **Browser Web Notifications**.

5. **Automated Reminder Scheduler & Delivery Tracking**  
   - Scheduled task periodically scans due reminders, applies database-level idempotency locks (`notification_deliveries`), and dispatches responsive HTML emails.

6. **Preparation Concept**  
   - Real-time countdowns ("Starts in 47 minutes") paired with actionable preparation bullet points from the event details.

7. **Calendar & Timeline Views**  
   - Interactive monthly calendar with event density dots, quick date navigation, and today's chronological timeline.

8. **Category System**  
   - 10 default colored categories (Personal, Work, School, Meeting, Appointment, Birthday, Exercise, Deadline, Important, Other) plus custom user categories.

9. **Timezone Awareness**  
   - Native support for user timezones (default: `Africa/Nairobi`) using modern `java.time` APIs.

---

## Database Schema (Flyway)

- **`users`**: User profile, OAuth subject ID, timezone, notification preferences.
- **`categories`**: User-defined or default event classifications with distinct hex colors.
- **`events`**: Event titles, dates, descriptions, recurrence rules, and completion flags.
- **`reminders`**: Configured alerts with `minutes_before` offsets and channel toggles.
- **`notification_deliveries`**: Historical delivery audit logs preventing duplicate transmissions.

---

## Local Development Setup

### Prerequisites

- Java 17+ (Eclipse Temurin or OpenJDK)
- Docker & Docker Compose
- Gradle 8+

### Step 1: Start PostgreSQL and Mailpit

```bash
docker-compose up -d postgres mailpit
```

- PostgreSQL runs on `localhost:5432` (`remindme_user` / `remindme_password`)
- Mailpit Web UI runs on `http://localhost:8025` (to preview sent emails)
- Mailpit SMTP runs on `localhost:1025`

### Step 2: Configure Environment Variables

Create `.env` or set environment variables:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/remindme_db
export DB_USERNAME=remindme_user
export DB_PASSWORD=remindme_password
export GOOGLE_CLIENT_ID=your-google-client-id
export GOOGLE_CLIENT_SECRET=your-google-client-secret
export MAIL_HOST=localhost
export MAIL_PORT=1025
export REMINDME_EMAIL_SENDER=yatorcollins44@gmail.com
export REMINDME_DEV_RECIPIENT=yatorcollins43@gmail.com
```

### Step 3: Run the Application

```bash
./gradlew bootRun
```

Visit `http://localhost:8080`.

---

## Running Automated Tests

```bash
# Run unit & service tests
./gradlew test

# Run tests with test report
./gradlew check
```

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/events` | List authenticated user's events |
| `GET` | `/api/events/{id}` | Retrieve specific event |
| `POST` | `/api/events` | Create new event with reminders |
| `PUT` | `/api/events/{id}` | Update event properties |
| `PATCH` | `/api/events/{id}/toggle-complete` | Toggle completion status |
| `DELETE` | `/api/events/{id}` | Remove event |
| `GET` | `/api/events/search?query=...` | Search events |
| `GET` | `/api/events/stats` | Dashboard metrics |
| `GET` | `/api/categories` | List user categories |
| `POST` | `/api/categories` | Create custom category |
| `GET` | `/api/notifications/history` | View reminder delivery history |
