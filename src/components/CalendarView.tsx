import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { EventItem, Category, User } from '../types';
import {
  formatDate,
  formatTime,
  getOccurrencesForRange,
  isSameDay,
} from '../utils/dateUtils';

interface CalendarViewProps {
  user: User;
  events: EventItem[];
  categories: Category[];
  onSelectEvent: (event: EventItem) => void;
  onNewEventOnDate: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  user,
  events,
  categories,
  onSelectEvent,
  onNewEventOnDate,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const jumpToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  // Month grid calculations
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Month starts on Monday (0=Mon, 6=Sun)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6;

  const totalDays = lastDayOfMonth.getDate();

  // Preceding month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const calendarCells: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    calendarCells.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= totalDays; d++) {
    calendarCells.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  // Trailing days of next month to complete rows of 7
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  // Filter events by category if selected
  const filteredEvents = categoryFilter === 'ALL'
    ? events
    : events.filter((e) => e.categoryId === categoryFilter);

  // Get all occurrences for the visible month window
  const windowStart = calendarCells[0]?.date || firstDayOfMonth;
  const windowEnd = calendarCells[calendarCells.length - 1]?.date || lastDayOfMonth;

  const eventsOnDate = (date: Date) => {
    return filteredEvents.filter((event) => {
      const occurrences = getOccurrencesForRange(event, windowStart, windowEnd);
      return occurrences.some((occ) => isSameDay(occ.date, date, user.timezone));
    });
  };

  const selectedDayEvents = eventsOnDate(selectedDate);
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);

  const getCategory = (catId: string) => categories.find((c) => c.id === catId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {monthName}
          </h1>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={jumpToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => onNewEventOnDate(selectedDate)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Date</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Monthly Grid (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center text-xs font-semibold text-slate-500 py-2.5">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {calendarCells.map((cell, idx) => {
              const isSelected = isSameDay(cell.date, selectedDate, user.timezone);
              const isTodayCell = isSameDay(cell.date, new Date(), user.timezone);
              const cellEvents = eventsOnDate(cell.date);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(cell.date)}
                  className={`min-h-[96px] p-2 flex flex-col justify-between cursor-pointer transition-colors ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/40 text-slate-400'
                      : 'bg-white hover:bg-slate-50/70'
                  } ${isSelected ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold tabular-nums w-6 h-6 flex items-center justify-center rounded-full ${
                        isTodayCell
                          ? 'bg-blue-600 text-white font-bold'
                          : isSelected
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    {cellEvents.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                        {cellEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event indicator bars */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {cellEvents.slice(0, 2).map((evt) => {
                      const cat = getCategory(evt.categoryId);
                      return (
                        <div
                          key={evt.id}
                          className="px-1.5 py-0.5 text-[10px] font-medium rounded truncate text-slate-800 border-l-2 bg-slate-50"
                          style={{ borderLeftColor: cat?.color || '#2563EB' }}
                        >
                          {evt.title}
                        </div>
                      );
                    })}
                    {cellEvents.length > 2 && (
                      <div className="text-[10px] text-slate-400 pl-1">
                        +{cellEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Drawer / Sidebar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Selected Day
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {formatDate(selectedDate.toISOString(), user.timezone)}
              </h3>
            </div>
            <button
              onClick={() => onNewEventOnDate(selectedDate)}
              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              title="Add event on this date"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No events scheduled for this day.</p>
              <button
                onClick={() => onNewEventOnDate(selectedDate)}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                + Add Event
              </button>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[460px]">
              {selectedDayEvents.map((evt) => {
                const cat = getCategory(evt.categoryId);
                return (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="p-3 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/70 rounded-xl cursor-pointer transition-colors space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 font-mono tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{formatTime(evt.startDateTime, user.timezone)}</span>
                      </div>
                      {cat && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span>{cat.name}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {evt.title}
                    </h4>

                    {evt.location && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
