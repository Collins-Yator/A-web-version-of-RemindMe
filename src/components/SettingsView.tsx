import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Bell,
  Mail,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { User } from '../types';
import { reminderScheduler } from '../services/reminderScheduler';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (updated: User) => void;
  onResetData: () => void;
  onTriggerTestReminder: () => void;
}

const COMMON_TIMEZONES = [
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT, UTC+3)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST, UTC+4)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+9)' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUpdateUser,
  onResetData,
  onTriggerTestReminder,
}) => {
  const [formData, setFormData] = useState<User>(user);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [savedNotice, setSavedNotice] = useState(false);
  const [currentTimeInZone, setCurrentTimeInZone] = useState<string>('');

  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat('en-US', {
          timeZone: formData.timezone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(new Date());
        setCurrentTimeInZone(timeStr);
      } catch {
        setCurrentTimeInZone(new Date().toLocaleString());
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [formData.timezone]);

  const handleRequestBrowserPermission = async () => {
    const res = await reminderScheduler.requestNotificationPermission();
    setBrowserPermission(res);
    if (res === 'granted') {
      const updated = { ...formData, browserNotificationsEnabled: true };
      setFormData(updated);
      onUpdateUser(updated);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/70 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your account, notification channels, timezone, and delivery endpoints
          </p>
        </div>
        {savedNotice && (
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences saved!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Account & Profile Card */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-sm font-bold text-slate-900">
            <UserIcon className="w-4 h-4 text-blue-600" />
            <span>Account Profile</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <img
              src={formData.profileImageUrl || '/src/assets/images/avatar_collins_user_1790251911977.jpg'}
              alt={formData.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{formData.name}</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-blue-700 bg-blue-50 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Google Account Linked</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">{formData.email}</p>
              <p className="text-[11px] text-slate-400 font-mono">
                OAuth ID: {formData.googleId}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Google Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* 2. Notification Preferences */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-sm font-bold text-slate-900">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>Reminder Delivery Preferences</span>
          </div>

          <div className="space-y-4">
            {/* Email Reminders Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-xl">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <Mail className="w-4 h-4 text-slate-600" />
                  <span>Email Reminders</span>
                </div>
                <p className="text-xs text-slate-500">
                  Receive automated HTML email notifications before scheduled events
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emailRemindersEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, emailRemindersEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Browser Notifications Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-xl">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <Bell className="w-4 h-4 text-slate-600" />
                  <span>Browser Web Notifications</span>
                </div>
                <p className="text-xs text-slate-500">
                  Show native desktop notifications and sound alerts when events approach
                </p>
                {browserPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={handleRequestBrowserPermission}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline mt-1"
                  >
                    <span>Click here to grant browser permission</span>
                  </button>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.browserNotificationsEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, browserNotificationsEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Default Reminder Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Reminder Time for New Events
              </label>
              <select
                value={formData.defaultReminderMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultReminderMinutes: parseInt(e.target.value, 10),
                  })
                }
                className="w-full sm:w-64 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before (Default)</option>
                <option value={120}>2 hours before</option>
                <option value={1440}>24 hours before (1 day)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Time Zone Settings */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-sm font-bold text-slate-900">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Time Zone Configuration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                User Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                The default development timezone is <strong>Africa/Nairobi</strong> (EAT).
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Current Time in {formData.timezone}
              </span>
              <div className="flex items-center gap-2 text-base font-bold text-slate-900 font-mono tabular-nums">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{currentTimeInZone || 'Loading...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Development Email Configuration */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Development Email Routing</span>
            </div>
            <button
              type="button"
              onClick={onTriggerTestReminder}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Test Email</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Development Sender Email (Section 19)
              </label>
              <input
                type="email"
                value={formData.devSenderEmail}
                onChange={(e) => setFormData({ ...formData, devSenderEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Configured from REMINDME_EMAIL_SENDER</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Development Recipient Email (Section 19)
              </label>
              <input
                type="email"
                value={formData.devRecipientEmail}
                onChange={(e) => setFormData({ ...formData, devRecipientEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Configured from REMINDME_DEV_RECIPIENT</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={onResetData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data to Initial State</span>
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            Save All Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
