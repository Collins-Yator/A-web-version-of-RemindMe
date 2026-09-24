import React, { useState, useEffect, useCallback } from 'react';
import { User, Category, EventItem, NotificationDelivery } from './types';
import { StorageService } from './services/storage';
import { reminderScheduler } from './services/reminderScheduler';
import { isToday } from './utils/dateUtils';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { EventsView } from './components/EventsView';
import { CategoriesView } from './components/CategoriesView';
import { SettingsView } from './components/SettingsView';

import { EventModal } from './components/EventModal';
import { EventDetailModal } from './components/EventDetailModal';
import { NotificationModal } from './components/NotificationModal';
import { CodeExplorerModal } from './components/CodeExplorerModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export const App: React.FC = () => {
  // 1. Initial State
  const [user, setUser] = useState<User>(() => StorageService.getUser());
  const [categories, setCategories] = useState<Category[]>(() => StorageService.getCategories());
  const [events, setEvents] = useState<EventItem[]>(() => StorageService.getEvents());
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>(() =>
    StorageService.getDeliveries()
  );

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [schedulerActive, setSchedulerActive] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);
  const [defaultDateForNewEvent, setDefaultDateForNewEvent] = useState<Date | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<EventItem | null>(null);

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | undefined>();

  const [isCodeExplorerOpen, setIsCodeExplorerOpen] = useState<boolean>(false);

  // 2. Lifecycle & Scheduler startup
  useEffect(() => {
    StorageService.initialize();
    reminderScheduler.start();

    const unsubNotification = reminderScheduler.subscribe((delivery) => {
      setDeliveries(StorageService.getDeliveries());

      const isEmail = delivery.notificationType === 'EMAIL';
      addToast({
        title: isEmail ? 'Email Reminder Dispatched' : 'Event Reminder Alert',
        message: `${delivery.eventTitle} starts soon. ${
          isEmail ? `Sent to ${delivery.recipientEmail}` : 'Browser notification triggered'
        }.`,
        type: 'reminder',
        deliveryId: delivery.id,
      });
    });

    const unsubStatus = reminderScheduler.subscribeStatus((active) => {
      setSchedulerActive(active);
    });

    return () => {
      unsubNotification();
      unsubStatus();
      reminderScheduler.stop();
    };
  }, []);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Event Handlers
  const handleToggleComplete = useCallback((eventId: string) => {
    const updatedList = StorageService.toggleEventCompleted(eventId);
    setEvents(updatedList);
    const target = updatedList.find((e) => e.id === eventId);
    if (target) {
      addToast({
        title: target.completed ? 'Event Completed ✓' : 'Event Reopened',
        message: target.completed
          ? `Nice job completing "${target.title}"!`
          : `"${target.title}" marked as upcoming.`,
        type: 'success',
      });
    }
    // Also update detail modal if open
    setSelectedEventForDetail((prev) => (prev?.id === eventId ? target || null : prev));
  }, []);

  const handleSaveEvent = (savedEvent: EventItem) => {
    const existing = events.find((e) => e.id === savedEvent.id);
    let updatedList: EventItem[];
    if (existing) {
      updatedList = StorageService.updateEvent(savedEvent);
      addToast({
        title: 'Event Updated',
        message: `Changes to "${savedEvent.title}" have been saved.`,
        type: 'info',
      });
    } else {
      updatedList = StorageService.addEvent(savedEvent);
      addToast({
        title: 'Event Created',
        message: `"${savedEvent.title}" scheduled successfully with ${savedEvent.reminders.length} reminder(s).`,
        type: 'success',
      });
    }
    setEvents(updatedList);
    setIsEventModalOpen(false);
    setEventToEdit(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    const updated = StorageService.deleteEvent(eventId);
    setEvents(updated);
    addToast({
      title: 'Event Deleted',
      message: `"${target?.title || 'Event'}" has been removed.`,
      type: 'info',
    });
    setIsDetailModalOpen(false);
    setSelectedEventForDetail(null);
  };

  const handleTriggerTestReminder = async (eventId?: string) => {
    const targetId = eventId || events[0]?.id;
    if (!targetId) return;

    try {
      const delivery = await reminderScheduler.triggerTestReminderNow(targetId, 60);
      setDeliveries(StorageService.getDeliveries());
      addToast({
        title: 'Test Reminder Transmitted! 🔔',
        message: `Dispatched HTML email for "${delivery.eventTitle}" to ${delivery.recipientEmail}. Click to view preview.`,
        type: 'reminder',
        deliveryId: delivery.id,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenDetailModal = (event: EventItem) => {
    setSelectedEventForDetail(event);
    setIsDetailModalOpen(true);
  };

  const handleOpenEditModal = (event: EventItem) => {
    setEventToEdit(event);
    setIsEventModalOpen(true);
  };

  const handleNewEvent = (date?: Date) => {
    setEventToEdit(null);
    setDefaultDateForNewEvent(date || null);
    setIsEventModalOpen(true);
  };

  const handleUpdateUser = (updated: User) => {
    StorageService.saveUser(updated);
    setUser(updated);
  };

  const handleAddCategory = (newCat: Category) => {
    const updated = StorageService.addCategory(newCat);
    setCategories([...updated]);
    addToast({
      title: 'Category Created',
      message: `Category "${newCat.name}" is now available for events.`,
      type: 'success',
    });
  };

  const handleResetData = () => {
    if (window.confirm('Reset all events and preferences back to initial demo state?')) {
      StorageService.resetToDefault();
      setUser(StorageService.getUser());
      setCategories(StorageService.getCategories());
      setEvents(StorageService.getEvents());
      setDeliveries(StorageService.getDeliveries());
      addToast({
        title: 'Data Reset',
        message: 'Loaded default demo events, categories, and settings.',
        type: 'info',
      });
    }
  };

  const todayCount = events.filter(
    (e) => !e.completed && isToday(e.startDateTime, user.timezone)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        user={user}
        todayCount={todayCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenCodeExplorer={() => setIsCodeExplorerOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header */}
        <Header
          user={user}
          onNewEvent={() => handleNewEvent()}
          onOpenNotifications={() => {
            setSelectedDeliveryId(undefined);
            setIsNotificationModalOpen(true);
          }}
          onOpenCodeExplorer={() => setIsCodeExplorerOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          notificationCount={deliveries.length}
          schedulerActive={schedulerActive}
          activeView={activeView}
        />

        {/* View Router */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              user={user}
              events={events}
              categories={categories}
              onSelectEvent={handleOpenDetailModal}
              onToggleComplete={handleToggleComplete}
              onNewEvent={() => handleNewEvent()}
              onTriggerTestReminder={handleTriggerTestReminder}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarView
              user={user}
              events={events}
              categories={categories}
              onSelectEvent={handleOpenDetailModal}
              onNewEventOnDate={(d) => handleNewEvent(d)}
            />
          )}

          {activeView === 'events' && (
            <EventsView
              user={user}
              events={events}
              categories={categories}
              onSelectEvent={handleOpenDetailModal}
              onEditEvent={handleOpenEditModal}
              onDeleteEvent={(evt) => {
                setSelectedEventForDetail(evt);
                setIsDetailModalOpen(true);
              }}
              onToggleComplete={handleToggleComplete}
              onNewEvent={() => handleNewEvent()}
            />
          )}

          {activeView === 'categories' && (
            <CategoriesView
              user={user}
              categories={categories}
              events={events}
              onAddCategory={handleAddCategory}
              onFilterByCategory={(catId) => {
                setActiveView('events');
              }}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              user={user}
              onUpdateUser={handleUpdateUser}
              onResetData={handleResetData}
              onTriggerTestReminder={() => handleTriggerTestReminder()}
            />
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
        }}
        onSave={handleSaveEvent}
        eventToEdit={eventToEdit}
        defaultDate={defaultDateForNewEvent}
        categories={categories}
        user={user}
      />

      <EventDetailModal
        event={selectedEventForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEventForDetail(null);
        }}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteEvent}
        onToggleComplete={handleToggleComplete}
        onTriggerTestReminder={handleTriggerTestReminder}
        categories={categories}
        user={user}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        deliveries={deliveries}
        events={events}
        onTriggerTestReminder={handleTriggerTestReminder}
        initialSelectedDeliveryId={selectedDeliveryId}
      />

      <CodeExplorerModal
        isOpen={isCodeExplorerOpen}
        onClose={() => setIsCodeExplorerOpen(false)}
      />

      {/* Floating Toast Notification Stack */}
      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        onOpenNotification={(deliveryId) => {
          setSelectedDeliveryId(deliveryId);
          setIsNotificationModalOpen(true);
        }}
      />
    </div>
  );
};

export default App;
