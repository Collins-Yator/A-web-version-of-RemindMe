import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Bell, Clock, Calendar, MapPin, Sparkles } from 'lucide-react';
import { EventItem, Category, RecurrenceType, Reminder, User } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventItem) => void;
  eventToEdit?: EventItem | null;
  defaultDate?: Date | null;
  categories: Category[];
  user: User;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  eventToEdit,
  defaultDate,
  categories,
  user,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('10:00');
  const [hasEndTime, setHasEndTime] = useState(false);
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('NONE');
  const [reminders, setReminders] = useState<
    Array<{ id: string; minutesBefore: number; emailEnabled: boolean; webNotificationEnabled: boolean }>
  >([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      const start = new Date(eventToEdit.startDateTime);
      setDateStr(start.toISOString().split('T')[0]);
      setStartTimeStr(
        start.toTimeString().substring(0, 5)
      );

      if (eventToEdit.endDateTime) {
        setHasEndTime(true);
        const end = new Date(eventToEdit.endDateTime);
        setEndTimeStr(end.toTimeString().substring(0, 5));
      } else {
        setHasEndTime(false);
        setEndTimeStr('10:00');
      }

      setLocation(eventToEdit.location || '');
      setCategoryId(eventToEdit.categoryId || categories[0]?.id || '');
      setRecurrenceType(eventToEdit.recurrenceType);
      setReminders(
        eventToEdit.reminders.map((r) => ({
          id: r.id,
          minutesBefore: r.minutesBefore,
          emailEnabled: r.emailEnabled,
          webNotificationEnabled: r.webNotificationEnabled,
        }))
      );
    } else {
      // Default new event
      setTitle('');
      setDescription('');
      const targetDate = defaultDate || new Date();
      setDateStr(targetDate.toISOString().split('T')[0]);
      
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(Math.floor(now.getMinutes() / 15) * 15).padStart(2, '0');
      setStartTimeStr(`${hours}:${mins}`);
      
      setHasEndTime(false);
      setEndTimeStr('10:00');
      setLocation('');
      setCategoryId(categories[0]?.id || '');
      setRecurrenceType('NONE');
      // Default reminder: 60 minutes before
      setReminders([
        {
          id: `rem_${Date.now()}`,
          minutesBefore: user.defaultReminderMinutes || 60,
          emailEnabled: user.emailRemindersEnabled,
          webNotificationEnabled: user.browserNotificationsEnabled,
        },
      ]);
    }
    setErrors({});
  }, [eventToEdit, defaultDate, isOpen, categories, user]);

  if (!isOpen) return null;

  const handleAddReminder = () => {
    setReminders([
      ...reminders,
      {
        id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        minutesBefore: 15,
        emailEnabled: true,
        webNotificationEnabled: true,
      },
    ]);
  };

  const handleRemoveReminder = (index: number) => {
    setReminders(reminders.filter((_, idx) => idx !== index));
  };

  const handleUpdateReminder = (
    index: number,
    field: 'minutesBefore' | 'emailEnabled' | 'webNotificationEnabled',
    value: any
  ) => {
    const updated = [...reminders];
    updated[index] = { ...updated[index], [field]: value };
    setReminders(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Please enter an event title';
    }

    if (!dateStr) {
      newErrors.date = 'Date is required';
    }

    if (!startTimeStr) {
      newErrors.startTime = 'Start time is required';
    }

    const startIso = new Date(`${dateStr}T${startTimeStr}:00`).toISOString();
    let endIso: string | undefined = undefined;

    if (hasEndTime && endTimeStr) {
      const startMs = new Date(`${dateStr}T${startTimeStr}:00`).getTime();
      const endMs = new Date(`${dateStr}T${endTimeStr}:00`).getTime();
      if (endMs < startMs) {
        newErrors.endTime = 'End time cannot be earlier than start time';
      } else {
        endIso = new Date(`${dateStr}T${endTimeStr}:00`).toISOString();
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const eventId = eventToEdit ? eventToEdit.id : `evt_${Date.now()}`;

    const formattedReminders: Reminder[] = reminders.map((r) => ({
      id: r.id,
      eventId,
      minutesBefore: Number(r.minutesBefore),
      emailEnabled: r.emailEnabled,
      webNotificationEnabled: r.webNotificationEnabled,
      createdAt: new Date().toISOString(),
    }));

    const event: EventItem = {
      id: eventId,
      userId: user.id,
      title: title.trim(),
      description: description.trim(),
      startDateTime: startIso,
      endDateTime: endIso,
      location: location.trim() || undefined,
      categoryId,
      recurrenceType,
      completed: eventToEdit ? eventToEdit.completed : false,
      completedAt: eventToEdit ? eventToEdit.completedAt : undefined,
      createdAt: eventToEdit ? eventToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reminders: formattedReminders,
    };

    onSave(event);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-xl my-8 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            {eventToEdit ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Android Project Meeting, Team Sync, Doctor Appointment"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
              }`}
              autoFocus
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Date, Start Time, End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">End Time</label>
                <button
                  type="button"
                  onClick={() => setHasEndTime(!hasEndTime)}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  {hasEndTime ? 'Remove' : '+ Optional'}
                </button>
              </div>
              {hasEndTime ? (
                <input
                  type="time"
                  value={endTimeStr}
                  onChange={(e) => {
                    setEndTimeStr(e.target.value);
                    if (errors.endTime) setErrors({ ...errors, endTime: '' });
                  }}
                  className={`w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    errors.endTime ? 'border-red-400' : 'border-slate-200'
                  }`}
                />
              ) : (
                <div className="px-3 py-2 text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                  No end time
                </div>
              )}
            </div>
          </div>
          {errors.endTime && <p className="text-xs text-red-600">{errors.endTime}</p>}

          {/* Location & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Engineering Block, Google Meet"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recurrence Rule */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recurrence (Repeats)
            </label>
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="NONE">Does not repeat</option>
              <option value="WEEKLY">Every week</option>
              <option value="MONTHLY">Every month</option>
              <option value="YEARLY">Every year</option>
            </select>
          </div>

          {/* Preparation & Description Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Description & Preparation Notes</span>
              </label>
              <span className="text-[11px] text-slate-400">Optional bullet notes</span>
            </div>
            <textarea
              rows={3}
              placeholder="• Bring laptop&#10;• Review yesterday's code&#10;• Prepare questions"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            />
          </div>

          {/* Reminders Builder */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                <span>Configured Reminders</span>
              </label>
              <button
                type="button"
                onClick={handleAddReminder}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Reminder</span>
              </button>
            </div>

            {reminders.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No reminders configured for this event.
              </p>
            ) : (
              <div className="space-y-2">
                {reminders.map((rem, idx) => (
                  <div
                    key={rem.id || idx}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <select
                        value={rem.minutesBefore}
                        onChange={(e) =>
                          handleUpdateReminder(idx, 'minutesBefore', parseInt(e.target.value, 10))
                        }
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500"
                      >
                        <option value={15}>15 minutes before</option>
                        <option value={30}>30 minutes before</option>
                        <option value={60}>1 hour before</option>
                        <option value={120}>2 hours before</option>
                        <option value={1440}>24 hours (1 day) before</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-4 text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rem.emailEnabled}
                          onChange={(e) =>
                            handleUpdateReminder(idx, 'emailEnabled', e.target.checked)
                          }
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>Email</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rem.webNotificationEnabled}
                          onChange={(e) =>
                            handleUpdateReminder(idx, 'webNotificationEnabled', e.target.checked)
                          }
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span>Browser</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveReminder(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title="Remove reminder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
            >
              {eventToEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
