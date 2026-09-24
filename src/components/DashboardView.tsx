import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Plus,
  Sparkles,
  AlertCircle,
  RotateCw,
  Send,
  CalendarCheck,
} from 'lucide-react';
import { EventItem, Category, User } from '../types';
import {
  isToday,
  formatTime,
  getEffectiveStartDateTime,
  getCountdownText,
  extractPreparationNotes,
  getDayGreeting,
} from '../utils/dateUtils';

interface DashboardViewProps {
  user: User;
  events: EventItem[];
  categories: Category[];
  onSelectEvent: (event: EventItem) => void;
  onToggleComplete: (eventId: string) => void;
  onNewEvent: () => void;
  onTriggerTestReminder: (eventId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  events,
  categories,
  onSelectEvent,
  onToggleComplete,
  onNewEvent,
  onTriggerTestReminder,
}) => {
  const [now, setNow] = useState<Date>(new Date());

  // Ticking clock for countdown accuracy
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const getCategory = (catId: string) => categories.find((c) => c.id === catId);

  // Filter events for today
  const todayEvents = events
    .filter((e) => isToday(e.startDateTime, user.timezone))
    .sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

  const completedToday = todayEvents.filter((e) => e.completed).length;
  const remainingToday = todayEvents.length - completedToday;

  // Next upcoming event (incomplete, closest start time in future or within last 30m)
  const nextEvent = events
    .filter((e) => !e.completed)
    .map((e) => ({
      event: e,
      effectiveStart: getEffectiveStartDateTime(e, now),
    }))
    .filter((item) => item.effectiveStart.getTime() > now.getTime() - 30 * 60 * 1000)
    .sort((a, b) => a.effectiveStart.getTime() - b.effectiveStart.getTime())[0]?.event;

  const nextEventCountdown = nextEvent ? getCountdownText(nextEvent, now) : null;
  const nextEventPrepNotes = nextEvent ? extractPreparationNotes(nextEvent.description) : [];

  // Upcoming in next 7 days
  const upcomingWeekCount = events.filter((e) => {
    if (e.completed) return false;
    const start = getEffectiveStartDateTime(e, now).getTime();
    return start > now.getTime() && start < now.getTime() + 7 * 86400000;
  }).length;

  const greeting = getDayGreeting(user.timezone);
  const firstName = user.name.split(' ')[0] || 'Collins';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Greeting & Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening with your schedule today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => nextEvent && onTriggerTestReminder(nextEvent.id)}
            disabled={!nextEvent}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Immediately fires scheduler and dispatches preview email"
          >
            <Send className="w-3.5 h-3.5 text-blue-600" />
            <span>Test Reminder Now</span>
          </button>
          <button
            onClick={onNewEvent}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* 2. Dynamic Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Events Today
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-900 tabular-nums">
              {todayEvents.length}
            </span>
            <span className="text-xs text-slate-500">scheduled</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Completed
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-emerald-600 tabular-nums">
              {completedToday}
            </span>
            <span className="text-xs text-slate-500">done</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Remaining
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-blue-600 tabular-nums">
              {remainingToday}
            </span>
            <span className="text-xs text-slate-500">left today</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Upcoming This Week
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-indigo-600 tabular-nums">
              {upcomingWeekCount}
            </span>
            <span className="text-xs text-slate-500">in 7 days</span>
          </div>
        </div>
      </div>

      {/* 3. Next Event Feature Spotlight & Preparation Box */}
      {nextEvent ? (
        <div className="p-6 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 border border-blue-200/80 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Next Event</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500 font-normal">
                  {nextEventCountdown?.text}
                </span>
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  {nextEvent.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>
                      {formatTime(nextEvent.startDateTime, user.timezone)}
                      {nextEvent.endDateTime && ` – ${formatTime(nextEvent.endDateTime, user.timezone)}`}
                    </span>
                  </div>
                  {nextEvent.location && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{nextEvent.location}</span>
                    </div>
                  )}
                  {getCategory(nextEvent.categoryId) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getCategory(nextEvent.categoryId)?.color }}
                      />
                      <span>{getCategory(nextEvent.categoryId)?.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 38: Preparation Concept */}
              {nextEventPrepNotes.length > 0 && (
                <div className="mt-4 p-3.5 bg-white/90 border border-blue-100 rounded-xl">
                  <div className="text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>What you should know:</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    {nextEventPrepNotes.map((note, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex sm:flex-row lg:flex-col gap-2 shrink-0 self-start">
              <button
                onClick={() => onSelectEvent(nextEvent)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
              >
                <span>View Event</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onToggleComplete(nextEvent.id)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark Completed</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-full mb-1">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">You're all clear!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No upcoming events right now. Take a break or plan your next priority.
          </p>
        </div>
      )}

      {/* 4. Today's Timeline Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Today's Timeline</h2>
            <p className="text-xs text-slate-500 mt-0.5">Chronological schedule for today</p>
          </div>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {todayEvents.length} {todayEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {todayEvents.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-slate-500">No events scheduled for today.</p>
            <button
              onClick={onNewEvent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Event for Today</span>
            </button>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {todayEvents.map((evt) => {
              const cat = getCategory(evt.categoryId);
              return (
                <div key={evt.id} className="relative group">
                  {/* Timeline point */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-colors ${
                      evt.completed
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-blue-600 text-blue-600'
                    }`}
                  >
                    {evt.completed && <CheckCircle2 className="w-3 h-3 fill-emerald-500 text-white" />}
                  </div>

                  <div className="flex items-start justify-between gap-4 p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
                          {formatTime(evt.startDateTime, user.timezone)}
                        </span>
                        {cat && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span>{cat.name}</span>
                            </span>
                          </>
                        )}
                        {evt.recurrenceType !== 'NONE' && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-[11px] text-slate-400 capitalize">
                              {evt.recurrenceType.toLowerCase()}
                            </span>
                          </>
                        )}
                      </div>

                      <h3
                        onClick={() => onSelectEvent(evt)}
                        className={`text-sm font-semibold cursor-pointer transition-colors ${
                          evt.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 group-hover:text-blue-600'
                        }`}
                      >
                        {evt.title}
                      </h3>

                      {evt.location && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{evt.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onToggleComplete(evt.id)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                          evt.completed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {evt.completed ? '✓ Completed' : 'Mark Done'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
