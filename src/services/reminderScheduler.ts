import { EventItem, NotificationDelivery, User, Category } from '../types';
import { StorageService } from './storage';
import { getEffectiveStartDateTime } from '../utils/dateUtils';
import { generateReminderEmailHtml } from '../utils/emailTemplate';

type NotificationListener = (delivery: NotificationDelivery) => void;
type SchedulerStatusListener = (active: boolean, lastRun: Date) => void;

class ReminderSchedulerService {
  private timerId: number | null = null;
  private isProcessing: boolean = false;
  private listeners: Set<NotificationListener> = new Set();
  private statusListeners: Set<SchedulerStatusListener> = new Set();
  private lastRunTime: Date = new Date();

  // Play subtle web audio notification chime
  private playChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Audio autoplay policy might block before first user interaction
    }
  }

  // Request browser permission for notifications
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeStatus(listener: SchedulerStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private notifyListeners(delivery: NotificationDelivery): void {
    this.listeners.forEach((fn) => {
      try {
        fn(delivery);
      } catch (e) {
        console.error('Error in notification listener:', e);
      }
    });
  }

  private notifyStatus(): void {
    this.statusListeners.forEach((fn) => {
      try {
        fn(this.timerId !== null, this.lastRunTime);
      } catch (e) {
        console.error('Error in status listener:', e);
      }
    });
  }

  public start(): void {
    if (this.timerId !== null) return;
    this.runCheckCycle();
    // Run cycle every 10 seconds for real-time reactivity
    this.timerId = window.setInterval(() => {
      this.runCheckCycle();
    }, 10000);
    this.notifyStatus();
  }

  public stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notifyStatus();
  }

  /**
   * Main idempotent scheduler execution cycle
   */
  public async runCheckCycle(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.lastRunTime = new Date();

    try {
      const user = StorageService.getUser();
      const events = StorageService.getEvents();
      const categories = StorageService.getCategories();
      const deliveries = StorageService.getDeliveries();

      const existingDeliveryKeys = new Set(
        deliveries.map((d) => `${d.reminderId}_${d.scheduledFor}_${d.notificationType}`)
      );

      const now = new Date();

      for (const event of events) {
        if (event.completed) continue;

        const effectiveStart = getEffectiveStartDateTime(event, now);
        const startTimeMs = effectiveStart.getTime();

        // Do not notify for events more than 2 hours in the past
        if (startTimeMs < now.getTime() - 2 * 60 * 60 * 1000) {
          continue;
        }

        const category = categories.find((c) => c.id === event.categoryId);

        for (const reminder of event.reminders) {
          const triggerTimeMs = startTimeMs - reminder.minutesBefore * 60 * 1000;
          const scheduledIso = effectiveStart.toISOString();

          // Check if due: trigger time has arrived (or is within 1 minute grace window)
          if (now.getTime() >= triggerTimeMs) {
            // Check Email Notification
            if (reminder.emailEnabled && user.emailRemindersEnabled) {
              const emailKey = `${reminder.id}_${scheduledIso}_EMAIL`;
              if (!existingDeliveryKeys.has(emailKey)) {
                existingDeliveryKeys.add(emailKey);
                await this.processEmailDelivery(user, event, category, reminder, scheduledIso);
              }
            }

            // Check Browser Web Notification
            if (reminder.webNotificationEnabled && user.browserNotificationsEnabled) {
              const browserKey = `${reminder.id}_${scheduledIso}_BROWSER`;
              if (!existingDeliveryKeys.has(browserKey)) {
                existingDeliveryKeys.add(browserKey);
                await this.processBrowserDelivery(user, event, reminder, scheduledIso);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error during reminder scheduler cycle:', err);
    } finally {
      this.isProcessing = false;
      this.notifyStatus();
    }
  }

  private async processEmailDelivery(
    user: User,
    event: EventItem,
    category: Category | undefined,
    reminder: { id: string; minutesBefore: number },
    scheduledIso: string
  ): Promise<void> {
    const recipient = user.devRecipientEmail || user.email;
    const sender = user.devSenderEmail || 'yatorcollins44@gmail.com';

    const htmlBody = generateReminderEmailHtml({
      event,
      category,
      minutesBefore: reminder.minutesBefore,
      recipientEmail: recipient,
      senderEmail: sender,
      timezone: user.timezone,
    });

    const delivery: NotificationDelivery = {
      id: `del_email_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reminderId: reminder.id,
      eventId: event.id,
      eventTitle: event.title,
      scheduledFor: scheduledIso,
      notificationType: 'EMAIL',
      status: 'SENT',
      sentAt: new Date().toISOString(),
      errorMessage: null,
      recipientEmail: recipient,
      emailSubject: `RemindMe: Upcoming Event — ${event.title}`,
      emailHtmlBody: htmlBody,
    };

    StorageService.addDelivery(delivery);
    this.notifyListeners(delivery);
  }

  private async processBrowserDelivery(
    _user: User,
    event: EventItem,
    reminder: { id: string; minutesBefore: number },
    scheduledIso: string
  ): Promise<void> {
    const minutes = reminder.minutesBefore;
    const timing = minutes === 60 ? 'in 1 hour' : minutes === 1440 ? 'tomorrow' : `in ${minutes} minutes`;
    const body = `${event.title} starts ${timing}.${event.location ? ' Location: ' + event.location : ''}`;

    this.playChime();

    // Trigger HTML5 Notification if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🔔 RemindMe', {
          body,
          icon: '/favicon.ico',
        });
      } catch {
        // Fallback handled by in-app toast
      }
    }

    const delivery: NotificationDelivery = {
      id: `del_web_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reminderId: reminder.id,
      eventId: event.id,
      eventTitle: event.title,
      scheduledFor: scheduledIso,
      notificationType: 'BROWSER',
      status: 'SENT',
      sentAt: new Date().toISOString(),
      errorMessage: null,
      emailSubject: `Browser Notification: ${event.title}`,
    };

    StorageService.addDelivery(delivery);
    this.notifyListeners(delivery);
  }

  /**
   * Manual dispatch for instant testing of reminder and email delivery
   */
  public async triggerTestReminderNow(eventId: string, minutesBefore: number = 60): Promise<NotificationDelivery> {
    const user = StorageService.getUser();
    const events = StorageService.getEvents();
    const categories = StorageService.getCategories();

    const event = events.find((e) => e.id === eventId) || events[0];
    const category = categories.find((c) => c.id === event?.categoryId);

    this.playChime();

    const recipient = user.devRecipientEmail || user.email;
    const sender = user.devSenderEmail || 'yatorcollins44@gmail.com';

    const htmlBody = generateReminderEmailHtml({
      event,
      category,
      minutesBefore,
      recipientEmail: recipient,
      senderEmail: sender,
      timezone: user.timezone,
    });

    const delivery: NotificationDelivery = {
      id: `del_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reminderId: `rem_test_${Date.now()}`,
      eventId: event.id,
      eventTitle: event.title,
      scheduledFor: new Date().toISOString(),
      notificationType: 'EMAIL',
      status: 'SENT',
      sentAt: new Date().toISOString(),
      errorMessage: null,
      recipientEmail: recipient,
      emailSubject: `[TEST] RemindMe: Upcoming Event — ${event.title}`,
      emailHtmlBody: htmlBody,
    };

    StorageService.addDelivery(delivery);
    this.notifyListeners(delivery);

    // Also trigger browser notification if allowed
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🔔 RemindMe Test: ${event.title}`, {
          body: `Test reminder: starts in ${minutesBefore} minutes at ${event.location || 'Scheduled location'}.`,
        });
      } catch {
        // Ignored
      }
    }

    return delivery;
  }
}

export const reminderScheduler = new ReminderSchedulerService();
