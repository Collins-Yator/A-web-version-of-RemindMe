import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  ListTodo,
  Tags,
  Settings,
  Code2,
  BellRing,
  Globe,
  CheckCircle2,
  X,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  user: User;
  todayCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenCodeExplorer: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  user,
  todayCount,
  isOpenMobile,
  onCloseMobile,
  onOpenCodeExplorer,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: todayCount > 0 ? todayCount : undefined,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: CalendarDays,
    },
    {
      id: 'events',
      label: 'Events',
      icon: ListTodo,
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Tags,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: string) => {
    onSelectView(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shadow-xs">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight">RemindMe</span>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">Never forget what matters</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-600 md:hidden rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full tabular-nums ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => {
                onOpenCodeExplorer();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors"
            >
              <Code2 className="w-4 h-4 text-slate-400" />
              <span>Spring Boot Architecture</span>
            </button>
          </div>
        </nav>

        {/* User profile & Timezone footer */}
        <div className="p-3 m-3 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="flex items-center gap-3">
            <img
              src={user.profileImageUrl || '/src/assets/images/avatar_collins_user_1790251911977.jpg'}
              alt={user.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                <span title="Google OAuth Verified" className="inline-flex">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[120px]">{user.timezone}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded font-medium">
              OAuth 2.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
