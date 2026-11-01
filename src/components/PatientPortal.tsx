import React, { useState } from 'react';
import { Appointment, Doctor } from '../types';
import { api } from '../services/api';
import {
  Calendar,
  Clock,
  Building2,
  FileText,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Star,
  CheckCircle2,
  Tv,
  UserCheck,
  Stethoscope,
} from 'lucide-react';
import { AppointmentSlipModal } from './AppointmentSlipModal';
import { RatingModal } from './RatingModal';
import { getDoctorCartoonAvatar } from '../utils/doctorAvatars';
import {
  useInternetTime,
  FULL_DAY_OPD_SLOTS,
  isSlotPastInIST,
} from '../utils/internetTime';

interface PatientPortalProps {
  appointments: Appointment[];
  doctors: Doctor[];
  currentUser: any;
  onRefresh: () => void;
  onOpenQueueBoard?: () => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  appointments,
  doctors,
  currentUser,
  onRefresh,
  onOpenQueueBoard,
}) => {
  const clock = useInternetTime(1000);

  // Default to 'all' so visits that transition from Checked-In -> Completed remain immediately visible
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [selectedSlip, setSelectedSlip] = useState<Appointment | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleReason] = useState('Schedule change');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  const [cancellingApt, setCancellingApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Personal conflict');
  const [cancelLoading, setCancelLoading] = useState(false);

  const [ratingApt, setRatingApt] = useState<Appointment | null>(null);

  const handleRatingSubmit = async (rating: number, review: string) => {
    if (!ratingApt) return;
    try {
      await api.rateDoctor(ratingApt.doctorId, rating, review, ratingApt.id);
      setRatingApt(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }
  };

  const handleMarkCompleted = async (apt: Appointment) => {
    setUpdatingId(apt.id);
    try {
      await api.updateAppointmentStatus(apt.id, 'completed', {
        user: `${currentUser?.name || apt.patientName} (Visit Confirmed Completed)`,
        doctorNotes:
          apt.doctorNotes ||
          `OPD consultation completed at ${clock.timeShort} IST (${apt.roomNumber || 'OPD Room 102'}).`,
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to mark visit completed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  let savedSessionIds: string[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem('citycare_my_appointment_ids') || '[]');
    if (Array.isArray(parsed)) savedSessionIds = parsed;
  } catch {
    // ignore
  }

  const userOwnAppointments = appointments.filter((apt) => {
    if (savedSessionIds.includes(apt.id)) return true;
    // Also include any appointment that was checked_in or completed for Rahul Verma / current session user
    if (!currentUser?.id) {
      return apt.patientId === 'usr-4';
    }
    if (currentUser.role === 'admin' || currentUser.role === 'receptionist') return true;
    if (apt.patientId === currentUser.id) return true;
    if (
      currentUser.email &&
      apt.patientEmail &&
      apt.patientEmail.toLowerCase() === currentUser.email.toLowerCase()
    ) {
      return true;
    }
    return false;
  });

  const upcomingCount = userOwnAppointments.filter(
    (apt) =>
      apt.status === 'scheduled' ||
      apt.status === 'checked_in' ||
      apt.status === 'in_consultation' ||
      apt.status === 'rescheduled'
  ).length;
  const completedCount = userOwnAppointments.filter((apt) => apt.status === 'completed').length;
  const cancelledCount = userOwnAppointments.filter(
    (apt) => apt.status === 'cancelled' || apt.status === 'no_show'
  ).length;

  const filtered = userOwnAppointments.filter((apt) => {
    if (filter === 'upcoming') {
      return (
        apt.status === 'scheduled' ||
        apt.status === 'checked_in' ||
        apt.status === 'in_consultation' ||
        apt.status === 'rescheduled'
      );
    }
    if (filter === 'completed') {
      return apt.status === 'completed';
    }
    if (filter === 'cancelled') {
      return apt.status === 'cancelled' || apt.status === 'no_show';
    }
    return true;
  });

  const normalizeSlot = (s: string) => (s || '').trim().toUpperCase();

  const getRescheduleSlotsForApt = (apt: Appointment | null) => {
    if (!apt) return [...FULL_DAY_OPD_SLOTS];
    const doc = doctors.find((d) => d.id === apt.doctorId);
    const baseSlots = doc?.availableSlots?.length ? doc.availableSlots : FULL_DAY_OPD_SLOTS;
    return Array.from(new Set([...baseSlots, ...FULL_DAY_OPD_SLOTS]));
  };

  const getRescheduleSlotConflict = (
    apt: Appointment | null,
    targetDate: string,
    slot: string
  ): string | null => {
    if (!apt) return null;
    if (isSlotPastInIST(targetDate, slot, clock)) {
      return 'Passed';
    }
    const doc = doctors.find((d) => d.id === apt.doctorId);
    if (
      doc?.blockedSlots?.some(
        (b) => b.date === targetDate && normalizeSlot(b.slot) === normalizeSlot(slot)
      )
    ) {
      return 'Leave';
    }

    for (const other of appointments) {
      if (other.id === apt.id) continue;
      if (other.status === 'cancelled' || other.status === 'no_show') continue;
      if (other.appointmentDate !== targetDate) continue;
      if (normalizeSlot(other.appointmentTime) !== normalizeSlot(slot)) continue;

      if (other.doctorId === apt.doctorId) {
        return 'Booked';
      }

      const samePat =
        (apt.patientId && other.patientId && apt.patientId === other.patientId) ||
        (apt.patientEmail &&
          other.patientEmail &&
          apt.patientEmail.toLowerCase() === other.patientEmail.toLowerCase()) ||
        (apt.patientPhone &&
          other.patientPhone &&
          apt.patientPhone.replace(/[^0-9]/g, '') === other.patientPhone.replace(/[^0-9]/g, '')) ||
        apt.patientName.trim().toLowerCase() === other.patientName.trim().toLowerCase();

      if (samePat) {
        return 'Your Slot';
      }
    }

    return null;
  };

  const handleOpenReschedule = (apt: Appointment) => {
    setReschedulingApt(apt);
    const initialTargetDate =
      apt.appointmentDate < clock.todayStr ? clock.todayStr : apt.appointmentDate;
    const slots = getRescheduleSlotsForApt(apt);
    const firstAvailableOnDate = slots.find(
      (s) =>
        !(
          initialTargetDate === apt.appointmentDate &&
          normalizeSlot(s) === normalizeSlot(apt.appointmentTime)
        ) && !getRescheduleSlotConflict(apt, initialTargetDate, s)
    );

    if (firstAvailableOnDate) {
      setNewDate(initialTargetDate);
      setNewTime(firstAvailableOnDate);
    } else {
      setNewDate(clock.tomorrowStr);
      const firstTom =
        slots.find((s) => !getRescheduleSlotConflict(apt, clock.tomorrowStr, s)) || slots[0];
      setNewTime(firstTom);
    }
    setRescheduleError('');
  };

  const handleConfirmReschedule = async () => {
    if (!reschedulingApt || !newDate || !newTime) return;
    const conflictType = getRescheduleSlotConflict(reschedulingApt, newDate, newTime);
    if (conflictType) {
      setRescheduleError(
        `Slot ${newTime} on ${newDate} is unavailable (${conflictType}). Please pick another slot.`
      );
      return;
    }
    if (
      newDate === reschedulingApt.appointmentDate &&
      normalizeSlot(newTime) === normalizeSlot(reschedulingApt.appointmentTime)
    ) {
      setRescheduleError('Please choose a different date or time slot to reschedule.');
      return;
    }

    setRescheduleLoading(true);
    setRescheduleError('');

    try {
      await api.rescheduleAppointment(reschedulingApt.id, newDate, newTime, rescheduleReason);
      setReschedulingApt(null);
      onRefresh();
    } catch (err: any) {
      setRescheduleError(err.message || 'Slot occupied. Choose another time.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingApt) return;
    setCancelLoading(true);
    try {
      await api.cancelAppointment(cancellingApt.id, cancelReason);
      setCancellingApt(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Modern Dark Navy Header Banner */}
      <div className="bg-[#0B1120] border border-slate-800 rounded-3xl p-7 sm:p-9 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#A3E635]">
              Patient Appointments & Live OPD Status
            </span>
            {currentUser?.id && (
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-300">
                ID: {currentUser.id}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-mono font-bold text-[#A3E635]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
              <span>LIVE IST: {clock.time12h}</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {currentUser?.name || 'Rahul Verma'}
          </h2>
          <p className="text-xs font-mono text-slate-400">
            {currentUser?.email || 'rahul.patient@gmail.com'}{' '}
            {currentUser?.phone ? `· ${currentUser.phone}` : '· +91 98765 43210'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="bg-[#111C38] rounded-2xl p-4 border border-slate-800 text-center min-w-[110px]">
            <span className="text-[11px] text-[#A3E635] block font-bold uppercase tracking-wider">
              Active / Queue
            </span>
            <span className="text-2xl font-extrabold tabular-nums mt-0.5 block text-white">
              {upcomingCount}
            </span>
          </div>
          <div className="bg-[#111C38] rounded-2xl p-4 border border-slate-800 text-center min-w-[110px]">
            <span className="text-[11px] text-emerald-400 block font-bold uppercase tracking-wider">
              Completed
            </span>
            <span className="text-2xl font-extrabold tabular-nums mt-0.5 block text-white">
              {completedCount}
            </span>
          </div>
          <div className="bg-[#111C38] rounded-2xl p-4 border border-slate-800 text-center min-w-[110px]">
            <span className="text-[11px] text-slate-400 block font-bold uppercase tracking-wider">
              Total Visits
            </span>
            <span className="text-2xl font-extrabold tabular-nums mt-0.5 block text-white">
              {userOwnAppointments.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs with Live Counts */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: `All Visits (${userOwnAppointments.length})` },
            { id: 'upcoming', label: `Active & Live Queue (${upcomingCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
            { id: 'cancelled', label: `Cancelled (${cancelledCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#0F172A] text-[#A3E635] shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {onOpenQueueBoard && (
          <button
            type="button"
            onClick={onOpenQueueBoard}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#A3E635] text-xs font-extrabold flex items-center gap-2 cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Open Waiting Room Live Queue</span>
          </button>
        )}
      </div>

      {/* Appointments List */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-3xl p-14 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900">No {filter} visits found</h3>
          <p className="text-xs text-slate-500">
            Book an appointment from the Triage or Specialists tab to view your OPD token slip here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filtered.map((apt) => {
            const isCheckedIn = apt.status === 'checked_in';
            const isInConsultation = apt.status === 'in_consultation';
            const isCompleted = apt.status === 'completed';
            const isCancelled = apt.status === 'cancelled' || apt.status === 'no_show';
            const matchedDoc = doctors.find((d) => d.id === apt.doctorId);
            const avatarSrc = getDoctorCartoonAvatar(
              apt.doctorName,
              apt.doctorSpeciality,
              matchedDoc?.gender
            );

            // Stepper progress calculation
            const currentStage = isCompleted
              ? 4
              : isInConsultation
              ? 3
              : isCheckedIn
              ? 2
              : 1;

            return (
              <div
                key={apt.id}
                className={`glass-card rounded-3xl p-6 sm:p-7 flex flex-col gap-5 transition-all ${
                  isInConsultation
                    ? 'ring-2 ring-blue-500 bg-blue-50/20'
                    : isCheckedIn
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/20'
                    : isCompleted
                    ? 'border-l-4 border-l-emerald-600'
                    : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <img
                      src={avatarSrc}
                      alt={apt.doctorName}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                    />

                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-extrabold text-blue-600 text-sm">
                          {apt.tokenNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-extrabold uppercase text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Visit Completed</span>
                          </span>
                        ) : isInConsultation ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-extrabold uppercase text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-ping" />
                            <span>Now Serving in Cabin</span>
                          </span>
                        ) : isCheckedIn ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-extrabold uppercase text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>Checked In · In Live Queue</span>
                          </span>
                        ) : isCancelled ? (
                          <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-700 font-extrabold uppercase text-[11px]">
                            {apt.status.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-extrabold uppercase text-[11px]">
                            Scheduled · Awaiting Check-In
                          </span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-700">
                          {apt.paymentStatus === 'paid' ? 'Paid' : 'Pay at Desk'} (₹{apt.fee})
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900">{apt.doctorName}</h3>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-blue-600">
                            {apt.doctorSpeciality}
                          </span>
                          <span aria-hidden="true">·</span>
                          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {apt.hospitalName} ({apt.city})
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 font-mono font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {apt.appointmentDate}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          {apt.appointmentTime}
                        </span>
                        {apt.roomNumber && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                            {apt.roomNumber}
                          </span>
                        )}
                      </div>

                      {apt.doctorNotes && (
                        <p className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
                          <strong className="text-slate-900">Clinical Notes:</strong>{' '}
                          {apt.doctorNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap md:flex-col items-center gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6">
                    <button
                      type="button"
                      onClick={() => setSelectedSlip(apt)}
                      className="flex-1 md:w-40 px-4 py-2.5 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>OPD Slip</span>
                    </button>

                    {(isCheckedIn || isInConsultation) && (
                      <>
                        {onOpenQueueBoard && (
                          <button
                            type="button"
                            onClick={onOpenQueueBoard}
                            className="flex-1 md:w-40 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#A3E635] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Tv className="w-3.5 h-3.5" />
                            <span>Live Queue TV</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={updatingId === apt.id}
                          onClick={() => handleMarkCompleted(apt)}
                          className="flex-1 md:w-40 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete Visit ✓</span>
                        </button>
                      </>
                    )}

                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => setRatingApt(apt)}
                        className="flex-1 md:w-40 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{apt.rating ? `${apt.rating}★ Rated` : 'Rate Visit'}</span>
                      </button>
                    )}

                    {!isCompleted && !isCancelled && !isCheckedIn && !isInConsultation && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenReschedule(apt)}
                          className="flex-1 md:w-40 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                          <span>Reschedule</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCancellingApt(apt)}
                          className="flex-1 md:w-40 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 4-Step Live OPD Visit Journey Tracker */}
                {!isCancelled && (
                  <div className="pt-4 border-t border-slate-200/80">
                    <div className="grid grid-cols-4 gap-2 text-[11px]">
                      {[
                        { step: 1, label: '1. Booked', sub: 'Token Issued', icon: Calendar },
                        {
                          step: 2,
                          label: '2. Checked In',
                          sub: 'Live Queue Active',
                          icon: UserCheck,
                        },
                        {
                          step: 3,
                          label: '3. In Cabin',
                          sub: 'Doctor Consulting',
                          icon: Stethoscope,
                        },
                        {
                          step: 4,
                          label: '4. Completed',
                          sub: 'Visit Summary Ready',
                          icon: CheckCircle2,
                        },
                      ].map((s) => {
                        const StepIcon = s.icon;
                        const reached = currentStage >= s.step;
                        const isCurrent = currentStage === s.step;
                        return (
                          <div
                            key={s.step}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              isCurrent
                                ? 'bg-slate-900 text-[#A3E635] border-slate-900 font-extrabold shadow-xs'
                                : reached
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold'
                                : 'bg-slate-50 text-slate-400 border-slate-200/70'
                            }`}
                          >
                            <StepIcon className="w-3.5 h-3.5 shrink-0" />
                            <div className="min-w-0">
                              <span className="block truncate">{s.label}</span>
                              <span className="block text-[9px] opacity-80 truncate">{s.sub}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedSlip && (
        <AppointmentSlipModal
          appointment={selectedSlip}
          onClose={() => setSelectedSlip(null)}
        />
      )}

      {reschedulingApt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                Reschedule Visit ({reschedulingApt.tokenNumber})
              </h3>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-[#A3E635] text-[10px] font-mono font-bold">
                IST {clock.timeShort}
              </span>
            </div>

            {rescheduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">New Date</label>
              <input
                type="date"
                value={newDate}
                min={clock.todayStr}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  setNewDate(nextDate);
                  setRescheduleError('');
                  const slots = getRescheduleSlotsForApt(reschedulingApt);
                  const firstFree = slots.find(
                    (s) =>
                      !(
                        nextDate === reschedulingApt.appointmentDate &&
                        normalizeSlot(s) === normalizeSlot(reschedulingApt.appointmentTime)
                      ) && !getRescheduleSlotConflict(reschedulingApt, nextDate, s)
                  );
                  if (firstFree) setNewTime(firstFree);
                }}
                className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                New Time Slot (Past slots on Today are locked)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {getRescheduleSlotsForApt(reschedulingApt).map((s) => {
                  const conflictLabel = getRescheduleSlotConflict(reschedulingApt, newDate, s);
                  const isCurrentSameSlot =
                    newDate === reschedulingApt.appointmentDate &&
                    normalizeSlot(s) === normalizeSlot(reschedulingApt.appointmentTime);
                  const disabled = Boolean(conflictLabel) || isCurrentSameSlot;
                  const isSelected = normalizeSlot(newTime) === normalizeSlot(s) && !disabled;

                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setNewTime(s);
                        setRescheduleError('');
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
                        conflictLabel === 'Passed'
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-70 line-through'
                          : disabled
                          ? 'bg-rose-50/70 text-rose-400 border-rose-200 cursor-not-allowed opacity-75 line-through'
                          : isSelected
                          ? 'bg-[#2563EB] text-white border-[#2563EB] cursor-pointer'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      <span className="tabular-nums">{s}</span>
                      {conflictLabel ? (
                        <span className="text-[10px] text-rose-600 font-bold no-underline">
                          {conflictLabel}
                        </span>
                      ) : isCurrentSameSlot ? (
                        <span className="text-[10px] text-slate-500 no-underline">Current</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReschedulingApt(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={rescheduleLoading}
                className="px-5 py-2.5 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 text-xs font-extrabold cursor-pointer"
              >
                {rescheduleLoading ? 'Saving...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancellingApt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-7 space-y-5 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">
              Cancel Visit ({cancellingApt.tokenNumber})
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Reason</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCancellingApt(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Keep Visit
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                {cancelLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ratingApt && (
        <RatingModal
          appointment={ratingApt}
          onSubmitRating={handleRatingSubmit}
          onClose={() => setRatingApt(null)}
        />
      )}
    </div>
  );
};
