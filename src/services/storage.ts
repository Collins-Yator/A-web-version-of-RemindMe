import { User, Category, EventItem, Reminder, NotificationDelivery } from '../types';

const STORAGE_KEYS = {
  USER: 'remindme_user',
  CATEGORIES: 'remindme_categories',
  EVENTS: 'remindme_events',
  DELIVERIES: 'remindme_deliveries',
  INITIALIZED: 'remindme_initialized_v2',
};

export const DEFAULT_USER: User = {
  id: 'user_collins_1',
  googleId: 'google_oauth_10928374659102',
  email: 'yatorcollins44@gmail.com',
  name: 'Collins Yator',
  profileImageUrl: '/src/assets/images/avatar_collins_user_1790251911977.jpg',
  timezone: 'Africa/Nairobi',
  emailRemindersEnabled: true,
  browserNotificationsEnabled: true,
  defaultReminderMinutes: 60,
  devSenderEmail: 'yatorcollins44@gmail.com',
  devRecipientEmail: 'yatorcollins43@gmail.com',
  createdAt: '2026-01-15T08:00:00.000Z',
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_personal', userId: 'user_collins_1', name: 'Personal', color: '#2563EB', isDefault: true, createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'cat_work', userId: 'user_collins_1', name: 'Work', color: '#4F46E5', isDefault: true, createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'cat_school', userId: 'user_collins_1', name: 'School', color: '#7C3AED', isDefault: true, createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'cat_meeting', userId: 'user_collins_1', name: 'Meeting', color: '#0284C7', isDefault: true, createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'cat_appointment', userId: 'user_collins_1', name: 'Appointment', color: '#059669', isDefault: true, createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'cat_birthday', userId: 'user_collins_1', name: 'Birthday', color: '#E11D48', isDefault: true, createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'cat_exercise', userId: 'user_collins_1', name: 'Exercise', color: '#EA580C', isDefault: true, createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'cat_deadline', userId: 'user_collins_1', name: 'Deadline', color: '#DC2626', isDefault: true, createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'cat_important', userId: 'user_collins_1', name: 'Important', color: '#D97706', isDefault: true, createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'cat_other', userId: 'user_collins_1', name: 'Other', color: '#475569', isDefault: true, createdAt: '2026-01-15T08:00:00.000Z' },
];

function generateSeedEvents(): EventItem[] {
  const now = new Date();
  
  // Set today's next event roughly 47 minutes from now for immediate dynamic realism!
  const nextEventStart = new Date(now.getTime() + 47 * 60 * 1000);
  const nextEventEnd = new Date(nextEventStart.getTime() + 60 * 60 * 1000);

  // Set past events for today at 9am and 11am
  const today9am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
  const today11am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0);
  const today6pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);

  // Tomorrow deadline
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0, 0);
  // Next week
  const in3Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 10, 0, 0);

  return [
    {
      id: 'evt_next_meeting',
      userId: 'user_collins_1',
      title: 'Android Project Meeting',
      description: '• Bring your laptop\n• Review yesterday\'s architecture code\n• Prepare questions for the backend team',
      startDateTime: nextEventStart.toISOString(),
      endDateTime: nextEventEnd.toISOString(),
      location: 'Engineering Block, Room 304',
      categoryId: 'cat_work',
      recurrenceType: 'WEEKLY',
      completed: false,
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
      reminders: [
        { id: 'rem_1', eventId: 'evt_next_meeting', minutesBefore: 1440, emailEnabled: true, webNotificationEnabled: true, createdAt: now.toISOString() },
        { id: 'rem_2', eventId: 'evt_next_meeting', minutesBefore: 60, emailEnabled: true, webNotificationEnabled: true, createdAt: now.toISOString() },
        { id: 'rem_3', eventId: 'evt_next_meeting', minutesBefore: 15, emailEnabled: true, webNotificationEnabled: true, createdAt: now.toISOString() },
      ],
    },
    {
      id: 'evt_android_class',
      userId: 'user_collins_1',
      title: 'Android Development Class',
      description: 'Covers Kotlin coroutines, Jetpack Compose navigation, and Room database persistence.',
      startDateTime: today9am.toISOString(),
      endDateTime: new Date(today9am.getTime() + 105 * 60000).toISOString(),
      location: 'Engineering Block Lab 2',
      categoryId: 'cat_school',
      recurrenceType: 'WEEKLY',
      completed: true,
      completedAt: new Date(today9am.getTime() + 110 * 60000).toISOString(),
      createdAt: new Date(now.getTime() - 172800000).toISOString(),
      updatedAt: new Date(now.getTime() - 172800000).toISOString(),
      reminders: [
        { id: 'rem_4', eventId: 'evt_android_class', minutesBefore: 30, emailEnabled: true, webNotificationEnabled: true, createdAt: now.toISOString() },
      ],
    },
    {
      id: 'evt_team_sync',
      userId: 'user_collins_1',
      title: 'Team Standup & Sprint Sync',
      description: 'Review Jira backlog, Spring Boot backend endpoints progress, and API contract with frontend.',
      startDateTime: today11am.toISOString(),
      endDateTime: new Date(today11am.getTime() + 45 * 60000).toISOString(),
      location: 'Google Meet',
      categoryId: 'cat_work',
      recurrenceType: 'WEEKLY',
      completed: true,
      completedAt: new Date(today11am.getTime() + 50 * 60000).toISOString(),
      createdAt: new Date(now.getTime() - 172800000).toISOString(),
      updatedAt: new Date(now.getTime() - 172800000).toISOString(),
      reminders: [
        { id: 'rem_5', eventId: 'evt_team_sync', minutesBefore: 15, emailEnabled: true, webNotificationEnabled: true, createdAt: now.toISOString() },
      ],
    },
    {
      id: 'evt_gym',
      userId: 'user_collins_1',
      title: 'Gym & Strength Workout',
      description: 'Leg day + 20 minutes cardio treadmill session.',
      startDateTime: today6pm.toISOString(),
      endDateTime: new Date(today6pm.getTime() + 75 * 60000).toISOString(),
      location: 'Campus Fitness Center',
      categoryId: 'cat_exercise',
      recurrenceType: 'NONE',
      completed: false,
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
      reminders: [
        { id: 'rem_6', eventId: 'evt_gym', minutesBefore: 60, emailEnabled: true, webNotificationEnabled: true, createdAt: now.toISOString() },
      ],
    },
    {
      id: 'evt_assignment',
      userId: 'user_collins_1',
      title: 'Cloud Systems Architecture Deadline',
      description: 'Submit PDF report with system diagram, PostgreSQL schema, and performance benchmarking.',
      startDateTime: tomorrow.toISOString(),
      endDateTime: new Date(tomorrow.getTime() + 30 * 60000).toISOString(),
      location: 'Academic Portal',
      categoryId: 'cat_deadline',
      recurrenceType: 'NONE',
      completed: false,
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
      reminders: [
        { id: 'rem_7', eventId: 'evt_assignment', minutesBefore: 1440, emailEnabled: true, webNotificationEnabled: true, createdAt: now.toISOString() },
        { id: 'rem_8', eventId: 'evt_assignment', minutesBefore: 120, emailEnabled: true, webNotificationEnabled: true, createdAt: now.toISOString() },
      ],
    },
    {
      id: 'evt_workshop',
      userId: 'user_collins_1',
      title: 'Spring Boot 3 & Kotlin Masterclass',
      description: 'Hands-on live demo of Spring Data JPA, Flyway database migrations, and Coroutine integration.',
      startDateTime: in3Days.toISOString(),
      endDateTime: new Date(in3Days.getTime() + 120 * 60000).toISOString(),
      location: 'Science Auditorium & Livestream',
      categoryId: 'cat_school',
      recurrenceType: 'NONE',
      completed: false,
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
      reminders: [
        { id: 'rem_9', eventId: 'evt_workshop', minutesBefore: 1440, emailEnabled: true, webNotificationEnabled: true, createdAt: now.toISOString() },
        { id: 'rem_10', eventId: 'evt_workshop', minutesBefore: 60, emailEnabled: true, webNotificationEnabled: true, createdAt: now.toISOString() },
      ],
    },
    {
      id: 'evt_birthday',
      userId: 'user_collins_1',
      title: 'Annual Family Birthday Celebration',
      description: 'Dinner reservation and family gathering.',
      startDateTime: new Date(now.getFullYear(), 7, 17, 19, 0, 0).toISOString(), // Aug 17
      location: 'Nairobi Serena Restaurant',
      categoryId: 'cat_birthday',
      recurrenceType: 'YEARLY',
      completed: false,
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000).toISOString(),
      reminders: [
        { id: 'rem_11', eventId: 'evt_birthday', minutesBefore: 1440, emailEnabled: true, webNotificationEnabled: true, createdAt: now.toISOString() },
      ],
    },
  ];
}

export class StorageService {
  static getUser(): User {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_USER;
  }

  static saveUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  static getCategories(): Category[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CATEGORIES;
  }

  static saveCategories(categories: Category[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }

  static addCategory(category: Category): Category[] {
    const list = this.getCategories();
    list.push(category);
    this.saveCategories(list);
    return list;
  }

  static getEvents(): EventItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return generateSeedEvents();
  }

  static saveEvents(events: EventItem[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }

  static addEvent(event: EventItem): EventItem[] {
    const list = this.getEvents();
    list.unshift(event);
    this.saveEvents(list);
    return list;
  }

  static updateEvent(event: EventItem): EventItem[] {
    const list = this.getEvents().map((e) => (e.id === event.id ? event : e));
    this.saveEvents(list);
    return list;
  }

  static deleteEvent(eventId: string): EventItem[] {
    const list = this.getEvents().filter((e) => e.id !== eventId);
    this.saveEvents(list);
    return list;
  }

  static toggleEventCompleted(eventId: string): EventItem[] {
    const list = this.getEvents().map((e) => {
      if (e.id === eventId) {
        const nextState = !e.completed;
        return {
          ...e,
          completed: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return e;
    });
    this.saveEvents(list);
    return list;
  }

  static getDeliveries(): NotificationDelivery[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELIVERIES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  static saveDeliveries(deliveries: NotificationDelivery[]): void {
    localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
  }

  static addDelivery(delivery: NotificationDelivery): void {
    const list = this.getDeliveries();
    list.unshift(delivery);
    // Keep max 100 recent deliveries
    if (list.length > 100) list.pop();
    this.saveDeliveries(list);
  }

  static initialize(): void {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      this.saveUser(DEFAULT_USER);
      this.saveCategories(DEFAULT_CATEGORIES);
      this.saveEvents(generateSeedEvents());
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.DELIVERIES);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    this.initialize();
  }
}
