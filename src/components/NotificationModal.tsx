import React, { useState } from 'react';
import {
  X,
  Mail,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  ExternalLink,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { NotificationDelivery, EventItem } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveries: NotificationDelivery[];
  events: EventItem[];
  onTriggerTestReminder: (eventId: string) => void;
  initialSelectedDeliveryId?: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  deliveries,
  events,
  onTriggerTestReminder,
  initialSelectedDeliveryId,
}) => {
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    initialSelectedDeliveryId || null
  );

  if (!isOpen) return null;

  const selectedDelivery =
    deliveries.find((d) => d.id === selectedDeliveryId) || deliveries[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-4xl my-8 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Notification Deliveries & Email Previewer
              </h2>
              <p className="text-xs text-slate-500">
                Inspect live reminders dispatched by the Spring Boot scheduler & email templates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => events[0] && onTriggerTestReminder(events[0].id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Trigger Test Alert</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Two-Pane Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Left: Deliveries List */}
          <div className="md:col-span-1 overflow-y-auto p-3 space-y-1.5 bg-slate-50/50">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              Recent Transmissions ({deliveries.length})
            </div>

            {deliveries.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-slate-400 text-xs">
                <Bell className="w-6 h-6 mx-auto text-slate-300" />
                <p>No reminders triggered yet.</p>
                <button
                  onClick={() => events[0] && onTriggerTestReminder(events[0].id)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Send a test reminder now
                </button>
              </div>
            ) : (
              deliveries.map((del) => {
                const isSelected = selectedDelivery?.id === del.id;
                return (
                  <div
                    key={del.id}
                    onClick={() => setSelectedDeliveryId(del.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors border text-left ${
                      isSelected
                        ? 'bg-white border-blue-200 shadow-2xs'
                        : 'bg-white/70 border-slate-200/60 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-1.5 font-medium text-slate-600">
                        {del.notificationType === 'EMAIL' ? (
                          <Mail className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <Bell className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>{del.notificationType}</span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{del.status}</span>
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {del.eventTitle}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>{new Date(del.sentAt || del.scheduledFor).toLocaleTimeString()}</span>
                      {del.recipientEmail && (
                        <span className="truncate max-w-[120px] font-mono">
                          {del.recipientEmail.split('@')[0]}@...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Selected Delivery Detail / HTML Email Preview */}
          <div className="md:col-span-2 flex flex-col overflow-hidden bg-white">
            {selectedDelivery ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Email Meta Bar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedDelivery.emailSubject || selectedDelivery.eventTitle}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      ID: {selectedDelivery.id.substring(0, 16)}...
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>
                      <strong className="text-slate-800">Recipient:</strong>{' '}
                      <span className="font-mono">{selectedDelivery.recipientEmail || 'Browser Alert'}</span>
                    </div>
                    <div>
                      <strong className="text-slate-800">Delivered At:</strong>{' '}
                      {selectedDelivery.sentAt
                        ? new Date(selectedDelivery.sentAt).toLocaleString()
                        : 'Pending'}
                    </div>
                  </div>
                </div>

                {/* Body Preview */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-100/60">
                  {selectedDelivery.emailHtmlBody ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                      <div className="p-2.5 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                        <span>Rendered HTML Email Preview (Section 20)</span>
                        <span className="text-[10px] font-mono text-slate-400">CSS Responsive</span>
                      </div>
                      <iframe
                        title="Email Preview"
                        srcDoc={selectedDelivery.emailHtmlBody}
                        className="w-full h-[450px] border-0"
                      />
                    </div>
                  ) : (
                    <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-2">
                      <Bell className="w-8 h-8 text-blue-600 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Browser Push / System Web Notification
                      </h4>
                      <p className="text-xs text-slate-600">
                        Notification payload delivered to browser Notification API with audio chime.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Select a notification on the left to inspect its details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
