import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { SmartBookingResult, Doctor, User, Hospital } from '../types';
import { HospitalMap } from './HospitalMap';
import { InteractiveBodyMap } from './InteractiveBodyMap';
import { EmergencyCommandModal } from './EmergencyCommandModal';
import { getDoctorCartoonAvatar } from '../utils/doctorAvatars';
import {
  useInternetTime,
  getUpcomingISTDates,
  isSlotPastInIST,
} from '../utils/internetTime';
import {
  ArrowRight,
  Activity,
  Clock,
  Sparkles,
  AlertTriangle,
  MapPin,
  Building2,
  CalendarX,
  Star,
  Check,
  Mic,
  ShieldCheck,
  CheckCircle2,
  Sun,
  Sunrise,
  Sunset,
  SlidersHorizontal,
  PhoneCall,
  Thermometer,
  Wind,
  HeartPulse,
  Brain,
  Baby,
  Flame,
  Bone,
  Pill,
} from 'lucide-react';

interface SymptomCheckerProps {
  onSelectSpeciality: (speciality: string) => void;
  onBookDoctor?: (
    doctor: Doctor,
    details?: { initialSymptoms?: string; initialDate?: string; initialSlot?: string }
  ) => void;
  selectedCity?: string;
  currentUser?: User | null;
  hospitals?: Hospital[];
  onViewMap?: () => void;
}

const COMMON_CONCERNS = [
  {
    id: 'fever',
    label: 'Fever & cold',
    inputLabel: 'Child fever & cold',
    query: 'child fever cold cough viral infection pediatrics general medicine',
    icon: Thermometer,
    iconColor: 'text-emerald-600',
  },
  {
    id: 'cough',
    label: 'Cough & wheezing',
    inputLabel: 'Persistent cough & wheezing',
    query: 'persistent cough wheezing chest congestion asthma pulmonology',
    icon: Wind,
    iconColor: 'text-blue-600',
  },
  {
    id: 'stomach',
    label: 'Stomach pain',
    inputLabel: 'Stomach pain & acidity',
    query: 'stomach pain acidity cramps indigestion gas gastroenterology',
    icon: Flame,
    iconColor: 'text-amber-600',
  },
  {
    id: 'headache',
    label: 'Headache',
    inputLabel: 'Severe migraine headache',
    query: 'migraine headache dizziness vertigo neurology',
    icon: Brain,
    iconColor: 'text-rose-500',
  },
  {
    id: 'child',
    label: 'Child health',
    inputLabel: 'Child fever & pediatric checkup',
    query: 'child fever infant cough baby vaccination pediatrics',
    icon: Baby,
    iconColor: 'text-amber-500',
  },
  {
    id: 'skin',
    label: 'Skin rash',
    inputLabel: 'Skin rash & itching',
    query: 'skin rash itching allergy eczema dermatology',
    icon: Sparkles,
    iconColor: 'text-pink-500',
  },
  {
    id: 'body',
    label: 'Body pain',
    inputLabel: 'Knee & back joint pain',
    query: 'joint pain knee stiffness back pain arthritis orthopedics',
    icon: Bone,
    iconColor: 'text-indigo-500',
  },
  {
    id: 'vomiting',
    label: 'Vomiting',
    inputLabel: 'Nausea & vomiting',
    query: 'vomiting nausea food poisoning dehydration general medicine',
    icon: Pill,
    iconColor: 'text-teal-600',
  },
];

export const SymptomChecker: React.FC<SymptomCheckerProps> = ({
  onSelectSpeciality,
  onBookDoctor,
  selectedCity = 'Amalner',
  currentUser,
  hospitals = [],
  onViewMap,
}) => {
  const clock = useInternetTime(1000);
  const todayStr = clock.todayStr;
  const quickDates = getUpcomingISTDates(7, clock);

  // If it's past 9:30 PM IST, today's OPD has ended -> default to tomorrow morning
  const isAfterOpdHoursToday = clock.minutesSinceMidnight >= 21 * 60 + 30;
  const initialDefaultDate = isAfterOpdHoursToday ? clock.tomorrowStr : clock.todayStr;
  const initialDefaultTime = isAfterOpdHoursToday
    ? 'morning'
    : clock.period === 'morning'
    ? 'morning'
    : clock.period === 'afternoon'
    ? 'afternoon'
    : 'evening';

  const [inputText, setInputText] = useState('Child fever & cold');
  const [activeConcernId, setActiveConcernId] = useState<string>('fever');
  const [preferredDate, setPreferredDate] = useState(initialDefaultDate);
  const [preferredTime, setPreferredTime] = useState(initialDefaultTime);
  const [isListening, setIsListening] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Results & Right-Panel Filters
  const [smartResult, setSmartResult] = useState<SmartBookingResult | null>(null);
  const [selectedSpecFilter, setSelectedSpecFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'best' | 'fee' | 'rating'>('best');
  const [symptomInputMode, setSymptomInputMode] = useState<'chips' | 'bodymap'>('chips');
  const [activeBodyZoneId, setActiveBodyZoneId] = useState<string>('chest');
  const [showEmergencyRadar, setShowEmergencyRadar] = useState<boolean>(false);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Handle Smart AI Booking & Triage
  const handleSmartBooking = async (
    textToAnalyze?: string,
    overrideDate?: string,
    overrideTime?: string
  ) => {
    const text = (textToAnalyze !== undefined ? textToAnalyze : inputText).trim();
    if (!text) {
      setErrorMessage('Please describe your symptoms to find matching doctors and slots.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await api.smartBookingTriage({
        symptoms: text,
        preferredDate: overrideDate || preferredDate,
        preferredTime: overrideTime || preferredTime,
        city: selectedCity,
        patientId: currentUser?.id,
      });

      setSmartResult(data);
      if (data.autoAdvancedFromToday && data.preferredDate) {
        setPreferredDate(data.preferredDate);
      }
      setSelectedSpecFilter('All');
    } catch (err: any) {
      console.error('Error running smart triage:', err);
      setErrorMessage(
        err.message ||
          'Unable to complete smart booking triage. Please check your connection and try again.'
      );
      setSmartResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run initial triage when component mounts or city changes
  useEffect(() => {
    const defaultQuery =
      COMMON_CONCERNS.find((c) => c.id === activeConcernId)?.query ||
      inputText ||
      'Child fever & cold';
    handleSmartBooking(defaultQuery);
  }, [selectedCity]);

  // Quick symptom concern pill handler
  const handleQuickTagClick = (concern: (typeof COMMON_CONCERNS)[0]) => {
    setActiveConcernId(concern.id);
    setInputText(concern.inputLabel);
    handleSmartBooking(concern.query);
  };

  // Voice Input Handler
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInputText('Fever, headache and throat pain since yesterday');
      setActiveConcernId('');
      handleSmartBooking('Fever, headache and throat pain since yesterday');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputText(transcript);
          setActiveConcernId('');
          handleSmartBooking(transcript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleBookOption = (doc: Doctor, chosenSlot?: string) => {
    if (onBookDoctor) {
      onBookDoctor(doc, {
        initialSymptoms: inputText,
        initialDate: smartResult?.preferredDate || preferredDate,
        initialSlot: chosenSlot,
      });
    } else {
      onSelectSpeciality(doc.speciality);
    }
  };

  // Compute specialty tabs and sorted options for the right dark panel
  const allOptions = smartResult?.options || [];
  const availableSpecialties = Array.from(
    new Set(allOptions.map((o) => o.doctor.speciality))
  );

  const filteredOptions = allOptions
    .filter((opt) =>
      selectedSpecFilter === 'All' ? true : opt.doctor.speciality === selectedSpecFilter
    )
    .slice()
    .sort((a, b) => {
      if (sortBy === 'fee') return (a.doctor.fee || 0) - (b.doctor.fee || 0);
      if (sortBy === 'rating') return (b.doctor.rating || 4.8) - (a.doctor.rating || 4.8);
      return 0;
    });

  // Extract hospitals for the embedded map preview
  const matchedHospitals: Hospital[] =
    allOptions.length > 0
      ? Array.from(new Map(allOptions.map((o) => [o.hospital.id, o.hospital])).values())
      : hospitals;

  const mapCenter: [number, number] =
    matchedHospitals.length > 0 && matchedHospitals[0].lat && matchedHospitals[0].lng
      ? [matchedHospitals[0].lat, matchedHospitals[0].lng]
      : [21.0441, 75.0641];

  return (
    <div className="space-y-6">
      {/* MAIN 2-COLUMN SPLIT DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================
            LEFT COLUMN (6 cols): HERO + SYMPTOM & SCHEDULE INPUTS
           ============================================================ */}
        <div className="lg:col-span-6 space-y-5">
          {/* Hero Intro Card */}
          <div className="rounded-3xl bg-gradient-to-br from-white via-white to-blue-50/70 border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Powered Triage & Smart Booking</span>
            </div>

            <h1 className="text-3xl sm:text-[34px] font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Find the right care.{' '}
              <span className="text-blue-600">Without the </span>
              <span className="relative inline-block text-blue-600">
                guesswork.
                <span className="absolute left-0 right-0 -bottom-1 h-1.5 bg-[#A3E635] rounded-full" />
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              Describe your symptoms and choose a preferred time. CityCare AI will match you with
              the best specialists and available appointments near you.
            </p>

            {/* 3 Feature Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[
                'AI understands your symptoms',
                'Finds the right specialists',
                'Shows real-time available slots',
              ].map((feat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-[11px] font-semibold text-slate-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Step 1, 2, 3 Input Form Card */}
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
            {/* STEP 1: Describe your health condition */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2.5 text-sm sm:text-base font-extrabold text-slate-900">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>Describe your health condition</span>
                </label>

                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isListening ? 'Listening...' : 'Use voice input'}</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  maxLength={500}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    setActiveConcernId('');
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="E.g., Child fever & cold, persistent cough, or stomach pain..."
                  rows={2}
                  className="w-full px-4 py-3.5 text-sm font-medium text-slate-900 bg-slate-50/70 rounded-2xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none placeholder:text-slate-400"
                />
                <span className="absolute right-3.5 bottom-2.5 text-[11px] font-mono text-slate-400">
                  {inputText.length}/500
                </span>
              </div>

              {/* Mode Toggle: Quick Concerns vs Interactive Body Map */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {symptomInputMode === 'chips'
                      ? 'Or select a common concern'
                      : 'Click any organ or body region to localize symptoms'}
                  </span>

                  <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/90 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setSymptomInputMode('chips')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        symptomInputMode === 'chips'
                          ? 'bg-[#0F172A] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Quick Concerns
                    </button>
                    <button
                      type="button"
                      onClick={() => setSymptomInputMode('bodymap')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                        symptomInputMode === 'bodymap'
                          ? 'bg-[#0F172A] text-[#A3E635] shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Interactive Body Map</span>
                    </button>
                  </div>
                </div>

                {symptomInputMode === 'chips' ? (
                  <div className="flex flex-wrap gap-2">
                    {COMMON_CONCERNS.map((concern) => {
                      const Icon = concern.icon;
                      const isSelected =
                        activeConcernId === concern.id ||
                        inputText.toLowerCase() === concern.inputLabel.toLowerCase() ||
                        inputText.toLowerCase() === concern.label.toLowerCase();
                      return (
                        <button
                          key={concern.id}
                          type="button"
                          onClick={() => handleQuickTagClick(concern)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-[#A3E635] text-slate-950 border-[#84CC16] font-extrabold shadow-xs'
                              : 'bg-slate-50/90 hover:bg-slate-100 text-slate-700 border-slate-200/90'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                          ) : (
                            <Icon className={`w-3.5 h-3.5 ${concern.iconColor}`} />
                          )}
                          <span>{concern.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <InteractiveBodyMap
                    selectedZoneId={activeBodyZoneId}
                    onSelectSymptom={({ zone, symptomLabel, query }) => {
                      setActiveBodyZoneId(zone.id);
                      setActiveConcernId('');
                      setInputText(symptomLabel);
                      handleSmartBooking(query);
                    }}
                  />
                )}
              </div>
            </div>

            {/* STEP 2 & STEP 3: Date & Preferred Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              {/* STEP 2: Preferred Date */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span>Preferred Date</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {clock.dateDisplay}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="date"
                    min={todayStr}
                    value={preferredDate}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      setPreferredDate(nextDate);
                      handleSmartBooking(undefined, nextDate, preferredTime);
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 cursor-pointer"
                  />
                </div>

                {/* Quick Date Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {quickDates.slice(0, 4).map((qd) => {
                    const isActive = preferredDate === qd.dateStr;
                    const isTodayClosed = qd.dateStr === todayStr && isAfterOpdHoursToday;
                    return (
                      <button
                        key={qd.dateStr}
                        type="button"
                        disabled={isTodayClosed}
                        onClick={() => {
                          let nextTime = preferredTime;
                          if (qd.dateStr === todayStr) {
                            if (preferredTime === 'morning' && clock.minutesSinceMidnight >= 12 * 60) {
                              nextTime = clock.minutesSinceMidnight >= 17 * 60 ? 'evening' : 'afternoon';
                              setPreferredTime(nextTime);
                            } else if (preferredTime === 'afternoon' && clock.minutesSinceMidnight >= 17 * 60) {
                              nextTime = 'evening';
                              setPreferredTime(nextTime);
                            }
                          }
                          setPreferredDate(qd.dateStr);
                          handleSmartBooking(undefined, qd.dateStr, nextTime);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          isTodayClosed
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed line-through'
                            : isActive
                            ? 'bg-[#0F172A] text-white shadow-xs cursor-pointer'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 cursor-pointer'
                        }`}
                      >
                        {qd.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: Preferred Time */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span>Preferred Time</span>
                  </label>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-[#A3E635] text-[10px] font-mono font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
                    <span>IST {clock.time12h}</span>
                  </span>
                </div>

                <select
                  value={preferredTime}
                  onChange={(e) => {
                    setPreferredTime(e.target.value);
                    handleSmartBooking(undefined, preferredDate, e.target.value);
                  }}
                  className="w-full px-3 py-2.5 text-xs font-bold text-slate-900 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="any">Any Available Live Time Slot</option>
                  <option
                    value="morning"
                    disabled={preferredDate === todayStr && clock.minutesSinceMidnight >= 12 * 60}
                  >
                    Morning (9AM - 12PM){' '}
                    {preferredDate === todayStr && clock.minutesSinceMidnight >= 12 * 60
                      ? '— Passed Today'
                      : ''}
                  </option>
                  <option
                    value="afternoon"
                    disabled={preferredDate === todayStr && clock.minutesSinceMidnight >= 17 * 60}
                  >
                    Afternoon (12PM - 5PM){' '}
                    {preferredDate === todayStr && clock.minutesSinceMidnight >= 17 * 60
                      ? '— Passed Today'
                      : ''}
                  </option>
                  <option
                    value="evening"
                    disabled={preferredDate === todayStr && clock.minutesSinceMidnight >= 21 * 60 + 30}
                  >
                    Evening OPD (5PM - 9:30PM)
                  </option>
                  {['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM', '07:00 PM', '08:30 PM', '09:30 PM'].map(
                    (slotOpt) => {
                      const past = isSlotPastInIST(preferredDate, slotOpt, clock);
                      return (
                        <option key={slotOpt} value={slotOpt} disabled={past}>
                          Exact Slot: {slotOpt} {past ? '(Passed Today)' : ''}
                        </option>
                      );
                    }
                  )}
                </select>

                {/* 3 Time Window Cards */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    {
                      id: 'morning',
                      title: 'Morning',
                      sub: '9AM - 12PM',
                      icon: Sunrise,
                      isPastToday:
                        preferredDate === todayStr && clock.minutesSinceMidnight >= 12 * 60,
                    },
                    {
                      id: 'afternoon',
                      title: 'Afternoon',
                      sub: '12PM - 5PM',
                      icon: Sun,
                      isPastToday:
                        preferredDate === todayStr && clock.minutesSinceMidnight >= 17 * 60,
                    },
                    {
                      id: 'evening',
                      title: 'Evening',
                      sub: '5PM - 9:30PM',
                      icon: Sunset,
                      isPastToday:
                        preferredDate === todayStr && clock.minutesSinceMidnight >= 21 * 60 + 30,
                    },
                  ].map((tw) => {
                    const TwIcon = tw.icon;
                    const isSelected = preferredTime === tw.id && !tw.isPastToday;
                    return (
                      <button
                        key={tw.id}
                        type="button"
                        disabled={tw.isPastToday}
                        onClick={() => {
                          setPreferredTime(tw.id);
                          handleSmartBooking(undefined, preferredDate, tw.id);
                        }}
                        className={`p-2 rounded-xl text-center transition-all border flex flex-col items-center justify-center gap-0.5 ${
                          tw.isPastToday
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                            : isSelected
                            ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs cursor-pointer'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/90 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[11px] font-extrabold">
                          <TwIcon
                            className={`w-3 h-3 ${
                              tw.isPastToday
                                ? 'text-slate-400'
                                : isSelected
                                ? 'text-amber-300'
                                : 'text-amber-500'
                            }`}
                          />
                          <span className={tw.isPastToday ? 'line-through' : ''}>{tw.title}</span>
                        </div>
                        <span
                          className={`text-[9px] font-medium ${
                            tw.isPastToday
                              ? 'text-rose-500 font-bold'
                              : isSelected
                              ? 'text-blue-100'
                              : 'text-slate-400'
                          }`}
                        >
                          {tw.isPastToday ? 'Passed Today' : tw.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Error Message with Retry Button */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSmartBooking()}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all cursor-pointer shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Primary Neon-Lime Action Button */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => handleSmartBooking()}
                disabled={loading || !inputText.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-[#A3E635] hover:bg-[#84CC16] disabled:opacity-50 text-slate-950 font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>Matching Doctors & Slots...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950" />
                    <span>Find Doctors & Available Slots</span>
                    <ArrowRight className="w-5 h-5 text-slate-950" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Real-time slot verification</span>
                <span>•</span>
                <span>No double bookings</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            RIGHT COLUMN (6 cols): EMERGENCY BANNER + DARK NAVY MATCHES
           ============================================================ */}
        <div className="lg:col-span-6 space-y-4">
          {/* Prominent Medical Emergency Showcase Banner with Simulated ER Beds & 108 Dispatch Radar */}
          <div className="rounded-2xl bg-gradient-to-r from-[#2B1216] via-[#3D161C] to-[#2B1216] text-white p-4 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600/90 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-white text-xs font-extrabold">
                    Emergency & 108 Ambulance Simulator
                  </strong>
                  <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[9px] font-mono uppercase text-[#A3E635] font-bold">
                    Project Showcase Demo
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-rose-100">
                  Simulate live ICU/O₂ beds in {selectedCity} and test 108 ambulance dispatch
                  (Showcase simulation only — no real phone call placed).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowEmergencyRadar(true)}
                className="px-3.5 py-2.5 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>ER & 108 Simulator</span>
              </button>
              <button
                type="button"
                onClick={() => setShowEmergencyRadar(true)}
                className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Simulate 108 Call</span>
              </button>
            </div>
          </div>

          {/* Urgent Triage Notice if Emergency Detected by AI */}
          {smartResult &&
            (smartResult.triage.isEmergency || smartResult.triage.urgency === 'Emergency') && (
              <div className="p-4 rounded-2xl bg-rose-950 border border-rose-500 text-rose-100 text-xs flex items-center gap-3">
                <PhoneCall className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
                <div>
                  <span className="font-bold text-white block">
                    High-Priority Clinical Alert: {smartResult.triage.primarySpeciality}
                  </span>
                  <span>
                    {smartResult.triage.urgentCareGuidance ||
                      'Symptoms indicate urgent clinical attention is advised. Proceed to emergency care immediately.'}
                  </span>
                </div>
              </div>
            )}

          {/* DARK NAVY RESULTS CONTAINER */}
          <div className="rounded-3xl bg-[#0B1120] text-white p-5 sm:p-6 border border-slate-800/90 shadow-xl space-y-5">
            {/* Top Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#A3E635]" />
                  <h2 className="text-xl font-extrabold tracking-tight text-white">
                    Your care matches
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Based on your symptoms, location (
                  <span className="text-[#A3E635] font-bold underline decoration-[#A3E635]/60">
                    {selectedCity}
                  </span>
                  ) and preferred time.
                </p>
              </div>

              <button
                type="button"
                onClick={() => inputRef.current?.focus()}
                className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Search</span>
              </button>
            </div>

            {/* Live Internet Time Synchronization Notice */}
            <div className="px-3.5 py-2.5 rounded-2xl bg-slate-900/95 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-[#A3E635] shrink-0" />
                <span>
                  {smartResult?.timeNotice ||
                    `Internet Time Sync (${clock.time12h} IST): Showing live verified slots for ${
                      smartResult?.preferredDate || preferredDate
                    }.`}
                </span>
              </div>
              {preferredDate === todayStr && (
                <button
                  type="button"
                  onClick={() => {
                    setPreferredDate(clock.tomorrowStr);
                    setPreferredTime('morning');
                    handleSmartBooking(undefined, clock.tomorrowStr, 'morning');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#A3E635] font-bold text-[11px] border border-slate-700 cursor-pointer shrink-0"
                >
                  View Tomorrow's Morning Slots →
                </button>
              )}
            </div>

            {/* Live Clinical Triage Summary Strip */}
            {smartResult?.triage && (
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#111C38] border border-slate-800">
                <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Target Specialty
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#A3E635] truncate block mt-0.5">
                    {smartResult.triage.primarySpeciality}
                  </span>
                </div>

                <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Clinical Priority
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-extrabold block mt-0.5 ${
                      smartResult.triage.urgency === 'Emergency' ||
                      smartResult.triage.urgency === 'High'
                        ? 'text-rose-400'
                        : smartResult.triage.urgency === 'Medium'
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                    }`}
                  >
                    {smartResult.triage.urgency} Care
                  </span>
                </div>

                <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Est. OPD Queue
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-white font-mono tabular-nums block mt-0.5">
                    ~10–15 mins
                  </span>
                </div>
              </div>
            )}

            {/* Specialty Filter Tabs & Sort Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-b border-slate-800/80 pb-3.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedSpecFilter('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    selectedSpecFilter === 'All'
                      ? 'bg-[#A3E635] text-slate-950 shadow-xs'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700/80'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedSpecFilter === 'All' ? 'bg-slate-950' : 'bg-[#A3E635]'
                    }`}
                  />
                  <span>All ({allOptions.length})</span>
                </button>

                {availableSpecialties.map((spec) => {
                  const isActive = selectedSpecFilter === spec;
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => setSelectedSpecFilter(spec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#A3E635] text-slate-950 font-bold shadow-xs'
                          : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700/80'
                      }`}
                    >
                      {spec}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-800/90 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="best">Best Match</option>
                  <option value="fee">Lowest Fee</option>
                  <option value="rating">Highest Rating</option>
                </select>
              </div>
            </div>

            {/* Inner 2-Column Split: Left (Doctor Cards) + Right (Map & AI Recommendation) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
              {/* INNER LEFT (7 cols): Doctor Match Cards */}
              <div className="xl:col-span-7 space-y-3.5">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((n) => (
                      <div
                        key={n}
                        className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 animate-pulse space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-slate-800" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-40 bg-slate-800 rounded" />
                            <div className="h-3 w-28 bg-slate-800 rounded" />
                          </div>
                        </div>
                        <div className="h-8 w-full bg-slate-800 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : filteredOptions.length === 0 ? (
                  <div className="p-7 rounded-2xl bg-[#111C38] border border-slate-800 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-[#A3E635]">
                      <CalendarX className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      No Available Slots Found on {smartResult?.preferredDate || preferredDate}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Try selecting &ldquo;Any Available Time Slot&rdquo; or checking tomorrow&apos;s
                      schedule in {selectedCity}.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPreferredTime('any');
                          handleSmartBooking(undefined, preferredDate, 'any');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#A3E635] text-slate-950 text-xs font-extrabold cursor-pointer"
                      >
                        Show All Time Slots
                      </button>
                      {smartResult?.triage?.primarySpeciality && (
                        <button
                          type="button"
                          onClick={() => onSelectSpeciality(smartResult.triage.primarySpeciality)}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          Browse All Doctors
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {filteredOptions.slice(0, 3).map((opt, i) => {
                      const doc = opt.doctor;
                      const hosp = opt.hospital;
                      const chosenSlot = opt.recommendedSlot || opt.availableSlots[0];

                      return (
                        <div
                          key={doc.id || i}
                          className="rounded-2xl bg-white text-slate-900 p-4 shadow-md border border-slate-100 space-y-3 transition-all hover:shadow-lg"
                        >
                          {/* Top Badge & Rating Row */}
                          <div className="flex items-center justify-between gap-2">
                            {i === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#ECFCCB] text-emerald-950 border border-[#A3E635] text-[11px] font-extrabold">
                                <Sparkles className="w-3 h-3 text-emerald-700 fill-emerald-700" />
                                <span>Best Match</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                                Verified Specialist
                              </span>
                            )}

                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-xs font-extrabold text-slate-800">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span className="tabular-nums">{doc.rating || 4.8}</span>
                              <span className="text-[10px] text-slate-400 font-medium">(120+)</span>
                            </div>
                          </div>

                          {/* Doctor Avatar & Core Details */}
                          <div className="flex items-start gap-3.5">
                            <img
                              src={
                                doc.avatar && doc.avatar.startsWith('data:image/svg+xml')
                                  ? doc.avatar
                                  : getDoctorCartoonAvatar(doc.name, doc.speciality, doc.gender)
                              }
                              alt={doc.name}
                              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                            />
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-extrabold text-slate-900 text-base truncate">
                                  {doc.name}
                                </h4>
                                <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-50 shrink-0" />
                              </div>

                              <p className="text-xs font-semibold text-slate-600">
                                {doc.speciality} · {doc.qualification} ·{' '}
                                <span className="tabular-nums">{doc.experience} yrs exp</span>
                              </p>

                              <p className="text-xs text-slate-500 flex items-center gap-1 truncate pt-0.5">
                                <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="truncate font-medium">{hosp.name}</span>
                                <span>·</span>
                                <span className="shrink-0">{hosp.city || doc.city}</span>
                              </p>

                              <div className="pt-1">
                                <span className="inline-block text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md tabular-nums">
                                  ₹{doc.fee} Consultation Fee
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Available Slots Strip */}
                          <div className="pt-2.5 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-600 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                <span>
                                  Available{' '}
                                  {smartResult?.preferredDate === todayStr
                                    ? 'today'
                                    : smartResult?.preferredDate}
                                  :
                                </span>
                              </span>
                              <span className="text-slate-400 font-medium">Click slot to book</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {opt.availableSlots.slice(0, 4).map((slot) => {
                                const isRecommended = slot === chosenSlot;
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => handleBookOption(doc, slot)}
                                    className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1 tabular-nums ${
                                      isRecommended
                                        ? 'bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 font-extrabold shadow-xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold'
                                    }`}
                                  >
                                    <span>{slot}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() =>
                        onSelectSpeciality(smartResult?.triage?.primarySpeciality || 'All')
                      }
                      className="w-full py-3 rounded-2xl bg-[#111C38] hover:bg-slate-800 text-white font-bold text-xs border border-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>View More Doctors</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* INNER RIGHT (5 cols): Nearby Hospitals Map & Why These Doctors */}
              <div className="xl:col-span-5 space-y-4">
                {/* Nearby Hospitals & Route Map Widget */}
                <div className="rounded-2xl bg-[#111C38] border border-slate-800 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#A3E635]" />
                      <span>Nearby Hospitals & Route</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">{selectedCity}</span>
                  </div>

                  <div className="h-44 rounded-xl overflow-hidden border border-slate-700/80 relative">
                    <HospitalMap
                      hospitals={matchedHospitals}
                      selectedHospital={matchedHospitals[0] || null}
                      onSelectHospital={() => {}}
                      center={mapCenter}
                      zoom={13}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onViewMap) onViewMap();
                      else onSelectSpeciality('All');
                    }}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>View on Map</span>
                  </button>
                </div>

                {/* Why These Doctors? AI Recommendation Card */}
                <div className="rounded-2xl bg-[#111C38] border border-slate-800 p-4 space-y-3">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#A3E635]" />
                    <span>AI Recommendation</span>
                  </div>

                  <h4 className="text-sm font-extrabold text-white">Why these doctors?</h4>

                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        Specialists in{' '}
                        <strong className="text-white">
                          {smartResult?.triage?.primarySpeciality || 'General Medicine & Pediatrics'}
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        Located in <strong className="text-white">{selectedCity}</strong> near you
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        Available slots in your{' '}
                        <strong className="text-white">preferred time window</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        Verified CityCare <strong className="text-white">network hospitals</strong>
                      </span>
                    </li>
                  </ul>

                  {smartResult?.triage?.clinicalExplanation && (
                    <p className="text-[11px] text-slate-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800 leading-relaxed">
                      {smartResult.triage.clinicalExplanation}
                    </p>
                  )}

                  <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 leading-normal">
                    Not a medical diagnosis. Consult a doctor for medical advice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          BOTTOM 4-CARD FEATURE STRIP
         ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {/* Card 1: Electric Blue */}
        <div className="rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white p-5 flex items-start gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 text-[#A3E635]">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-white">AI Analyses Your Symptoms</h3>
            <p className="text-xs text-blue-100 leading-relaxed">
              Matches your condition with the right medical department
            </p>
          </div>
        </div>

        {/* Card 2: Verified Hospitals */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 flex items-start gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0 text-emerald-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-900">Verified Hospitals</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real facilities & doctors in your selected city
            </p>
          </div>
        </div>

        {/* Card 3: Safe & Reliable */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-5 flex items-start gap-3.5 shadow-xs">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center shrink-0 text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-900">Safe & Reliable</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instant booking with zero double-booking risk
            </p>
          </div>
        </div>

        {/* Card 4: Hospital Network Visual Banner */}
        <div className="relative rounded-2xl overflow-hidden min-h-[104px] flex items-end p-5 text-white shadow-xs group">
          <img
            src="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80"
            alt="CityCare Hospital Network"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/75 to-slate-900/40" />
          <div className="relative z-10 space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A3E635] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>CityCare Network</span>
            </span>
            <h3 className="text-sm font-extrabold text-white">Quality Healthcare Near You</h3>
            <p className="text-[11px] text-slate-300">Trusted Doctors · Easy Appointments</p>
          </div>
        </div>
      </div>

      {/* Live Emergency & Bed Capacity Command Modal */}
      {showEmergencyRadar && (
        <EmergencyCommandModal
          selectedCity={selectedCity}
          hospitals={matchedHospitals}
          onClose={() => setShowEmergencyRadar(false)}
          onSelectHospitalDoctors={() => onSelectSpeciality('All')}
        />
      )}
    </div>
  );
};
