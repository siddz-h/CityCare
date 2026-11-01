import React, { useState } from 'react';
import { Appointment, Doctor } from '../types';
import { api } from '../services/api';
import { Calendar, CheckCircle2, FileEdit, Users } from 'lucide-react';

interface DoctorPortalProps {
  appointments: Appointment[];
  doctors: Doctor[];
  currentUser: any;
  onRefresh: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  appointments,
  doctors,
  currentUser,
  onRefresh,
}) => {
  const currentDoc =
    doctors.find((d) => d.name.toLowerCase().includes(currentUser?.name?.toLowerCase() || 'sameer')) ||
    doctors[0];

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<'queue' | 'schedule'>('queue');

  const [consultingApt, setConsultingApt] = useState<Appointment | null>(null);
  const [notesText, setNotesText] = useState('');
  const [updating, setUpdating] = useState(false);

  const docAppointments = appointments.filter((a) => a.doctorId === currentDoc?.id);
  const dateAppointments = docAppointments.filter((a) => a.appointmentDate === selectedDate);

  const handleUpdateStatus = async (
    aptId: string,
    status: string,
    doctorNotes?: string
  ) => {
    setUpdating(true);
    try {
      await api.updateAppointmentStatus(aptId, status, {
        doctorNotes,
        user: currentDoc.name,
      });
      setConsultingApt(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenConsultation = (apt: Appointment) => {
    setConsultingApt(apt);
    setNotesText(apt.doctorNotes || '');
  };

  const [selectedDocOverrideId, setSelectedDocOverrideId] = useState<string>('');
  const activeDoc =
    doctors.find((d) => d.id === selectedDocOverrideId) ||
    currentDoc;

  const activeDocAppointments = appointments.filter((a) => a.doctorId === activeDoc?.id);
  const activeDateAppointments = activeDocAppointments.filter((a) => a.appointmentDate === selectedDate);

  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <div className="bg-[#070D19]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4 sm:gap-5">
          <img
            src={activeDoc?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80'}
            alt={activeDoc?.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#A3E635] shadow-lg"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#A3E635]">
                Doctor Console · {activeDoc?.speciality}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] font-mono text-slate-300">
                OPD Cabin Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">{activeDoc?.name}</h2>
            <p className="text-xs text-slate-400">
              {activeDoc?.hospitalName} ({activeDoc?.city})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Switch Specialist Dropdown */}
          <div className="bg-white/[0.04] border border-white/15 rounded-2xl px-3.5 py-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Switch Specialist Desk
            </label>
            <select
              value={activeDoc?.id || ''}
              onChange={(e) => setSelectedDocOverrideId(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#A3E635] focus:outline-none cursor-pointer"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id} className="bg-[#070D19] text-white">
                  {d.name} ({d.speciality})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white/[0.05] backdrop-blur-md rounded-2xl px-4 py-3 text-center min-w-[95px] border border-white/15">
            <span className="text-[10px] text-[#A3E635] block font-bold uppercase tracking-wider">Today</span>
            <span className="text-xl font-black tabular-nums mt-0.5 block text-white">
              {activeDocAppointments.filter((a) => a.appointmentDate === todayStr).length}
            </span>
          </div>
          <div className="bg-white/[0.05] backdrop-blur-md rounded-2xl px-4 py-3 text-center min-w-[95px] border border-white/15">
            <span className="text-[10px] text-emerald-400 block font-bold uppercase tracking-wider">Completed</span>
            <span className="text-xl font-black tabular-nums mt-0.5 block text-white">
              {activeDocAppointments.filter((a) => a.status === 'completed').length}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-[#0F172A] text-[#A3E635] shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Patient Queue ({activeDateAppointments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-[#0F172A] text-[#A3E635] shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Schedule & Leave
          </button>
        </div>

        {activeTab === 'queue' && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-900"
          />
        )}
      </div>

      {/* Tab 1: Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>
              Queue for {activeDoc?.name} ({activeDateAppointments.length})
            </span>
          </h3>

          {activeDateAppointments.length === 0 ? (
            <div className="glass-card rounded-3xl p-10 text-center space-y-2">
              <Calendar className="w-9 h-9 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-900 text-sm">No Bookings Scheduled</h4>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activeDateAppointments.map((apt) => {
                const isCompleted = apt.status === 'completed';
                const isCheckedIn = apt.status === 'checked_in';
                const isCancelled = apt.status === 'cancelled';
                const isNoShow = apt.status === 'no_show';

                return (
                  <div
                    key={apt.id}
                    className={`glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isCheckedIn ? 'ring-2 ring-emerald-500' : ''
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 text-xs">
                          {apt.tokenNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {apt.appointmentTime}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="uppercase font-bold text-slate-700 text-[11px]">
                          {apt.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-extrabold text-slate-900">
                          {apt.patientName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {apt.patientAge}y · {apt.patientGender} · {apt.patientPhone}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        Symptoms: <span className="font-semibold text-slate-800">{apt.symptoms || 'Routine Consultation'}</span>
                      </p>

                      {apt.doctorNotes && (
                        <p className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-medium">
                          Rx: {apt.doctorNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap md:flex-col items-stretch gap-2 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200 md:pl-5 min-w-[150px]">
                      {!isCompleted && !isCancelled && !isNoShow && (
                        <>
                          <button
                            onClick={() => handleOpenConsultation(apt)}
                            className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-[#A3E635] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            <span>Prescribe</span>
                          </button>

                          {apt.status === 'scheduled' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'checked_in')}
                              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                            >
                              Call Patient
                            </button>
                          )}

                          <button
                            onClick={() => handleUpdateStatus(apt.id, 'no_show')}
                            className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold cursor-pointer"
                          >
                            No-Show
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <span className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5 py-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Completed</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Doctor Schedule & Slots */}
      {activeTab === 'schedule' && (
        <div className="glass-card rounded-3xl p-6 space-y-6">
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Consultation Days
            </span>
            <div className="flex flex-wrap gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                const active = activeDoc?.availableDays.includes(day);
                return (
                  <span
                    key={day}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                      active
                        ? 'bg-[#0F172A] text-[#A3E635]'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {day}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Block Emergency Slot / Leave
            </span>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const date = (form.elements.namedItem('blockDate') as HTMLInputElement).value;
                const slot = (form.elements.namedItem('blockSlot') as HTMLSelectElement).value;
                const reason = (form.elements.namedItem('blockReason') as HTMLInputElement).value;
                if (!date || !slot) return;
                try {
                  await api.blockDoctorSlot(activeDoc.id, date, slot, reason || 'Emergency Leave');
                  onRefresh();
                } catch (err: any) {
                  console.error(err);
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end"
            >
              <div>
                <label className="text-xs text-[#6E5D53] block mb-1.5">Date</label>
                <input
                  type="date"
                  name="blockDate"
                  defaultValue={todayStr}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 border border-[#D8C7B2]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#6E5D53] block mb-1.5">Slot</label>
                <select
                  name="blockSlot"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 border border-[#D8C7B2]"
                  required
                >
                  <option value="All Day (Full Leave)">All Day</option>
                  {currentDoc?.availableSlots.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#6E5D53] block mb-1.5">Reason</label>
                <input
                  type="text"
                  name="blockReason"
                  defaultValue="Emergency OT"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 border border-[#D8C7B2]"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl wood-btn-primary font-semibold cursor-pointer"
              >
                Lock Slot
              </button>
            </form>
          </div>
        </div>
      )}

      {consultingApt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-modal rounded-3xl max-w-lg w-full p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-[#D8C7B2]/60 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#2C221E]">
                  Consultation Notes
                </h3>
                <p className="text-xs text-[#6E5D53]">
                  {consultingApt.patientName} · {consultingApt.tokenNumber}
                </p>
              </div>
              <button
                onClick={() => setConsultingApt(null)}
                className="text-[#6E5D53] hover:text-[#2C221E] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Enter diagnosis, prescribed medicines, and care instructions..."
              rows={5}
              className="w-full p-4 text-xs rounded-2xl border border-[#D8C7B2] bg-white/80 focus:outline-none focus:border-[#1F6E66] resize-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConsultingApt(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#6E5D53]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(consultingApt.id, 'completed', notesText)}
                disabled={updating}
                className="px-5 py-2.5 rounded-xl hospital-btn-primary text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Consultation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
