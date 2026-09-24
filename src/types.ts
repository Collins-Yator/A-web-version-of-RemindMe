export type RecurrenceType = 'NONE' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type DeliveryStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';

export type NotificationType = 'EMAIL' | 'BROWSER';

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  profileImageUrl: string;
  timezone: string;
  emailRemindersEnabled: boolean;
  browserNotificationsEnabled: boolean;
  defaultReminderMinutes: number;
  devRecipientEmail: string;
  devSenderEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  eventId: string;
  minutesBefore: number;
  emailEnabled: boolean;
  webNotificationEnabled: boolean;
  createdAt: string;
}

export interface EventItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  startDateTime: string; // ISO string
  endDateTime?: string; // ISO string
  location?: string;
  categoryId: string;
  recurrenceType: RecurrenceType;
  recurrenceEndDate?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  reminders: Reminder[];
}

export interface NotificationDelivery {
  id: string;
  reminderId: string;
  eventId: string;
  eventTitle: string;
  scheduledFor: string; // ISO string of reminder trigger
  notificationType: NotificationType;
  status: DeliveryStatus;
  sentAt: string | null;
  errorMessage: string | null;
  recipientEmail?: string;
  emailSubject?: string;
  emailHtmlBody?: string;
}

export interface DashboardStats {
  eventsToday: number;
  completedToday: number;
  remainingToday: number;
  upcomingThisWeek: number;
  totalEvents: number;
  activeReminders: number;
  deliveredReminders: number;
}
