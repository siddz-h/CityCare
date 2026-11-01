import React, { useState } from 'react';
import { Appointment, User, AppointmentStatus } from '../types';
import { api } from '../services/api';
import { playHospitalQueueChime } from '../utils/audio';
import { useInternetTime } from '../utils/internetTime';
import {
  Volume2,
  Maximize2,
  Minimize2,
  Tv,
  Users,
  Clock,
  CheckCircle2,
  UserCheck,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

interface WaitingRoomQueueBoardProps {
  appointments: Appointment[];
  selectedCity: string;
  currentUser?: User | null;
  onCallToken?: (tokenNumber: string) => void;
  onRefresh?: () => void;
}

export const WaitingRoomQueueBoard: React.FC<WaitingRoomQueueBoardProps> = ({
  appointments,
  selectedCity,
  currentUser,
  onCallToken,
  onRefresh,
}) => {
  const clock = useInternetTime(1000);
  const todayStr = clock.todayStr;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flashingToken, setFlashingToken] = useState<string | null>(null);
  const [activeHospitalName, setActiveHospitalName] = useState<string>('All Affiliated OPDs');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  let savedSessionIds: string[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem('citycare_my_appointment_ids') || '[]');
    if (Array.isArray(parsed)) savedSessionIds = parsed;
  } catch {
    // ignore
  }

  const isMyAppointment = (apt: Appointment) => {
    if (savedSessionIds.includes(apt.id)) return true;
    if (currentUser?.id && apt.patientId === currentUser.id) return true;
    if (
      currentUser?.email &&
      apt.patientEmail &&
      apt.patientEmail.toLowerCase() === currentUser.email.toLowerCase()
    ) {
      return true;
    }
    return false;
  };

  // Filter by selectedCity unless 'All' or it's the user's own appointment or already checked_in/in_consultation
  const cityScoped = appointments.filter((a) => {
    if (a.status === 'checked_in' || a.status === 'in_consultation') return true;
    if (isMyAppointment(a)) return true;
    if (!selectedCity || selectedCity === 'All') return true;
    return (a.city || '').toLowerCase() === selectedCity.toLowerCase();
  });

  // Active queue includes:
  // 1. Any appointment marked 'in_consultation' or 'checked_in' by Reception/Doctor
  // 2. Any 'scheduled' / 'rescheduled' appointment for Today (or user's own upcoming appointment)
  const activeQueueAll = cityScoped.filter((a) => {
    if (a.status === 'cancelled' || a.status === 'no_show' || a.status === 'completed') {
      return false;
    }
    if (a.status === 'in_consultation' || a.status === 'checked_in') {
      return true;
    }
    return a.appointmentDate === todayStr || isMyAppointment(a);
  });

  // Sort queue by priority:
  // 1. in_consultation (Priority 1)
  // 2. checked_in (Priority 2 - Receptionist checked in!)
  // 3. scheduled / rescheduled (Priority 3)
  const priorityScore = (status: AppointmentStatus) => {
    if (status === 'in_consultation') return 1;
    if (status === 'checked_in') return 2;
    return 3;
  };

  const sortedActiveQueue = [...activeQueueAll].sort((a, b) => {
    const pDiff = priorityScore(a.status) - priorityScore(b.status);
    if (pDiff !== 0) return pDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const hospitalList = Array.from(new Set(cityScoped.map((a) => a.hospitalName))).filter(Boolean);

  const displayedList =
    activeHospitalName === 'All Affiliated OPDs'
      ? sortedActiveQueue
      : sortedActiveQueue.filter((a) => a.hospitalName === activeHospitalName);

  const currentServing = displayedList[0] || null;
  const nextInLine = displayedList.slice(1);

  const recentlyCompleted = cityScoped
    .filter(
      (a) =>
        a.status === 'completed' &&
        (activeHospitalName === 'All Affiliated OPDs' || a.hospitalName === activeHospitalName)
    )
    .slice(0, 6);

  const handleAnnounceChime = (token: string) => {
    setFlashingToken(token);
    playHospitalQueueChime();
    if (onCallToken) onCallToken(token);

    setTimeout(() => {
      setFlashingToken(null);
    }, 3000);
  };

  const handleQuickQueueTransition = async (apt: Appointment, nextStatus: AppointmentStatus) => {
    setUpdatingId(apt.id);
    try {
      const assignedRoom = apt.roomNumber || 'OPD Room 102';
      await api.updateAppointmentStatus(apt.id, nextStatus, {
        user: `${currentUser?.name || 'OPD Queue Controller'}`,
        roomNumber: assignedRoom,
        doctorNotes:
          nextStatus === 'completed' && !apt.doctorNotes
            ? `Consultation completed at ${clock.timeShort} IST (${assignedRoom}).`
            : apt.doctorNotes,
      });
      if (nextStatus === 'in_consultation' || nextStatus === 'checked_in') {
        handleAnnounceChime(apt.tokenNumber);
      }
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Failed to update queue status:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`space-y-7 ${isFullscreen ? 'p-10 bg-[#0B1120] text-white min-h-screen' : ''}`}>
      {/* Board Top Controls */}
      <div className="bg-[#0B1120] border border-slate-800 rounded-3xl p-7 sm:p-8 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-[#A3E635]/15 text-[#A3E635] flex items-center justify-center border border-[#A3E635]/30 shrink-0">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#A3E635] font-extrabold uppercase tracking-widest">
                Live OPD Queue Telemetry · {selectedCity}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-mono font-bold text-[#A3E635]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
                <span>LIVE IST: {clock.time12h}</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
              Waiting Lounge Digital Display
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            Checked-In Ready:{' '}
            <strong className="text-[#A3E635]">
              {
                displayedList.filter(
                  (a) => a.status === 'checked_in' || a.status === 'in_consultation'
                ).length
              }
            </strong>
          </div>

          {currentServing && (
            <button
              type="button"
              onClick={() => handleAnnounceChime(currentServing.tokenNumber)}
              className="px-5 py-3 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Volume2 className="w-4 h-4" />
              <span>Announce Token {currentServing.tokenNumber}</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Hospital Filter Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveHospitalName('All Affiliated OPDs')}
          className={`px-4 py-2 rounded-xl font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            activeHospitalName === 'All Affiliated OPDs'
              ? 'bg-[#0F172A] text-[#A3E635]'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          All Affiliated OPDs ({sortedActiveQueue.length})
        </button>
        {hospitalList.slice(0, 5).map((hName) => (
          <button
            key={hName}
            type="button"
            onClick={() => setActiveHospitalName(hName)}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeHospitalName === hName
                ? 'bg-[#0F172A] text-[#A3E635]'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {hName}
          </button>
        ))}
      </div>

      {/* Main Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
        {/* Left Column: Giant "NOW SERVING" Card */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div
            className={`rounded-3xl p-8 sm:p-10 transition-all duration-300 flex flex-col justify-between min-h-[400px] relative overflow-hidden bg-[#0B1120] border border-slate-800 shadow-2xl ${
              flashingToken === currentServing?.tokenNumber ? 'ring-4 ring-[#A3E635]' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A3E635] text-slate-950 text-xs font-extrabold tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                  <span>
                    {currentServing?.status === 'in_consultation'
                      ? 'NOW IN DOCTOR CABIN'
                      : currentServing?.status === 'checked_in'
                      ? 'CHECKED IN · NOW SERVING'
                      : 'NEXT SCHEDULED TOKEN'}
                  </span>
                </span>
                {currentServing && isMyAppointment(currentServing) && (
                  <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold uppercase">
                    Your Token
                  </span>
                )}
              </div>
              <span className="text-xs text-[#A3E635] font-mono font-bold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                {currentServing?.roomNumber || 'OPD Room 102'}
              </span>
            </div>

            {currentServing ? (
              <div className="my-7 relative z-10 space-y-6">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white tabular-nums">
                    {currentServing.tokenNumber}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase ${
                      currentServing.status === 'in_consultation'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                        : currentServing.status === 'checked_in'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {currentServing.status === 'in_consultation'
                      ? 'In Consultation'
                      : currentServing.status === 'checked_in'
                      ? 'Checked-In at Reception'
                      : 'Booked (Awaiting Check-In)'}
                  </span>
                </div>

                <div className="pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-bold">
                      Patient Name
                    </span>
                    <span className="text-lg font-extrabold text-white block mt-1">
                      {currentServing.patientName}
                    </span>
                    <span className="text-slate-400 text-xs font-mono mt-0.5 block">
                      Scheduled: {currentServing.appointmentTime} ({currentServing.appointmentDate})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-bold">
                      Consulting Specialist
                    </span>
                    <span className="text-lg font-extrabold text-[#A3E635] block mt-1">
                      {currentServing.doctorName}
                    </span>
                    <span className="text-slate-300 text-xs mt-0.5 block">
                      {currentServing.doctorSpeciality} · {currentServing.hospitalName}
                    </span>
                  </div>
                </div>

                {/* Live Action Controls directly on Now Serving card */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Live Queue Progression (Syncs with My Visits):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentServing.status === 'scheduled' && (
                      <button
                        type="button"
                        disabled={updatingId === currentServing.id}
                        onClick={() => handleQuickQueueTransition(currentServing, 'checked_in')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Check In Patient</span>
                      </button>
                    )}
                    {currentServing.status === 'checked_in' && (
                      <button
                        type="button"
                        disabled={updatingId === currentServing.id}
                        onClick={() =>
                          handleQuickQueueTransition(currentServing, 'in_consultation')
                        }
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Start Consultation</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={updatingId === currentServing.id}
                      onClick={() => handleQuickQueueTransition(currentServing, 'completed')}
                      className="px-4 py-2 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Visit → Update My Visits</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="my-12 text-center text-slate-400 space-y-2">
                <Users className="w-12 h-12 mx-auto opacity-60 text-[#A3E635]" />
                <h4 className="text-lg font-bold text-white">No Active Tokens Waiting</h4>
                <p className="text-xs text-slate-400">
                  Check in an appointment from Reception or book a new visit to populate the live queue.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 relative z-10">
              <span className="flex items-center gap-2 font-mono">
                <Clock className="w-4 h-4 text-[#A3E635]" />
                <span>Live IST: {clock.time12h}</span>
              </span>
              <span>Proceed to {currentServing?.roomNumber || 'OPD Room 102'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Next in Line Queue List */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Waiting Lounge Queue
                </h3>
                <p className="text-[11px] text-slate-500">
                  Checked-in patients are prioritized automatically
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-extrabold text-emerald-700 tabular-nums">
                {nextInLine.length} in line
              </span>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {nextInLine.length === 0 ? (
                <div className="p-10 text-center text-slate-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    No other patients waiting behind current token
                  </p>
                </div>
              ) : (
                nextInLine.map((item, idx) => {
                  const isCheckedIn =
                    item.status === 'checked_in' || item.status === 'in_consultation';
                  const isMine = isMyAppointment(item);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border flex flex-col gap-3 text-xs transition-all ${
                        isCheckedIn
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-xl font-mono font-extrabold flex items-center justify-center text-xs tabular-nums ${
                              isCheckedIn
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 text-[#A3E635]'
                            }`}
                          >
                            {idx + 2}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-extrabold text-blue-700 text-sm tabular-nums">
                                {item.tokenNumber}
                              </span>
                              {isMine && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-extrabold uppercase">
                                  You
                                </span>
                              )}
                              {isCheckedIn ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-extrabold uppercase">
                                  Checked In
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold uppercase">
                                  Scheduled
                                </span>
                              )}
                            </div>
                            <span className="font-extrabold text-slate-900 block mt-0.5">
                              {item.patientName}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-bold text-slate-700 block truncate max-w-[130px]">
                            {item.doctorName}
                          </span>
                          <span className="text-xs font-mono text-slate-500 font-semibold tabular-nums">
                            {item.appointmentTime}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/70">
                        {!isCheckedIn ? (
                          <button
                            type="button"
                            disabled={updatingId === item.id}
                            onClick={() => handleQuickQueueTransition(item, 'checked_in')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Check In</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={updatingId === item.id}
                              onClick={() => handleQuickQueueTransition(item, 'in_consultation')}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                            >
                              <Stethoscope className="w-3 h-3" />
                              <span>Call Now</span>
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === item.id}
                              onClick={() => handleQuickQueueTransition(item, 'completed')}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[#A3E635] text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Complete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Real-Time Reception & My Visits Sync</span>
            <span className="text-emerald-700 font-extrabold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Recently Completed Today Strip */}
      {recentlyCompleted.length > 0 && (
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Recently Completed Consultations (Updated in Patient "My Visits")
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-700">
              {recentlyCompleted.length} Completed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentlyCompleted.map((apt) => (
              <div
                key={apt.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-slate-900">
                      {apt.tokenNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                      Completed ✓
                    </span>
                  </div>
                  <div className="font-bold text-slate-800 mt-1">{apt.patientName}</div>
                  <div className="text-[11px] text-slate-500">{apt.doctorName}</div>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-500">
                  <div>{apt.appointmentTime}</div>
                  <div>{apt.appointmentDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
