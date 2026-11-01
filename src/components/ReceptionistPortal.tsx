import React, { useState } from 'react';
import { Appointment, Hospital, Doctor, AppointmentStatus } from '../types';
import { api } from '../services/api';
import {
  Search,
  UserCheck,
  Banknote,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  Stethoscope,
  Tv,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AppointmentSlipModal } from './AppointmentSlipModal';
import {
  useInternetTime,
  FULL_DAY_OPD_SLOTS,
  isSlotPastInIST,
} from '../utils/internetTime';

interface ReceptionistPortalProps {
  appointments: Appointment[];
  hospitals: Hospital[];
  doctors: Doctor[];
  currentUser: any;
  onRefresh: () => void;
  onOpenQueueBoard?: () => void;
}

export const ReceptionistPortal: React.FC<ReceptionistPortalProps> = ({
  appointments,
  doctors,
  currentUser,
  onRefresh,
  onOpenQueueBoard,
}) => {
  const clock = useInternetTime(1000);
  const todayStr = clock.todayStr;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSlip, setSelectedSlip] = useState<Appointment | null>(null);
  const [actionBanner, setActionBanner] = useState<{
    token: string;
    patient: string;
    newStatus: AppointmentStatus;
    message: string;
  } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInAge, setWalkInAge] = useState('30');
  const [walkInGender, setWalkInGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [walkInDoctorId, setWalkInDoctorId] = useState(doctors[0]?.id || '');
  const [walkInSlot, setWalkInSlot] = useState(() => {
    const nextLive = FULL_DAY_OPD_SLOTS.find((s) => !isSlotPastInIST(todayStr, s, clock));
    return nextLive || clock.timeShort;
  });
  const [walkInSymptoms, setWalkInSymptoms] = useState('Walk-in OPD Consultation');
  const [walkInAutoCheckIn, setWalkInAutoCheckIn] = useState(true);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState('');

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      apt.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientPhone.includes(searchTerm) ||
      apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'queue' &&
        (apt.status === 'checked_in' || apt.status === 'in_consultation')) ||
      apt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (
    apt: Appointment,
    nextStatus: AppointmentStatus,
    extraNotes?: string
  ) => {
    setUpdatingId(apt.id);
    try {
      const assignedRoom =
        apt.roomNumber ||
        `OPD Room ${101 + (Math.abs(apt.doctorId.charCodeAt(apt.doctorId.length - 1) || 1) % 8)}`;

      await api.updateAppointmentStatus(apt.id, nextStatus, {
        user: `${currentUser?.name || 'Receptionist'} (Front Desk)`,
        roomNumber: assignedRoom,
        doctorNotes:
          extraNotes !== undefined
            ? extraNotes
            : nextStatus === 'completed' && !apt.doctorNotes
            ? `OPD consultation completed at ${clock.timeShort} IST (${assignedRoom}).`
            : apt.doctorNotes,
      });

      let msg = '';
      if (nextStatus === 'checked_in') {
        msg = `Checked in ${apt.patientName} (${apt.tokenNumber}) → Added to Live OPD Queue (${assignedRoom}) & synced with My Visits.`;
      } else if (nextStatus === 'in_consultation') {
        msg = `Token ${apt.tokenNumber} (${apt.patientName}) is NOW SERVING in ${assignedRoom} on Live Queue TV.`;
      } else if (nextStatus === 'completed') {
        msg = `Visit completed for ${apt.patientName} (${apt.tokenNumber}) → Updated as COMPLETED in Patient's "My Visits".`;
      } else {
        msg = `Updated ${apt.tokenNumber} status to ${nextStatus.replace('_', ' ')}.`;
      }

      setActionBanner({
        token: apt.tokenNumber,
        patient: apt.patientName,
        newStatus: nextStatus,
        message: msg,
      });

      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCollectCash = async (aptId: string) => {
    setUpdatingId(aptId);
    try {
      await api.updateAppointmentStatus(aptId, undefined as any, {
        paymentStatus: 'paid',
        user: `${currentUser?.name || 'Receptionist'} (Cash Counter)`,
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInError('');
    if (!walkInName || !walkInPhone) {
      setWalkInError('Patient name and phone number are required.');
      return;
    }

    const doc = doctors.find((d) => d.id === walkInDoctorId) || doctors[0];
    if (!doc) return;

    setWalkInSubmitting(true);
    try {
      const created = await api.bookAppointment({
        doctorId: doc.id,
        doctorName: doc.name,
        doctorSpeciality: doc.speciality,
        hospitalId: doc.hospitalId,
        hospitalName: doc.hospitalName,
        city: doc.city,
        appointmentDate: todayStr,
        appointmentTime: walkInSlot,
        patientName: walkInName,
        patientPhone: walkInPhone,
        patientAge: parseInt(walkInAge, 10) || 30,
        patientGender: walkInGender,
        symptoms: walkInSymptoms,
        paymentMethod: 'cash',
        isWalkIn: true,
      } as any);

      // Persist in session IDs so it also appears in My Visits when testing
      try {
        const savedIds = JSON.parse(localStorage.getItem('citycare_my_appointment_ids') || '[]');
        if (Array.isArray(savedIds) && !savedIds.includes(created.id)) {
          savedIds.unshift(created.id);
          localStorage.setItem('citycare_my_appointment_ids', JSON.stringify(savedIds));
        }
      } catch {
        // ignore
      }

      if (walkInAutoCheckIn) {
        await api.updateAppointmentStatus(created.id, 'checked_in', {
          user: `${currentUser?.name || 'Receptionist'} (Walk-In Desk)`,
          roomNumber: 'OPD Room 102',
        });
        created.status = 'checked_in';
      }

      setShowWalkInModal(false);
      setWalkInName('');
      setWalkInPhone('');
      setSelectedSlip(created);
      onRefresh();
    } catch (err: any) {
      setWalkInError(err.message || 'Slot occupied. Choose another time.');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const checkedInCount = appointments.filter(
    (a) => a.status === 'checked_in' || a.status === 'in_consultation'
  ).length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const scheduledCount = appointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'rescheduled'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Desk Banner */}
      <div className="bg-[#0B1120] border border-slate-800 rounded-3xl p-7 sm:p-9 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#A3E635]">
              Reception & Live Queue Control
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-mono font-bold text-[#A3E635]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
              <Clock className="w-3 h-3" />
              <span>LIVE IST: {clock.time12h}</span>
              <span className="text-slate-400">({clock.dateDisplay})</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Front Desk Check-In & OPD Queue Dispatch
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Check in arriving patients to broadcast their token to the Waiting Lounge Live Queue, assign them to a doctor cabin, and mark consultations as Completed to update Patient Visits in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onOpenQueueBoard && (
            <button
              type="button"
              onClick={onOpenQueueBoard}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Tv className="w-4 h-4 text-[#A3E635]" />
              <span>Open Live Queue TV</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowWalkInModal(true)}
            className="px-5 py-3 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Walk-In Token</span>
          </button>
        </div>
      </div>

      {/* Live Action Confirmation Toast Banner */}
      {actionBanner && (
        <div className="p-4 rounded-2xl bg-emerald-950 text-white border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#A3E635] text-slate-950 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A3E635] block">
                Real-Time Workflow Synced • Token {actionBanner.token}
              </span>
              <p className="text-xs text-emerald-100 mt-0.5">{actionBanner.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenQueueBoard &&
              (actionBanner.newStatus === 'checked_in' ||
                actionBanner.newStatus === 'in_consultation') && (
                <button
                  type="button"
                  onClick={onOpenQueueBoard}
                  className="px-3.5 py-2 rounded-xl bg-[#A3E635] text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>View in Live Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            <button
              type="button"
              onClick={() => setActionBanner(null)}
              className="px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-xs text-emerald-200 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Search & Status Filter Bar */}
      <div className="glass-card rounded-2xl p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: `All Tokens (${appointments.length})` },
            { id: 'scheduled', label: `Awaiting Check-In (${scheduledCount})` },
            { id: 'queue', label: `In Live Queue (${checkedInCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#0F172A] text-[#A3E635] shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search token, patient, doctor..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-600 font-medium"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4 pl-6">Token</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Specialist & Hospital</th>
                <th className="p-4">Schedule</th>
                <th className="p-4">Fee / Payment</th>
                <th className="p-4">Live Status</th>
                <th className="p-4 pr-6 text-right">Reception & Queue Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredAppointments.map((apt) => {
                const isScheduled =
                  apt.status === 'scheduled' || apt.status === 'rescheduled';
                const isCheckedIn = apt.status === 'checked_in';
                const isInConsultation = apt.status === 'in_consultation';
                const isCompleted = apt.status === 'completed';
                const isCancelled = apt.status === 'cancelled' || apt.status === 'no_show';
                const isPaid = apt.paymentStatus === 'paid';
                const isBusy = updatingId === apt.id;

                return (
                  <tr
                    key={apt.id}
                    className={`transition-colors ${
                      isInConsultation
                        ? 'bg-blue-50/60 hover:bg-blue-50'
                        : isCheckedIn
                        ? 'bg-emerald-50/50 hover:bg-emerald-50'
                        : 'hover:bg-slate-50/90'
                    }`}
                  >
                    <td className="p-4 pl-6">
                      <span className="font-mono font-extrabold text-blue-700 text-sm tabular-nums block">
                        {apt.tokenNumber}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {apt.roomNumber || 'OPD Room 102'}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">{apt.patientName}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {apt.patientPhone} · {apt.patientAge}y, {apt.patientGender}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900">{apt.doctorName}</div>
                      <div className="text-[11px] text-blue-600 font-semibold">
                        {apt.doctorSpeciality} · {apt.hospitalName}
                      </div>
                    </td>

                    <td className="p-4 font-mono tabular-nums">
                      <div className="font-bold text-slate-900">{apt.appointmentTime}</div>
                      <div className="text-[11px] text-slate-500">{apt.appointmentDate}</div>
                    </td>

                    <td className="p-4 tabular-nums">
                      <div className="font-extrabold text-slate-900">₹{apt.fee}</div>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleCollectCash(apt.id)}
                          className="inline-flex items-center gap-1 text-amber-700 hover:underline text-[11px] font-bold cursor-pointer mt-0.5"
                        >
                          <Banknote className="w-3 h-3" />
                          <span>Collect Cash</span>
                        </button>
                      )}
                    </td>

                    <td className="p-4">
                      {isInConsultation ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-ping" />
                          <span>Now Serving</span>
                        </span>
                      ) : isCheckedIn ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>In Live Queue</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-[#A3E635] text-[10px] font-extrabold uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      ) : isCancelled ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-bold uppercase">
                          {apt.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                          Booked · Scheduled
                        </span>
                      )}
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {/* Step 1: Scheduled -> Check In to Live Queue */}
                        {isScheduled && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleUpdateStatus(apt, 'checked_in')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Check In → Queue</span>
                          </button>
                        )}

                        {/* Step 2: Checked In -> Call to Doctor Cabin OR Complete Visit */}
                        {isCheckedIn && (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUpdateStatus(apt, 'in_consultation')}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>Send to Doctor</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleUpdateStatus(apt, 'completed')}
                              className="px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-[#A3E635] text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Completed</span>
                            </button>
                          </>
                        )}

                        {/* Step 3: In Consultation -> Complete Visit */}
                        {isInConsultation && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleUpdateStatus(apt, 'completed')}
                            className="px-3.5 py-1.5 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complete Visit ✓</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedSlip(apt)}
                          title="View OPD Slip"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSlip && (
        <AppointmentSlipModal
          appointment={selectedSlip}
          onClose={() => setSelectedSlip(null)}
        />
      )}

      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Walk-In OPD Token Registration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live Date: {todayStr} · Current IST: {clock.timeShort}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWalkInModal(false)}
                className="text-slate-400 hover:text-slate-800 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {walkInError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {walkInError}
              </div>
            )}

            <form onSubmit={handleCreateWalkIn} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Consulting Doctor *
                  </label>
                  <select
                    value={walkInDoctorId}
                    onChange={(e) => setWalkInDoctorId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.speciality})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    OPD Slot (Live IST) *
                  </label>
                  <select
                    value={walkInSlot}
                    onChange={(e) => setWalkInSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value={clock.timeShort}>
                      Immediate Walk-In ({clock.timeShort} IST)
                    </option>
                    {FULL_DAY_OPD_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={walkInAge}
                    onChange={(e) => setWalkInAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Gender
                  </label>
                  <select
                    value={walkInGender}
                    onChange={(e) => setWalkInGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Chief Symptoms / Reason
                </label>
                <input
                  type="text"
                  value={walkInSymptoms}
                  onChange={(e) => setWalkInSymptoms(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={walkInAutoCheckIn}
                  onChange={(e) => setWalkInAutoCheckIn(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>
                  Automatically Check-In patient & add directly to Live OPD Queue
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkInSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#0F172A] text-[#A3E635] text-xs font-extrabold cursor-pointer"
                >
                  {walkInSubmitting ? 'Issuing Token...' : 'Issue Token & Check In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
