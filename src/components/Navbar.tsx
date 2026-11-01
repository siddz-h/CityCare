import React, { useState, useEffect } from 'react';
import { UserRole, User, Language } from '../types';
import { translations } from '../utils/translations';
import { EmergencyCommandModal } from './EmergencyCommandModal';
import { useInternetTime } from '../utils/internetTime';
import {
  Clock,
  MapPin,
  GraduationCap,
  ChevronDown,
  Check,
  LayoutDashboard,
  Tv,
  LogIn,
  LogOut,
  Building2,
  Stethoscope,
  Activity,
  FileText,
  Bell,
  CalendarCheck,
  PhoneCall,
  X,
  Settings,
  Volume2,
  VolumeX,
  ShieldCheck,
  Sparkles,
  Globe,
  UserCheck,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  currentUser: User | null;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onSwitchRole: (role: UserRole) => void;
  activeView:
    | 'login'
    | 'search'
    | 'doctors'
    | 'symptoms'
    | 'queue_board'
    | 'ehr_vault'
    | 'notifications'
    | 'patient_portal'
    | 'doctor_portal'
    | 'receptionist_portal'
    | 'admin_portal';
  onSelectView: (view: any) => void;
  onOpenVivaGuide: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  cities: string[];
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentUser,
  selectedCity,
  onSelectCity,
  onSwitchRole,
  activeView,
  onSelectView,
  onOpenVivaGuide,
  onOpenLogin,
  onLogout,
  cities,
  currentLanguage,
  onSelectLanguage,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [customCityInput, setCustomCityInput] = useState('');

  // Persisted system settings in the dark glassmorphism drawer
  const [audioChimeEnabled, setAudioChimeEnabled] = useState<boolean>(() => {
    return localStorage.getItem('citycare_audio_chime') !== 'false';
  });
  const [liveQueueAutoSync, setLiveQueueAutoSync] = useState<boolean>(() => {
    return localStorage.getItem('citycare_auto_sync') !== 'false';
  });
  const [strictIstSlotLock, setStrictIstSlotLock] = useState<boolean>(() => {
    return localStorage.getItem('citycare_ist_lock') !== 'false';
  });

  const clock = useInternetTime(1000);
  const t = translations[currentLanguage] || translations.en;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false);
        setShowCityDropdown(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleAudioChime = () => {
    const next = !audioChimeEnabled;
    setAudioChimeEnabled(next);
    localStorage.setItem('citycare_audio_chime', String(next));
  };

  const toggleAutoSync = () => {
    const next = !liveQueueAutoSync;
    setLiveQueueAutoSync(next);
    localStorage.setItem('citycare_auto_sync', String(next));
  };

  const toggleIstLock = () => {
    const next = !strictIstSlotLock;
    setStrictIstSlotLock(next);
    localStorage.setItem('citycare_ist_lock', String(next));
  };

  const roles: { role: UserRole; title: string; desc: string }[] = [
    { role: 'patient', title: 'Patient', desc: 'Book & track visits' },
    { role: 'doctor', title: 'Doctor', desc: 'OPD console & Rx' },
    { role: 'receptionist', title: 'Reception', desc: 'Token check-in desk' },
    { role: 'admin', title: 'Admin', desc: 'Hospital analytics' },
  ];

  const handleCustomCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCityInput.trim()) {
      onSelectCity(customCityInput.trim());
      setShowCityDropdown(false);
      setCustomCityInput('');
    }
  };

  const coreNavItems = [
    { id: 'search', label: t.hospitals || 'Hospitals', icon: Building2, desc: 'Find verified city hospitals & beds' },
    { id: 'doctors', label: t.findDoctors || 'Specialists', icon: Stethoscope, desc: 'Book OPD slots with specialists' },
    { id: 'symptoms', label: t.symptoms || 'Triage', icon: Activity, desc: 'Smart symptom checker & urgency' },
    { id: 'queue_board', label: t.queueBoard || 'Live Queue', icon: Tv, desc: 'Real-time waiting room token display' },
    { id: 'ehr_vault', label: t.ehrVault || 'Health Vault', icon: FileText, desc: 'Digital prescriptions & lab records' },
  ];

  const rolePortalItem =
    currentRole === 'doctor'
      ? { id: 'doctor_portal', label: t.doctorQueue || 'Doctor Queue', icon: CalendarCheck, desc: 'Manage active patient consultations' }
      : currentRole === 'receptionist'
      ? { id: 'receptionist_portal', label: t.receptionDesk || 'Reception', icon: CalendarCheck, desc: 'Verify arrivals & push to live queue' }
      : currentRole === 'admin'
      ? { id: 'admin_portal', label: t.adminReports || 'Admin', icon: CalendarCheck, desc: 'System metrics & capacity overview' }
      : { id: 'patient_portal', label: t.myAppointments || 'My Visits', icon: CalendarCheck, desc: 'Track upcoming & completed visits' };

  return (
    <>
      <header className="sticky top-0 z-30 glass-header border-b border-slate-200/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Zone 1: CityCare Green + Logo (Triggers Left Dark Glass Drawer) + Compact City Selector */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(true);
                  setShowCityDropdown(false);
                  setShowUserMenu(false);
                }}
                title="Click to open CityCare Menu & Settings"
                className="flex items-center gap-2.5 text-left group cursor-pointer whitespace-nowrap shrink-0 p-1 -ml-1 rounded-2xl hover:bg-slate-100/90 transition-all"
              >
                <div className="relative w-10 h-10 rounded-xl bg-[#A3E635] flex items-center justify-center text-slate-950 shadow-sm ring-2 ring-slate-900/5 transition-all group-hover:scale-105 group-hover:shadow-md group-active:scale-95">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-slate-900 text-[#A3E635] flex items-center justify-center border border-white shadow-2xs">
                    <SlidersHorizontal className="w-2 h-2" />
                  </span>
                </div>
                <div className="pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 leading-none">
                      {t.systemTitle || 'CityCare'}
                    </span>
                    <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-900 text-[#A3E635]">
                      Menu
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                    Care Closer to You
                  </span>
                </div>
              </button>

              {/* Compact City Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowCityDropdown(!showCityDropdown);
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 text-slate-800 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="max-w-[88px] truncate">{selectedCity}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showCityDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 glass-modal rounded-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                      {cities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            onSelectCity(city);
                            setShowCityDropdown(false);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-colors cursor-pointer ${
                            selectedCity.toLowerCase() === city.toLowerCase()
                              ? 'bg-emerald-50 text-emerald-700 font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{city}</span>
                          </span>
                          {selectedCity.toLowerCase() === city.toLowerCase() && (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleCustomCitySubmit} className="pt-2.5 mt-2 border-t border-slate-200 flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Town or city..."
                        value={customCityInput}
                        onChange={(e) => setCustomCityInput(e.target.value)}
                        className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl flex-1 bg-slate-50 focus:outline-none focus:border-blue-600 font-medium"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Go
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Zone 2: Clean, Balanced Center Navigation (Never Overflows) */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-600 min-w-0">
              {[...coreNavItems, rolePortalItem].map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectView(item.id)}
                    className={`px-2.5 xl:px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#0F172A] text-[#A3E635] font-bold shadow-xs'
                        : 'hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#A3E635]' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Compact Right Actions (IST Clock + Alerts + Ambulance + Profile) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Live Internet Time (IST) Pill */}
              <div
                onClick={() => setIsDrawerOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-mono font-bold border border-slate-800 shrink-0 cursor-pointer hover:bg-slate-800 transition-colors"
                title={`Synced with ${clock.sourceLabel} • ${clock.dateDisplay}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
                <Clock className="w-3 h-3 text-[#A3E635]" />
                <span className="text-[#A3E635] tabular-nums">{clock.time12h}</span>
                <span className="text-slate-400 uppercase text-[10px]">IST</span>
              </div>

              {/* Alerts Quick Button */}
              <button
                type="button"
                onClick={() => onSelectView('notifications')}
                title={t.notifications || 'Alerts & Notifications'}
                className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 relative ${
                  activeView === 'notifications'
                    ? 'bg-[#0F172A] text-[#A3E635] border-slate-900'
                    : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200/80 text-slate-700'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </button>

              {/* Emergency Ambulance Showcase Simulator Button */}
              <button
                type="button"
                onClick={() => setShowAmbulanceModal(true)}
                className="px-2.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 text-xs font-bold"
                title="Project Showcase: Simulated 108 Ambulance & ICU Dispatch Demo"
              >
                <PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="hidden sm:inline">SOS Demo</span>
              </button>

              {/* User & Role Quick Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowCityDropdown(false);
                  }}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/90 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0F172A] text-[#A3E635] flex items-center justify-center font-bold text-xs uppercase">
                    {currentUser?.name ? currentUser.name.charAt(0) : currentRole.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline max-w-[90px] truncate capitalize">
                    {currentUser?.name || currentRole}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 glass-modal rounded-3xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                          {currentRole}
                        </span>
                        {currentUser?.id && (
                          <span className="text-[10px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {currentUser.id}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-slate-900 block truncate mt-0.5">
                        {currentUser?.name || currentRole}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono block truncate">
                        {currentUser?.email || `${currentRole}@citycare.org`}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          setIsDrawerOpen(true);
                        }}
                        className="w-full p-2.5 rounded-xl text-left hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-emerald-600" />
                        <span>Open Command & Settings</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenLogin();
                        }}
                        className="w-full p-2.5 rounded-xl text-left hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4 text-slate-600" />
                        <span>Sign In / Switch Account</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 block mb-1.5">
                        Quick Role View
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {roles.map((r) => (
                          <button
                            key={r.role}
                            type="button"
                            onClick={() => {
                              onSwitchRole(r.role);
                              setShowUserMenu(false);
                              if (r.role === 'doctor') onSelectView('doctor_portal');
                              else if (r.role === 'receptionist') onSelectView('receptionist_portal');
                              else if (r.role === 'admin') onSelectView('admin_portal');
                              else onSelectView('patient_portal');
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                              currentRole === r.role
                                ? 'bg-[#0F172A] text-[#A3E635]'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{r.title}</span>
                            {currentRole === r.role && <Check className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full p-2 rounded-xl text-left hover:bg-rose-50 text-xs font-semibold text-rose-600 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile & Tablet Secondary Bar */}
          <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-200/70 text-xs font-semibold no-scrollbar">
            {[...coreNavItems, rolePortalItem].map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectView(item.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#0F172A] text-[#A3E635] font-bold'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Left-Side Dark Glassmorphism Command & Settings Drawer (Triggered by CityCare Green + Logo) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Dark Blurred Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />

          {/* Dark Glassmorphism Sidebar Panel */}
          <aside className="relative z-10 w-full max-w-[390px] h-full bg-[#070D19]/88 backdrop-blur-2xl border-r border-white/12 text-slate-100 shadow-[0_25px_90px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-in slide-in-from-left duration-250">
            {/* Ambient Top Glow */}
            <div className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#A3E635]/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-12 -right-20 w-56 h-56 rounded-full bg-teal-500/10 blur-3xl" />

            {/* Drawer Header */}
            <div className="relative px-6 pt-5 pb-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#A3E635] flex items-center justify-center text-slate-950 shadow-[0_0_25px_rgba(163,230,53,0.35)]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg tracking-tight text-white">
                      {t.systemTitle || 'CityCare'}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
                      OS v2.4
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Clinical Command & Settings Hub</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/12 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close menu (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="relative flex-1 overflow-y-auto px-5 py-5 space-y-6">
              {/* 1. Live Internet Time (IST) Glass Card */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
                    Live Internet Time (IST)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {clock.isSyncedWithInternet ? 'Synced' : 'Local Fallback'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-0.5">
                  <span className="text-2xl font-mono font-extrabold text-[#A3E635] tracking-tight tabular-nums">
                    {clock.time12h}
                  </span>
                  <span className="text-xs font-medium text-slate-300">{clock.dateDisplay}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Past morning/afternoon OPD slots for today are automatically locked based on live Indian Standard Time.
                </p>
              </div>

              {/* 2. Active Profile & Role Switcher */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#A3E635]" />
                    Active Role & Workspace
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenLogin();
                    }}
                    className="text-[11px] font-semibold text-[#A3E635] hover:underline cursor-pointer"
                  >
                    Switch Account
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#A3E635]/20 border border-[#A3E635]/40 text-[#A3E635] flex items-center justify-center font-extrabold text-sm uppercase shrink-0">
                      {currentUser?.name ? currentUser.name.charAt(0) : currentRole.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate capitalize">
                        {currentUser?.name || currentRole}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {currentUser?.email || `${currentRole}@citycare.org`}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 text-[10px] font-bold uppercase tracking-wider text-[#A3E635] shrink-0">
                    {currentRole}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {roles.map((r) => {
                    const active = currentRole === r.role;
                    return (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => {
                          onSwitchRole(r.role);
                          if (r.role === 'doctor') onSelectView('doctor_portal');
                          else if (r.role === 'receptionist') onSelectView('receptionist_portal');
                          else if (r.role === 'admin') onSelectView('admin_portal');
                          else onSelectView('patient_portal');
                          setIsDrawerOpen(false);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-[#A3E635]/15 border-[#A3E635]/60 text-white shadow-[0_0_20px_rgba(163,230,53,0.12)]'
                            : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{r.title}</span>
                          {active && <Check className="w-3.5 h-3.5 text-[#A3E635]" />}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{r.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Full Navigation Directory */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#A3E635]" />
                  Clinical Modules
                </span>

                <div className="space-y-1.5">
                  {[
                    ...coreNavItems,
                    rolePortalItem,
                    {
                      id: 'notifications',
                      label: t.notifications || 'Notifications & Alerts',
                      icon: Bell,
                      desc: 'SMS, WhatsApp & OPD token call logs',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectView(item.id);
                          setIsDrawerOpen(false);
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isActive
                            ? 'bg-[#A3E635] text-slate-950 border-[#A3E635] font-bold shadow-[0_0_25px_rgba(163,230,53,0.25)]'
                            : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isActive ? 'bg-slate-950/15 text-slate-950' : 'bg-white/8 text-[#A3E635]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">{item.label}</span>
                            <span
                              className={`text-[10px] block truncate ${
                                isActive ? 'text-slate-800 font-medium' : 'text-slate-400'
                              }`}
                            >
                              {item.desc}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                      </button>
                    );
                  })}

                  {/* Emergency Ambulance Dispatch inside Drawer */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setShowAmbulanceModal(true);
                    }}
                    className="w-full p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-left transition-all flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-rose-300 block">24/7 Emergency Ambulance</span>
                        <span className="text-[10px] text-rose-400/80 block">Instant ALS/BLS dispatch & ICU bed radar</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>

              {/* 4. System Settings & Preferences */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-[#A3E635]" />
                  Settings & Preferences
                </span>

                {/* Language Selector inside Drawer */}
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-[#A3E635]" />
                      Interface Language
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-400">{currentLanguage}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'hi', label: 'हिंदी' },
                      { code: 'mr', label: 'मराठी' },
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => onSelectLanguage(lang.code as Language)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentLanguage === lang.code
                            ? 'bg-[#A3E635] text-slate-950 shadow-sm'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* City Selection inside Drawer */}
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#A3E635]" />
                      Active Hospital Network City
                    </span>
                    <span className="text-[11px] font-bold text-[#A3E635]">{selectedCity}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => onSelectCity(city)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          selectedCity.toLowerCase() === city.toLowerCase()
                            ? 'bg-[#A3E635] text-slate-950 font-bold'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Clinical Toggles */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={toggleAudioChime}
                    className="w-full p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      {audioChimeEnabled ? (
                        <Volume2 className="w-4 h-4 text-[#A3E635] shrink-0" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">Queue Audio Chime</span>
                        <span className="text-[10px] text-slate-400 block">Voice alert when token is called</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        audioChimeEnabled
                          ? 'bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/40'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {audioChimeEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleIstLock}
                    className="w-full p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <ShieldCheck className="w-4 h-4 text-[#A3E635] shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">Live IST Past-Slot Guard</span>
                        <span className="text-[10px] text-slate-400 block">Disable elapsed morning/afternoon slots</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        strictIstSlotLock
                          ? 'bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/40'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {strictIstSlotLock ? 'ACTIVE' : 'OFF'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleAutoSync}
                    className="w-full p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <Sparkles className="w-4 h-4 text-[#A3E635] shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">Real-Time Reception Sync</span>
                        <span className="text-[10px] text-slate-400 block">Auto-update Live Queue & My Visits</span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        liveQueueAutoSync
                          ? 'bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/40'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      {liveQueueAutoSync ? 'LIVE' : 'MANUAL'}
                    </span>
                  </button>

                  {/* System Architecture / Viva Guide */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenVivaGuide();
                    }}
                    className="w-full p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 text-left">
                      <GraduationCap className="w-4 h-4 text-[#A3E635] shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">System Architecture & Guide</span>
                        <span className="text-[10px] text-slate-400 block">Technical workflow & project documentation</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-5 py-3.5 border-t border-white/10 bg-slate-950/60 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenLogin();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-white/8 hover:bg-white/14 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#A3E635]" />
                <span>Switch Account</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onLogout();
                }}
                className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Emergency Ambulance & ICU Bed Command Modal */}
      {showAmbulanceModal && (
        <EmergencyCommandModal
          selectedCity={selectedCity}
          hospitals={[]}
          onClose={() => setShowAmbulanceModal(false)}
          onSelectHospitalDoctors={() => {
            setShowAmbulanceModal(false);
            onSelectView('doctors');
          }}
        />
      )}
    </>
  );
};

