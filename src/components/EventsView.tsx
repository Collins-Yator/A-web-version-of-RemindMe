import React, { useState } from 'react';
import {
  Search,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Bell,
  CheckCircle2,
  Trash2,
  Edit,
  Repeat,
  ArrowUpDown,
} from 'lucide-react';
import { EventItem, Category, User } from '../types';
import { formatDate, formatTime } from '../utils/dateUtils';

interface EventsViewProps {
  user: User;
  events: EventItem[];
  categories: Category[];
  onSelectEvent: (event: EventItem) => void;
  onEditEvent: (event: EventItem) => void;
  onDeleteEvent: (event: EventItem) => void;
  onToggleComplete: (eventId: string) => void;
  onNewEvent: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  user,
  events,
  categories,
  onSelectEvent,
  onEditEvent,
  onDeleteEvent,
  onToggleComplete,
  onNewEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_ASC' | 'DATE_DESC' | 'TITLE'>('DATE_ASC');

  const getCategory = (catId: string) => categories.find((c) => c.id === catId);

  // Search & filter pipeline
  const filteredEvents = events
    .filter((event) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = event.title.toLowerCase().includes(q);
        const matchDesc = event.description?.toLowerCase().includes(q);
        const matchLoc = event.location?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }

      // 2. Status filter
      if (statusFilter === 'UPCOMING' && event.completed) return false;
      if (statusFilter === 'COMPLETED' && !event.completed) return false;

      // 3. Category filter
      if (categoryFilter !== 'ALL' && event.categoryId !== categoryFilter) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'DATE_ASC') {
        return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
      }
      if (sortBy === 'DATE_DESC') {
        return new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Search / Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Events Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, search, and manage your scheduled events and activities
          </p>
        </div>
        <button
          onClick={onNewEvent}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors self-start md:self-auto whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, description, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('UPCOMING')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'UPCOMING'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'COMPLETED'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="DATE_ASC">Date: Earliest First ↑</option>
              <option value="DATE_DESC">Date: Latest First ↓</option>
              <option value="TITLE">Title: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List Cards */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 bg-white border border-slate-200/80 rounded-2xl text-center space-y-3">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">No events matched your filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new event.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setCategoryFilter('ALL');
            }}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt) => {
            const cat = getCategory(evt.categoryId);
            return (
              <div
                key={evt.id}
                className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left content & metadata */}
                <div className="space-y-2 flex-1">
                  {/* Zero-Pill Unboxed Metadata Line with typographic separators · */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 font-mono tabular-nums">
                      {formatDate(evt.startDateTime, user.timezone)}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-mono tabular-nums">
                      {formatTime(evt.startDateTime, user.timezone)}
                    </span>
                    {cat && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span>{cat.name}</span>
                        </span>
                      </>
                    )}
                    {evt.recurrenceType !== 'NONE' && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Repeat className="w-3 h-3 text-slate-400" />
                          <span className="capitalize">{evt.recurrenceType.toLowerCase()}</span>
                        </span>
                      </>
                    )}
                    {evt.reminders.length > 0 && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Bell className="w-3 h-3 text-slate-400" />
                          <span>{evt.reminders.length} {evt.reminders.length === 1 ? 'alert' : 'alerts'}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => onSelectEvent(evt)}
                    className={`text-base font-semibold cursor-pointer transition-colors ${
                      evt.completed
                        ? 'line-through text-slate-400'
                        : 'text-slate-900 group-hover:text-blue-600'
                    }`}
                  >
                    {evt.title}
                  </h3>

                  {/* Location & Description preview */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    {evt.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{evt.location}</span>
                      </div>
                    )}
                    {evt.description && (
                      <p className="text-slate-500 line-clamp-1 italic max-w-md">
                        {evt.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onToggleComplete(evt.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      evt.completed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {evt.completed ? '✓ Completed' : 'Mark Done'}
                  </button>

                  <button
                    onClick={() => onEditEvent(evt)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit event"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteEvent(evt)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
