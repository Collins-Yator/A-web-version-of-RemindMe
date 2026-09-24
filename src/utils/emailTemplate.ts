import { EventItem, Category } from '../types';
import { formatDate, formatTime } from './dateUtils';

export interface EmailRenderOptions {
  event: EventItem;
  category?: Category;
  minutesBefore: number;
  recipientEmail: string;
  senderEmail: string;
  timezone: string;
  appUrl?: string;
}

export function generateReminderEmailHtml(options: EmailRenderOptions): string {
  const { event, category, minutesBefore, recipientEmail, timezone, appUrl = window.location.origin } = options;

  let timeNotice = `Your event starts in ${minutesBefore} minutes.`;
  if (minutesBefore === 60) {
    timeNotice = 'Your event starts in 1 hour.';
  } else if (minutesBefore === 1440) {
    timeNotice = 'Your event starts in 24 hours (1 day).';
  } else if (minutesBefore > 60 && minutesBefore % 60 === 0) {
    timeNotice = `Your event starts in ${minutesBefore / 60} hours.`;
  }

  const dateFormatted = formatDate(event.startDateTime, timezone);
  const timeFormatted = formatTime(event.startDateTime, timezone);
  const categoryName = category?.name || 'General';
  const categoryColor = category?.color || '#2563EB';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RemindMe: ${event.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 580px;
      margin: 40px auto;
      background-color: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      padding: 24px 32px;
      background-color: #0F172A;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin: 0;
      color: #FFFFFF;
    }
    .brand-tagline {
      font-size: 11px;
      color: #94A3B8;
      margin: 2px 0 0 0;
    }
    .content {
      padding: 32px;
    }
    .kicker {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #2563EB;
      margin-bottom: 8px;
    }
    .event-title {
      font-size: 24px;
      font-weight: 700;
      color: #0F172A;
      margin: 0 0 20px 0;
      line-height: 1.3;
    }
    .card-meta {
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 18px 20px;
      margin-bottom: 24px;
    }
    .meta-row {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      font-size: 15px;
      color: #334155;
    }
    .meta-row:last-child {
      margin-bottom: 0;
    }
    .meta-icon {
      font-size: 16px;
      margin-right: 12px;
      width: 20px;
      text-align: center;
    }
    .alert-banner {
      background-color: #EFF6FF;
      border-left: 4px solid #2563EB;
      padding: 14px 18px;
      border-radius: 4px;
      margin-bottom: 24px;
      font-size: 15px;
      font-weight: 500;
      color: #1E40AF;
    }
    .prep-box {
      background-color: #FAF5FF;
      border: 1px solid #E9D5FF;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .prep-title {
      font-size: 13px;
      font-weight: 600;
      color: #6B21A8;
      margin: 0 0 8px 0;
    }
    .prep-list {
      margin: 0;
      padding-left: 20px;
      font-size: 14px;
      color: #581C87;
    }
    .prep-list li {
      margin-bottom: 4px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 24px 0;
    }
    .btn-primary {
      display: inline-block;
      background-color: #2563EB;
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 12px 28px;
      border-radius: 8px;
    }
    .footer {
      border-top: 1px solid #E2E8F0;
      padding: 20px 32px;
      background-color: #F8FAFC;
      font-size: 12px;
      color: #64748B;
      text-align: center;
    }
    .category-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: ${categoryColor};
      margin-right: 6px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div>
        <h1 class="brand-title">RemindMe</h1>
        <p class="brand-tagline">Never forget what matters.</p>
      </div>
      <div style="font-size: 11px; color: #94A3B8;">
        Timezone: ${timezone}
      </div>
    </div>

    <div class="content">
      <div class="kicker">Upcoming Event Reminder</div>
      <h2 class="event-title">${escapeHtml(event.title)}</h2>

      <div class="alert-banner">
        🔔 ${timeNotice}
      </div>

      <div class="card-meta">
        <div class="meta-row">
          <span class="meta-icon">📅</span>
          <span><strong>Date:</strong> ${dateFormatted}</span>
        </div>
        <div class="meta-row">
          <span class="meta-icon">🕒</span>
          <span><strong>Time:</strong> ${timeFormatted}</span>
        </div>
        ${
          event.location
            ? `<div class="meta-row">
          <span class="meta-icon">📍</span>
          <span><strong>Location:</strong> ${escapeHtml(event.location)}</span>
        </div>`
            : ''
        }
        <div class="meta-row">
          <span class="meta-icon"><span class="category-indicator"></span></span>
          <span><strong>Category:</strong> ${escapeHtml(categoryName)}</span>
        </div>
      </div>

      ${
        event.description
          ? `<div class="prep-box">
        <div class="prep-title">Preparation / Event Notes:</div>
        <div style="font-size: 14px; color: #475569; white-space: pre-line;">${escapeHtml(event.description)}</div>
      </div>`
          : ''
      }

      <div class="btn-container">
        <a href="${appUrl}" class="btn-primary" target="_blank" rel="noopener">
          View Event in RemindMe
        </a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0;">This automated reminder was sent to <strong>${recipientEmail}</strong> based on your RemindMe notification preferences.</p>
      <p style="margin: 0;">— RemindMe Notification Engine (Spring Boot + Kotlin Architecture)</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
