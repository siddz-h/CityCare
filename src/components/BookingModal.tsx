import React, { useState, useEffect } from 'react';
import { Doctor, Appointment, PaymentMethod } from '../types';
import { api } from '../services/api';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CreditCard,
  Banknote,
  ChevronRight,
  Check,
  Building2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { getDoctorCartoonAvatar } from '../utils/doctorAvatars';
import {
  useInternetTime,
  getUpcomingISTDates,
  isSlotPastInIST,
  FULL_DAY_OPD_SLOTS,
} from '../utils/internetTime';

interface BookingModalProps {
  doctor: Doctor;
  initialSymptoms?: string;
  initialDate?: string;
  initialSlot?: string;
  currentUser?: any;
  onSuccess: (appointment: Appointment) => void;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  doctor,
  initialSymptoms = '',
  initialDate,
  initialSlot,
  currentUser,
  onSuccess,
  onClose,
}) => {
  const clock = useInternetTime(1000);
  const dateOptions = getUpcomingISTDates(7, clock);

  if (initialDate && !dateOptions.some((o) => o.dateStr === initialDate)) {
    try {
      const initD = new Date(initialDate + 'T00:00:00');
      const dayName = initD.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = initD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateOptions.push({
        dateStr: initialDate,
        label: `${dayName}, ${monthDay}`,
        dayOfWeek: dayName,
        monthDay,
      });
      dateOptions.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    } catch {
      // ignore
    }
  }

  const allSlots = Array.from(
    new Set([
      ...(Array.isArray(doctor.availableSlots) && doctor.availableSlots.length > 0
        ? doctor.availableSlots
        : []),
      ...FULL_DAY_OPD_SLOTS,
    ])
  );

  // Check if Today has any future slots left in live IST
  const hasFutureSlotsToday = allSlots.some((s) => !isSlotPastInIST(clock.todayStr, s, clock));
  const defaultInitialDate =
    initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) && initialDate >= clock.todayStr
      ? initialDate === clock.todayStr && !hasFutureSlotsToday
        ? clock.tomorrowStr
        : initialDate
      : hasFutureSlotsToday
      ? clock.todayStr
      : clock.tomorrowStr;

  const [selectedDate, setSelectedDate] = useState(defaultInitialDate);
  const [selectedSlot, setSelectedSlot] = useState(() => {
    if (initialSlot && !isSlotPastInIST(defaultInitialDate, initialSlot, clock)) {
      return initialSlot;
    }
    return (
      allSlots.find((s) => !isSlotPastInIST(defaultInitialDate, s, clock)) ||
      allSlots[0] ||
      '10:00 AM'
    );
  });
  const [existingBookings, setExistingBookings] = useState<Appointment[]>([]);
  const [, setLoadingSlots] = useState(false);

  const [patientName, setPatientName] = useState(currentUser?.name || 'Rahul Verma');
  const [patientPhone, setPatientPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [patientEmail, setPatientEmail] = useState(
    currentUser?.email || 'rahul.patient@gmail.com'
  );
  const [patientAge, setPatientAge] = useState(currentUser?.age?.toString() || '28');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>(
    currentUser?.gender || 'Male'
  );

  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setPatientName(currentUser.name);
      if (currentUser.phone) setPatientPhone(currentUser.phone);
      if (currentUser.email) setPatientEmail(currentUser.email);
      if (currentUser.age) setPatientAge(currentUser.age.toString());
      if (currentUser.gender) setPatientGender(currentUser.gender);
    }
  }, [currentUser]);

  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchExisting = async () => {
      setLoadingSlots(true);
      try {
        const list = await api.getAppointments({
          date: selectedDate,
        });
        setExistingBookings(list);
      } catch (e) {
        console.error('Failed to check slot availability', e);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchExisting();
  }, [doctor.id, selectedDate]);

  const normalizeSlot = (s: string) => (s || '').trim().toUpperCase();

  const isSlotBookedByDoctor = (slot: string) => {
    return existingBookings.some(
      (a) =>
        a.doctorId === doctor.id &&
        normalizeSlot(a.appointmentTime) === normalizeSlot(slot) &&
        a.status !== 'cancelled' &&
        a.status !== 'no_show'
    );
  };

  const getPatientOverlapBooking = (slot: string) => {
    const cleanPhone = (patientPhone || '').replace(/[^0-9]/g, '');

    return existingBookings.find((a) => {
      if (a.status === 'cancelled' || a.status === 'no_show') return false;
      if (normalizeSlot(a.appointmentTime) !== normalizeSlot(slot)) return false;

      if (currentUser?.id && a.patientId === currentUser.id) {
        return true;
      }
      const aptPhone = (a.patientPhone || '').replace(/[^0-9]/g, '');
      return cleanPhone.length >= 10 && aptPhone.length >= 10 && cleanPhone.slice(-10) === aptPhone.slice(-10);
    });
  };

  const isSlotBlockedByDoctor = (slot: string) => {
    return doctor.blockedSlots?.some(
      (b) => b.date === selectedDate && normalizeSlot(b.slot) === normalizeSlot(slot)
    );
  };

  const isSlotPast = (slot: string) => {
    return isSlotPastInIST(selectedDate, slot, clock);
  };

  const isSlotUnavailable = (slot: string) => {
    return (
      Boolean(isSlotPast(slot)) ||
      Boolean(isSlotBookedByDoctor(slot)) ||
      Boolean(getPatientOverlapBooking(slot)) ||
      Boolean(isSlotBlockedByDoctor(slot))
    );
  };

  // Move selectedSlot to the first free slot ONLY when selectedDate or existingBookings changes and current slot is unavailable
  useEffect(() => {
    if (!selectedSlot || isSlotUnavailable(selectedSlot)) {
      const firstFree = allSlots.find((s) => !isSlotUnavailable(s));
      if (firstFree) {
        setSelectedSlot(firstFree);
      } else if (selectedDate === clock.todayStr) {
        // If all of today's slots are now unavailable/past, automatically advance to Tomorrow
        setSelectedDate(clock.tomorrowStr);
      }
    }
  }, [existingBookings, selectedDate, clock.minutesSinceMidnight]);

  const handleProceed = async () => {
    setErrorMsg('');
    if (!patientName.trim() || !patientPhone.trim()) {
      setErrorMsg('Please enter patient name and phone number.');
      return;
    }

    if (!selectedSlot) {
      setErrorMsg(`No available time slots left on ${selectedDate}. Please select another date.`);
      return;
    }

    if (isSlotPast(selectedSlot)) {
      setErrorMsg(
        `Slot ${selectedSlot} on ${selectedDate} has already passed (Live IST: ${clock.timeShort}). Please select an upcoming evening slot or book for tomorrow.`
      );
      return;
    }

    if (isSlotBookedByDoctor(selectedSlot)) {
      setErrorMsg(`Slot ${selectedSlot} on ${selectedDate} is already booked for ${doctor.name}.`);
      return;
    }

    const overlap = getPatientOverlapBooking(selectedSlot);
    if (overlap) {
      setErrorMsg(
        `You already have an appointment at ${selectedSlot} on ${selectedDate} with ${overlap.doctorName}. Cannot book two appointments at the same time.`
      );
      return;
    }

    if (isSlotBlockedByDoctor(selectedSlot)) {
      setErrorMsg(`${doctor.name} is unavailable at ${selectedSlot} on ${selectedDate}.`);
      return;
    }

    if (paymentMethod === 'demo_online') {
      setShowPaymentGateway(true);
    } else {
      executeBooking({ method: 'Cash at Counter' });
    }
  };

  const executeBooking = async (demoPaymentDetails?: { txnId?: string; method?: string }) => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const created = await api.bookAppointment({
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpeciality: doctor.speciality,
        hospitalId: doctor.hospitalId,
        hospitalName: doctor.hospitalName,
        city: doctor.city,
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot,
        patientId: currentUser?.id || 'usr-4',
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail.trim(),
        patientAge: parseInt(patientAge, 10) || 28,
        patientGender,
        symptoms: symptoms.trim() || 'General Consultation',
        fee: doctor.fee,
        paymentMethod,
        demoPaymentDetails,
      });

      // Persist booked appointment ID locally so it always appears in My Visits
      try {
        const savedIds = JSON.parse(localStorage.getItem('citycare_my_appointment_ids') || '[]');
        if (Array.isArray(savedIds) && !savedIds.includes(created.id)) {
          savedIds.unshift(created.id);
          localStorage.setItem('citycare_my_appointment_ids', JSON.stringify(savedIds));
        }
      } catch {
        // ignore storage error
      }

      setShowPaymentGateway(false);
      onSuccess(created);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Booking could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  const cartoonAvatar =
    doctor.avatar && doctor.avatar.startsWith('data:image/svg+xml')
      ? doctor.avatar
      : getDoctorCartoonAvatar(doctor.name, doctor.speciality, doctor.gender);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-[#070D19]/95 backdrop-blur-2xl text-slate-100 rounded-3xl max-w-3xl w-full my-auto overflow-hidden shadow-[0_25px_90px_rgba(0,0,0,0.85)] border border-white/15 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Ambient Glass Glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#A3E635]/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 -right-20 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl" />

        {/* Compact Dark Glassmorphism Header */}
        <div className="relative bg-white/[0.03] text-white px-5 sm:px-6 py-3.5 border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-5 p-2 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors"
            aria-label="Close booking modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5 pr-10">
            <img
              src={cartoonAvatar}
              alt={doctor.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-[#A3E635] bg-slate-900 shrink-0 shadow-[0_0_16px_rgba(163,230,53,0.25)]"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold text-[#A3E635] uppercase tracking-wider block">
                {doctor.speciality} · {doctor.qualification}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h2 className="text-lg sm:text-xl font-extrabold text-white truncate">
                  {doctor.name}
                </h2>
                <p className="text-xs text-slate-300 flex items-center gap-1 truncate">
                  <Building2 className="w-3.5 h-3.5 text-[#A3E635] shrink-0" />
                  <span className="truncate">
                    {doctor.hospitalName} · {doctor.city}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Modal Body */}
        <div className="relative px-5 sm:px-6 py-4 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-200 font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Date Selection */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#A3E635]" />
              <span>1. Select Appointment Date</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {dateOptions.map((opt) => {
                const isSelected = selectedDate === opt.dateStr;
                const displayLabel = (opt.label.split(',')[1] || opt.label).trim();
                return (
                  <button
                    key={opt.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(opt.dateStr)}
                    className={`px-1.5 py-2 rounded-xl text-center transition-all cursor-pointer border flex flex-col items-center justify-center min-w-0 ${
                      isSelected
                        ? 'bg-[#A3E635] text-slate-950 border-[#A3E635] font-extrabold shadow-[0_0_16px_rgba(163,230,53,0.3)]'
                        : 'bg-white/[0.04] hover:bg-white/[0.09] text-slate-200 border-white/10'
                    }`}
                  >
                    <span
                      className={`block text-[9px] uppercase tracking-wider leading-none ${
                        isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {opt.dayOfWeek}
                    </span>
                    <span className="block text-[11px] font-extrabold mt-1 whitespace-nowrap">
                      {displayLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Slot Selection (Compact 3-to-5 column grid) */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#A3E635]" />
                <span>2. Select Time Slot</span>
              </label>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/12 text-[#A3E635] text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
                <span>LIVE IST: {clock.time12h}</span>
              </span>
            </div>

            {selectedDate === clock.todayStr &&
              allSlots.some((s) => isSlotPast(s)) && (
                <div className="mb-2.5 px-3 py-2 rounded-xl bg-amber-500/12 border border-amber-400/30 text-[11px] text-amber-200 font-medium flex items-center justify-between gap-3">
                  <span>
                    Current IST: <strong className="text-[#A3E635]">{clock.timeShort} ({clock.period})</strong>. Past slots for Today are locked.
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(clock.tomorrowStr)}
                    className="px-2.5 py-1 rounded-lg bg-[#A3E635] text-slate-950 font-extrabold text-[10px] shrink-0 cursor-pointer hover:bg-[#84CC16] transition-colors"
                  >
                    Book Tomorrow
                  </button>
                </div>
              )}

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {allSlots.map((slot) => {
                const past = isSlotPast(slot);
                const bookedByDoc = isSlotBookedByDoctor(slot);
                const overlapApt = getPatientOverlapBooking(slot);
                const blocked = isSlotBlockedByDoctor(slot);
                const unavailable = Boolean(past || bookedByDoc || overlapApt || blocked);
                const isSelected = normalizeSlot(selectedSlot) === normalizeSlot(slot) && !unavailable;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={unavailable}
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-1 transition-all border ${
                      past
                        ? 'bg-white/[0.02] text-slate-500 border-white/5 cursor-not-allowed opacity-60 line-through'
                        : unavailable
                        ? 'bg-rose-500/10 text-rose-300/70 border-rose-500/20 cursor-not-allowed opacity-75 line-through'
                        : isSelected
                        ? 'bg-[#A3E635] text-slate-950 border-[#A3E635] shadow-[0_0_16px_rgba(163,230,53,0.25)] cursor-pointer font-extrabold'
                        : 'bg-white/[0.04] text-slate-200 border-white/10 hover:bg-white/[0.09] hover:border-white/20 cursor-pointer'
                    }`}
                  >
                    <span className="tabular-nums whitespace-nowrap">{slot}</span>
                    {past ? (
                      <span className="text-[9px] text-slate-500 font-semibold no-underline">Past</span>
                    ) : blocked ? (
                      <span className="text-[9px] text-amber-400 no-underline">Leave</span>
                    ) : bookedByDoc ? (
                      <span className="text-[9px] text-rose-400 font-bold no-underline">Full</span>
                    ) : overlapApt ? (
                      <span className="text-[9px] text-rose-400 font-bold no-underline">Booked</span>
                    ) : isSelected ? (
                      <Check className="w-3.5 h-3.5 text-slate-950 stroke-[2.75] shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Patient Details Form (Compact Grid) */}
          <div className="pt-3.5 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider">
                3. Patient Details
              </span>
              {currentUser?.id && (
                <span className="text-[10px] font-mono font-bold text-[#A3E635] bg-[#A3E635]/12 px-2 py-0.5 rounded-md border border-[#A3E635]/30">
                  Patient ID: {currentUser.id}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-12 gap-2.5">
              <div className="col-span-2 sm:col-span-4">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 text-xs font-medium text-white placeholder-slate-500 rounded-xl border border-white/12 bg-white/[0.05] focus:bg-white/[0.08] focus:outline-none focus:border-[#A3E635]"
                />
              </div>

              <div className="col-span-2 sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs font-mono font-medium text-white placeholder-slate-500 rounded-xl border border-white/12 bg-white/[0.05] focus:bg-white/[0.08] focus:outline-none focus:border-[#A3E635]"
                />
              </div>

              <div className="col-span-1 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Age</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-medium text-white rounded-xl border border-white/12 bg-white/[0.05] focus:bg-white/[0.08] focus:outline-none focus:border-[#A3E635]"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                  className="w-full px-2.5 py-2 text-xs font-medium text-white rounded-xl border border-white/12 bg-[#0F172A] focus:outline-none focus:border-[#A3E635]"
                >
                  <option value="Male" className="bg-[#0F172A] text-white">Male</option>
                  <option value="Female" className="bg-[#0F172A] text-white">Female</option>
                  <option value="Other" className="bg-[#0F172A] text-white">Other</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="patient@email.com"
                  className="w-full px-3 py-2 text-xs font-medium text-white placeholder-slate-500 rounded-xl border border-white/12 bg-white/[0.05] focus:bg-white/[0.08] focus:outline-none focus:border-[#A3E635]"
                />
              </div>
            </div>

            {/* Combined Symptoms + Payment Mode Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              <div className="sm:col-span-5">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Symptoms / Clinical Notes
                </label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Briefly state symptoms (e.g. fever, checkup)..."
                  className="w-full px-3 py-2.5 text-xs font-medium text-white placeholder-slate-500 rounded-xl border border-white/12 bg-white/[0.05] focus:bg-white/[0.08] focus:outline-none focus:border-[#A3E635]"
                />
              </div>

              <div className="sm:col-span-7">
                <label className="text-[11px] font-extrabold text-slate-200 uppercase tracking-wider block mb-1">
                  4. Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setPaymentMethod('cash')}
                    className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2.5 border ${
                      paymentMethod === 'cash'
                        ? 'bg-[#A3E635]/15 border-[#A3E635] ring-1 ring-[#A3E635]/40'
                        : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#A3E635]/20 text-[#A3E635] flex items-center justify-center shrink-0">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-xs text-white block truncate">Cash at Desk</span>
                      <span className="text-[10px] text-slate-400 block truncate">Pay ₹{doctor.fee} on arrival</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('demo_online')}
                    className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2.5 border ${
                      paymentMethod === 'demo_online'
                        ? 'bg-[#A3E635]/15 border-[#A3E635] ring-1 ring-[#A3E635]/40'
                        : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-xs text-white block truncate">
                        Online Instant Pay
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">UPI / Card receipt</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Footer Actions */}
        <div className="relative px-5 sm:px-6 py-3.5 bg-slate-950/80 border-t border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-slate-400">Consultation Fee:</span>
            <span className="text-xl font-extrabold text-white tabular-nums">
              ₹{doctor.fee}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/12 hover:bg-white/[0.12] text-slate-200 text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleProceed}
              disabled={submitting || !selectedSlot}
              className="px-5 py-2.5 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] disabled:opacity-50 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all cursor-pointer"
            >
              {submitting ? (
                <span>Confirming...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {paymentMethod === 'demo_online' ? 'Proceed to Pay' : 'Confirm Booking'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showPaymentGateway && (
        <PaymentModal
          amount={doctor.fee}
          doctorName={doctor.name}
          hospitalName={doctor.hospitalName}
          onSuccess={(details) => executeBooking(details)}
          onClose={() => setShowPaymentGateway(false)}
        />
      )}
    </div>
  );
};
