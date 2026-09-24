import React from 'react';
import { Plus, Bell, RefreshCw, Code2, Menu } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onNewEvent: () => void;
  onOpenNotifications: () => void;
  onOpenCodeExplorer: () => void;
  onToggleMobileMenu: () => void;
  notificationCount: number;
  schedulerActive: boolean;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onNewEvent,
  onOpenNotifications,
  onOpenCodeExplorer,
  onToggleMobileMenu,
  notificationCount,
  schedulerActive,
  activeView,
}) => {
  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Overview';
      case 'calendar':
        return 'Calendar Schedule';
      case 'events':
        return 'All Events';
      case 'categories':
        return 'Categories';
      case 'settings':
        return 'Settings';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      {/* Zone 1: Mobile toggle & View Brand Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 text-slate-600 hover:text-slate-900 md:hidden rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-900">RemindMe</span>
          <span aria-hidden="true">/</span>
          <span className="capitalize">{getViewTitle()}</span>
        </div>
      </div>

      {/* Zone 2: System Status & Architecture Link */}
      <div className="hidden lg:flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span
            className={`w-2 h-2 rounded-full ${
              schedulerActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span>Scheduler Active (Every 1m)</span>
        </div>
        <button
          onClick={onOpenCodeExplorer}
          className="flex items-center gap-1.5 px-2.5 py-1 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-md transition-colors"
          title="View Spring Boot & Kotlin backend architecture"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Kotlin Architecture</span>
        </button>
      </div>

      {/* Zone 3: Notification Bell, + New Event, User Avatar */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Reminder & Email Deliveries"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full tabular-nums">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onNewEvent}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <img
            src={user.profileImageUrl || '/src/assets/images/avatar_collins_user_1790251911977.jpg'}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="hidden sm:inline text-xs font-medium text-slate-700 max-w-[100px] truncate">
            {user.name.split(' ')[0]}
          </span>
        </div>
      </div>
    </header>
  );
};
