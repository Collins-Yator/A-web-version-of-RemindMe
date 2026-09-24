import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Bell,
  Repeat,
  CheckCircle2,
  Trash2,
  Edit,
  Sparkles,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { EventItem, Category, User } from '../types';
import {
  formatDate,
  formatTime,
  getCountdownText,
  extractPreparationNotes,
} from '../utils/dateUtils';

interface EventDetailModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: EventItem) => void;
  onDelete: (eventId: string) => void;
  onToggleComplete: (eventId: string) => void;
  onTriggerTestReminder: (eventId: string) => void;
  categories: Category[];
  user: User;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
  onTriggerTestReminder,
  categories,
  user,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !event) return null;

  const category = categories.find((c) => c.id === event.categoryId);
  const countdown = getCountdownText(event, new Date());
  const prepNotes = extractPreparationNotes(event.description);

  const handleDeleteConfirmed = () => {
    onDelete(event.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg my-8 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              {category && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </span>
              )}
              {event.recurrenceType !== 'NONE' && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Repeat className="w-3 h-3 text-slate-400" />
                    <span className="capitalize">Every {event.recurrenceType.toLowerCase()}</span>
                  </span>
                </>
              )}
            </div>

            <h2
              className={`text-xl font-bold tracking-tight ${
                event.completed ? 'line-through text-slate-400' : 'text-slate-900'
              }`}
            >
              {event.title}
            </h2>
          </div>

          <button
            onClick={() => {
              setShowDeleteConfirm(false);
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Status Alert & Countdown */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              event.completed
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : 'bg-blue-50/80 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {event.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-blue-600" />
              )}
              <span className="font-semibold">
                {event.completed ? 'Event marked as completed' : countdown.text}
              </span>
            </div>
            <button
              onClick={() => onToggleComplete(event.id)}
              className="font-medium underline hover:opacity-80 transition-opacity"
            >
              {event.completed ? 'Mark as Upcoming' : 'Mark as Done'}
            </button>
          </div>

          {/* Date, Time & Location Details */}
          <div className="space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 text-xs">
            <div className="flex items-center gap-3 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong className="text-slate-900">Date:</strong>{' '}
                {formatDate(event.startDateTime, user.timezone)}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-700">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong className="text-slate-900">Time:</strong>{' '}
                {formatTime(event.startDateTime, user.timezone)}
                {event.endDateTime && ` – ${formatTime(event.endDateTime, user.timezone)}`}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-3 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900">Location:</strong> {event.location}
                </span>
              </div>
            )}
          </div>

          {/* Preparation & Description */}
          {prepNotes.length > 0 && (
            <div className="p-4 bg-amber-50/40 border border-amber-200/60 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Preparation / Event Notes:</span>
              </div>
              <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                {prepNotes.map((note, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Configured Reminders */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-blue-600" />
              <span>Configured Reminders ({event.reminders.length})</span>
            </h4>
            {event.reminders.length === 0 ? (
              <p className="text-xs text-slate-400">No automated reminders configured.</p>
            ) : (
              <div className="space-y-1.5">
                {event.reminders.map((r, idx) => {
                  const label =
                    r.minutesBefore === 60
                      ? '1 hour before'
                      : r.minutesBefore === 1440
                      ? '24 hours before'
                      : `${r.minutesBefore} minutes before`;
                  return (
                    <div
                      key={r.id || idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg text-xs"
                    >
                      <span className="font-medium text-slate-800">{label}</span>
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        {r.emailEnabled && <span>Email ✓</span>}
                        {r.webNotificationEnabled && <span>Browser ✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 13: Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-900">Delete Event?</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    Are you sure you want to delete <strong>"{event.title}"</strong>? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirmed}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Delete Event
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerTestReminder(event.id)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              title="Test reminder dispatch"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Test Reminder</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEdit(event);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
