import React, { useState } from 'react';
import { NotificationAlert, Appointment, User } from '../types';
import { MessageSquare, Smartphone, CheckCheck, Bell } from 'lucide-react';

interface NotificationSimulatorProps {
  notifications: NotificationAlert[];
  appointments: Appointment[];
  currentUser?: User | null;
  onTriggerTestNotification?: (type: 'sms' | 'whatsapp') => void;
}

export const NotificationSimulator: React.FC<NotificationSimulatorProps> = ({
  notifications,
  appointments,
  currentUser,
  onTriggerTestNotification,
}) => {
  const [activeChannel, setActiveChannel] = useState<'all' | 'sms' | 'whatsapp'>('all');

  // Strictly filter appointments belonging ONLY to the currently logged-in user ID (or all if admin)
  const userAppointments = appointments.filter((apt) => {
    if (!currentUser?.id) return false;
    if (currentUser.role === 'admin') return true;
    return apt.patientId === currentUser.id;
  });

  // Strictly filter live session notifications for the current user ID
  const userSessionNotifications = notifications.filter((n) => {
    if (!currentUser?.id) return false;
    if (currentUser.role === 'admin') return true;
    return n.patientId === currentUser.id;
  });

  // Convert the user's real booked appointments into notification alerts
  const appointmentAlerts: NotificationAlert[] = userAppointments.map((apt) => ({
    id: `apt-notif-${apt.id}`,
    patientId: apt.patientId,
    type: 'whatsapp',
    recipient: apt.patientPhone || currentUser?.phone || currentUser?.email || 'Registered Contact',
    patientName: apt.patientName,
    title: `${apt.status === 'cancelled' ? 'Cancelled' : 'Confirmed'}: ${apt.tokenNumber}`,
    message: `Hello ${apt.patientName}, your OPD visit with ${apt.doctorName} at ${apt.hospitalName} on ${apt.appointmentDate} at ${apt.appointmentTime} is ${apt.status.replace('_', ' ')}. Token: ${apt.tokenNumber}.`,
    timestamp: new Date(apt.createdAt || Date.now()).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    status: 'delivered',
    tokenNumber: apt.tokenNumber,
  }));

  // Combine live triggered alerts with the user's own appointment alerts (deduplicated by token/id)
  const combinedAlerts: NotificationAlert[] = [
    ...userSessionNotifications,
    ...appointmentAlerts.filter(
      (a) => !userSessionNotifications.some((s) => s.tokenNumber === a.tokenNumber && s.title === a.title)
    ),
  ];

  const filtered = combinedAlerts.filter(
    (n) => activeChannel === 'all' || n.type === activeChannel
  );

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="glass-wood-panel rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#D4A373]">
              Patient Communications
            </p>
            {currentUser && (
              <span className="px-2.5 py-0.5 rounded-lg bg-white/15 border border-white/20 text-xs font-mono font-bold text-[#68D8CB]">
                {currentUser.name} · {currentUser.id}
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            SMS & WhatsApp Alerts
          </h2>
          {currentUser && (
            <p className="text-xs font-mono text-[#E2D5C4]">
              Active Recipient: {currentUser.phone || currentUser.email}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onTriggerTestNotification && onTriggerTestNotification('whatsapp')}
            className="px-5 py-3 rounded-xl hospital-btn-primary font-semibold text-xs flex items-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Test WhatsApp</span>
          </button>
          <button
            onClick={() => onTriggerTestNotification && onTriggerTestNotification('sms')}
            className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-semibold text-xs flex items-center gap-2 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Test SMS</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'whatsapp', 'sms'] as const).map((ch) => (
          <button
            key={ch}
            onClick={() => setActiveChannel(ch)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all ${
              activeChannel === ch
                ? 'bg-[#6E4731] text-white'
                : 'glass-pill text-[#5A483C]'
            }`}
          >
            {ch === 'all' ? `All (${combinedAlerts.length})` : ch}
          </button>
        ))}
      </div>

      {/* Message Cards Grid or Empty State */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-3xl p-14 text-center space-y-3">
          <Bell className="w-10 h-10 text-[#A67B5B] mx-auto" />
          <h3 className="text-base font-bold text-[#2C221E]">
            No Alerts Yet for {currentUser?.name || 'This Account'}
          </h3>
          <p className="text-xs text-[#6E5D53] max-w-sm mx-auto">
            Book an appointment or click &ldquo;Test WhatsApp&rdquo; / &ldquo;Test SMS&rdquo; above to dispatch an alert to {currentUser?.phone || currentUser?.email || 'your account'}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl p-7 glass-card space-y-4"
            >
              <div className="flex items-center justify-between text-xs text-[#6E5D53]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1F6E66] uppercase">
                    {item.type}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[#2C221E]">{item.recipient}</span>
                </div>

                <span className="flex items-center gap-1 text-[#1F6E66] font-semibold">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Delivered</span>
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#2C221E] text-base">{item.title}</h4>
                <p className="p-4 rounded-2xl bg-white/70 border border-[#D8C7B2]/60 text-xs text-[#3E3027] leading-relaxed">
                  {item.message}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-[#6E5D53] font-mono">
                <span>{item.timestamp}</span>
                {item.tokenNumber && <span className="text-[#6E4731] font-bold">{item.tokenNumber}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
