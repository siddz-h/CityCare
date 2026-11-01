import React, { useState, useEffect } from 'react';
import { Hospital, Doctor, Appointment, AuditLog, User, UserRole, Language, NotificationAlert } from './types';
import { api } from './services/api';
import { translations } from './utils/translations';
import { Navbar } from './components/Navbar';
import { HospitalCard } from './components/HospitalCard';
import { HospitalMap } from './components/HospitalMap';
import { DoctorCard } from './components/DoctorCard';
import { SymptomChecker } from './components/SymptomChecker';
import { BookingModal } from './components/BookingModal';
import { AppointmentSlipModal } from './components/AppointmentSlipModal';
import { PatientPortal } from './components/PatientPortal';
import { DoctorPortal } from './components/DoctorPortal';
import { ReceptionistPortal } from './components/ReceptionistPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { AcademicVivaModal } from './components/AcademicVivaModal';
import { WaitingRoomQueueBoard } from './components/WaitingRoomQueueBoard';
import { MedicalHistoryVault } from './components/MedicalHistoryVault';
import { NotificationSimulator } from './components/NotificationSimulator';
import { LoginPage } from './components/LoginPage';
import {
  Building2,
  Stethoscope,
  Search,
  MapPin,
  RefreshCw,
  Globe,
  User as UserIcon,
  ClipboardList,
  Crown,
  KeyRound,
  LogOut,
} from 'lucide-react';

const CITIES = ['Amalner', 'Jalgaon', 'Nashik', 'Dhule', 'Pune', 'Mumbai', 'Delhi', 'Bengaluru', 'Ahmedabad', 'Chennai', 'All'];
const SPECIALITIES = [
  'All',
  'Cardiology',
  'Orthopedics',
  'Neurology',
  'General Medicine',
  'Pulmonology',
  'Dermatology',
  'Dental',
  'Pediatrics',
  'Gastroenterology',
];

export default function App() {
  const [selectedCity, setSelectedCity] = useState<string>('Amalner');
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      return (localStorage.getItem('citycare_current_role') as UserRole) || 'patient';
    } catch {
      return 'patient';
    }
  });
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('citycare_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Core Data
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);

  // Navigation & View state
  const [activeView, setActiveView] = useState<
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
    | 'admin_portal'
  >('symptoms');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [locationSearchInput, setLocationSearchInput] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('All');
  const [selectedHospitalForFilter, setSelectedHospitalForFilter] = useState<Hospital | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.0441, 75.0641]);

  // Modals
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [initialBookingSymptoms, setInitialBookingSymptoms] = useState('');
  const [initialBookingDate, setInitialBookingDate] = useState('');
  const [initialBookingSlot, setInitialBookingSlot] = useState('');
  const [confirmedAppointmentSlip, setConfirmedAppointmentSlip] = useState<Appointment | null>(null);
  const [showVivaModal, setShowVivaModal] = useState(false);

  // OSM Live Fetch status
  const [osmLoading, setOsmLoading] = useState(false);
  const [osmNotification, setOsmNotification] = useState<string | null>(null);
  const [, setLoadingInitial] = useState(true);

  const t = translations[currentLanguage] || translations.en;

  // Load Initial Data
  const refreshAllData = async () => {
    setOsmLoading(true);
    try {
      const [uList, hList, dList, aList, lList] = await Promise.all([
        api.getUsers(),
        api.getHospitals(selectedCity),
        api.getDoctors({ city: selectedCity }),
        api.getAppointments(),
        api.getAuditLogs(),
      ]);

      setUsers(uList);
      setHospitals(hList);
      setDoctors(dList);
      setAppointments(aList);
      setAuditLogs(lList);

      if (hList && hList.length > 0 && hList[0].lat && hList[0].lng) {
        setMapCenter([hList[0].lat, hList[0].lng]);
      }

      if (uList && uList.length > 0) {
        setCurrentUser((prev) => {
          const isExplicitlySignedOut = localStorage.getItem('citycare_signed_out') === 'true';
          if (isExplicitlySignedOut && !prev) return null;

          if (prev && prev.role === currentRole) {
            const matchedById = uList.find((u) => u.id === prev.id);
            return matchedById || prev;
          }
          if (currentRole === 'doctor') return uList.find((u) => u.role === 'doctor') || uList[0];
          if (currentRole === 'receptionist') return uList.find((u) => u.role === 'receptionist') || uList[1];
          if (currentRole === 'admin') return uList.find((u) => u.email?.toLowerCase() === 'bhavsarvaibhav001@gmail.com') || uList.find((u) => u.role === 'admin') || uList[0];
          return prev || uList.find((u) => u.role === 'patient') || uList[3];
        });
      }
    } catch (err) {
      console.error('Failed to load system data:', err);
    } finally {
      setLoadingInitial(false);
      setOsmLoading(false);
    }
  };

  const handleLoginSuccess = (user: User, role: UserRole, targetView?: any) => {
    setCurrentUser((prev) => {
      if (prev?.id !== user.id) {
        setNotifications([]);
      }
      return user;
    });
    setCurrentRole(role);
    setUsers((prev) => [user, ...prev.filter((u) => u.id !== user.id)]);
    try {
      localStorage.removeItem('citycare_signed_out');
      localStorage.setItem('citycare_current_user', JSON.stringify(user));
      localStorage.setItem('citycare_current_role', role);
    } catch (e) {
      console.warn('Could not persist session', e);
    }
    setOsmNotification(`Signed in as ${user.name} · ID: ${user.id}`);
    setTimeout(() => setOsmNotification(null), 4000);
    if (targetView) {
      setActiveView(targetView);
    } else {
      if (role === 'doctor') setActiveView('doctor_portal');
      else if (role === 'receptionist') setActiveView('receptionist_portal');
      else if (role === 'admin') setActiveView('admin_portal');
      else setActiveView('patient_portal');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.setItem('citycare_signed_out', 'true');
      localStorage.removeItem('citycare_current_user');
      localStorage.removeItem('citycare_current_role');
    } catch (e) {
      console.warn('Could not clear session', e);
    }
    setCurrentUser(null);
    setNotifications([]);
    setCurrentRole('patient');
    setActiveView('login');
    setOsmNotification('Signed out.');
    setTimeout(() => setOsmNotification(null), 3000);
  };

  useEffect(() => {
    refreshAllData();
  }, [selectedCity, currentRole]);

  // Silent background poll for real-time Queue, Receptionist, and My Visits synchronization
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const aList = await api.getAppointments();
        setAppointments(aList);
      } catch {
        // ignore background poll errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update map coordinates when city changes
  useEffect(() => {
    const cityCoords: Record<string, [number, number]> = {
      Amalner: [21.0441, 75.0641],
      Jalgaon: [21.0136, 75.5625],
      Nashik: [19.9735, 73.7914],
      Dhule: [20.9042, 74.7749],
      Mumbai: [19.076, 72.8777],
      Delhi: [28.6139, 77.209],
      Bengaluru: [12.9716, 77.5946],
      Pune: [18.5204, 73.8567],
      Ahmedabad: [23.0225, 72.5714],
      Chennai: [13.0827, 80.2707],
    };
    if (cityCoords[selectedCity]) {
      setMapCenter(cityCoords[selectedCity]);
    }
  }, [selectedCity]);

  // Handle live OSM Overpass lookup
  const handleFetchOsmHospitals = async () => {
    if (selectedCity === 'All') {
      setOsmNotification('Select a specific city to query live OpenStreetMap data.');
      return;
    }
    setOsmLoading(true);
    setOsmNotification(null);
    try {
      const res = await api.searchOsmHospitals(selectedCity);
      if (res.hospitals.length > 0) {
        const existingIds = new Set(hospitals.map((h) => h.id));
        const newOnes = res.hospitals.filter((h) => !existingIds.has(h.id));
        setHospitals((prev) => [...prev, ...newOnes]);
        setOsmNotification(`Synced ${res.hospitals.length} hospitals in ${selectedCity}`);
      } else {
        await refreshAllData();
        setOsmNotification(`Verified directory active for ${selectedCity}`);
      }
    } catch (e: any) {
      setOsmNotification('Displaying verified local records.');
    } finally {
      setOsmLoading(false);
      setTimeout(() => setOsmNotification(null), 5000);
    }
  };

  // Filtered hospitals
  const filteredHospitals = hospitals.filter((hosp) => {
    const matchesCity = selectedCity === 'All' || hosp.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesQuery =
      searchQuery === '' ||
      hosp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hosp.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hosp.departments.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSpec =
      selectedSpeciality === 'All' ||
      hosp.departments.some((d) => d.toLowerCase() === selectedSpeciality.toLowerCase());

    return matchesCity && matchesQuery && matchesSpec;
  });

  // Filtered doctors
  const filteredDoctors = doctors.filter((doc) => {
    const matchesCity = selectedCity === 'All' || doc.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesHospital =
      !selectedHospitalForFilter || doc.hospitalId === selectedHospitalForFilter.id;
    const matchesSpec =
      selectedSpeciality === 'All' ||
      doc.speciality.toLowerCase() === selectedSpeciality.toLowerCase() ||
      doc.department.toLowerCase() === selectedSpeciality.toLowerCase();
    const matchesQuery =
      searchQuery === '' ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.hospitalName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCity && matchesHospital && matchesSpec && matchesQuery;
  });

  // Automated Notification Simulator Trigger
  const handleTriggerTestNotification = (type: 'sms' | 'whatsapp') => {
    if (!currentUser) return;
    const activeName = currentUser.name || 'Patient';
    const activeRecipient = currentUser.phone || currentUser.email || '+91 98000 00000';
    const userApt = appointments.find((a) => a.patientId === currentUser.id);
    const token = userApt?.tokenNumber || `OPD-${selectedCity.substring(0, 3).toUpperCase()}-108`;
    const newAlert: NotificationAlert = {
      id: `alert-${Date.now()}`,
      patientId: currentUser.id,
      type,
      recipient: activeRecipient,
      patientName: activeName,
      title: type === 'whatsapp' ? `OPD Slip Dispatched (${token})` : `Live Room Call Alert (${token})`,
      message:
        type === 'whatsapp'
          ? `CityCare: Dear ${activeName}, your appointment ${token}${userApt ? ` with ${userApt.doctorName} at ${userApt.hospitalName}` : ''} is confirmed.`
          : `CityCare: Dear ${activeName}, Token ${token} is called to Consultation Room.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
      tokenNumber: token,
    };
    setNotifications((prev) => [newAlert, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-900">
      {/* Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        currentUser={currentUser}
        selectedCity={selectedCity}
        onSelectCity={(city) => {
          setSelectedCity(city);
          setSelectedHospitalForFilter(null);
        }}
        onSwitchRole={(role) => {
          setCurrentRole(role);
          const match = users.find((u) => u.role === role);
          if (match) setCurrentUser(match);
        }}
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
        onOpenVivaGuide={() => setShowVivaModal(true)}
        onOpenLogin={() => setActiveView('login')}
        onLogout={handleLogout}
        cities={CITIES}
        currentLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
      />

      {/* Main Spacious Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 space-y-10">

        {osmNotification && (
          <div className="px-5 py-3.5 glass-card rounded-2xl text-xs font-semibold flex items-center justify-between text-blue-700 border-blue-200">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>{osmNotification}</span>
            </div>
            <button
              onClick={() => setOsmNotification(null)}
              className="text-slate-400 hover:text-slate-800 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* VIEW 0: LOGIN & SWITCH ACCOUNT HUB */}
        {activeView === 'login' && (
          <LoginPage
            currentLanguage={currentLanguage}
            currentUser={currentUser}
            currentRole={currentRole}
            users={users}
            doctors={doctors}
            hospitals={hospitals}
            onLoginSuccess={handleLoginSuccess}
            onContinueAsGuest={() => setActiveView('symptoms')}
          />
        )}

        <div className="lg:col-span-7">
          {/* VIEW 1: SEARCH HOSPITALS & MAP */}
          {activeView === 'search' && (
            <div className="space-y-8">
              {/* Modern Dark Hero with Right-Side Visual Showcase */}
              <div className="relative rounded-3xl glass-wood-panel text-white p-8 sm:p-10 overflow-hidden shadow-xl">
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Side: Heading, Search & City Pills */}
                  <div className="lg:col-span-7 space-y-5">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#A3E635]">
                      {t.heroTitle}
                    </p>

                    <h1
                      className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight"
                      style={{ textWrap: 'balance' }}
                    >
                      {t.heroHeading}{' '}
                      <span className="text-[#A3E635]">
                        {selectedCity === 'All' ? 'Your City' : selectedCity}
                      </span>
                    </h1>

                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
                      {t.heroDesc}
                    </p>

                    {/* Search Bar */}
                    <div className="pt-2 space-y-4 max-w-xl">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15">
                        <div className="relative flex-1">
                          <MapPin className="w-4 h-4 text-[#A3E635] absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            value={locationSearchInput}
                            onChange={(e) => setLocationSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && locationSearchInput.trim()) {
                                setSelectedCity(locationSearchInput.trim());
                                setLocationSearchInput('');
                              }
                            }}
                            placeholder={t.searchPlaceholder}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-white placeholder:text-slate-400 text-sm focus:outline-none font-medium"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (locationSearchInput.trim()) {
                              setSelectedCity(locationSearchInput.trim());
                              setLocationSearchInput('');
                            } else {
                              handleFetchOsmHospitals();
                            }
                          }}
                          disabled={osmLoading}
                          className="px-6 py-3 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
                        >
                          {osmLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Searching</span>
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4" />
                              <span>{t.locateBtn}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Clean City Selector Pills */}
                      <div className="flex flex-wrap items-center gap-2">
                        {['Amalner', 'Jalgaon', 'Nashik', 'Dhule', 'Pune', 'Mumbai'].map((loc) => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => {
                              setSelectedCity(loc);
                              setSelectedHospitalForFilter(null);
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                              selectedCity.toLowerCase() === loc.toLowerCase()
                                ? 'bg-[#A3E635] text-slate-950 font-extrabold shadow-xs'
                                : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15'
                            }`}
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Visual Healthcare Showcase & Live Network Card */}
                  <div className="lg:col-span-5">
                    <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-slate-900/90 shadow-2xl group">
                      {/* Hospital / Care Visual Image */}
                      <div className="relative h-56 sm:h-64 overflow-hidden">
                        <img
                          src={
                            filteredHospitals[0]?.image ||
                            'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=80'
                          }
                          alt={`${selectedCity} Healthcare Network`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

                        {/* Top Live Status Pill */}
                        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[11px] font-bold text-[#A3E635]">
                            <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
                            <span>Live Care Network · {selectedCity}</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-blue-600/90 text-white text-[11px] font-extrabold">
                            24/7 Emergency
                          </span>
                        </div>

                        {/* Overlay Caption & Quick Stats */}
                        <div className="absolute bottom-3.5 left-4 right-4 space-y-2.5">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3E635]">
                              Verified Medical Hub
                            </p>
                            <h3 className="text-base sm:text-lg font-extrabold text-white truncate">
                              {filteredHospitals[0]?.name || `${selectedCity} Multi-Speciality Care`}
                            </h3>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                              <span className="text-sm font-extrabold text-[#A3E635] tabular-nums block">
                                {filteredHospitals.length}
                              </span>
                              <span className="text-[10px] text-slate-300 font-medium">Hospitals</span>
                            </div>
                            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                              <span className="text-sm font-extrabold text-white tabular-nums block">
                                {filteredDoctors.length}
                              </span>
                              <span className="text-[10px] text-slate-300 font-medium">Specialists</span>
                            </div>
                            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                              <span className="text-sm font-extrabold text-emerald-400 tabular-nums block">
                                108
                              </span>
                              <span className="text-[10px] text-slate-300 font-medium">Trauma Line</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Bar inside Showcase Card */}
                      <div className="p-3.5 bg-zinc-950 border-t border-white/10 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Stethoscope className="w-4 h-4 text-[#A3E635] shrink-0" />
                          <span className="text-xs font-semibold text-slate-300 truncate">
                            Not sure which specialist to visit?
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveView('symptoms')}
                          className="px-3.5 py-1.5 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 text-xs font-extrabold transition-all cursor-pointer shrink-0"
                        >
                          Smart Triage →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter & Speciality Strip */}
              <div className="glass-card rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  {SPECIALITIES.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => setSelectedSpeciality(spec)}
                      className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        selectedSpeciality === spec
                          ? 'bg-[#0F172A] text-[#A3E635] font-bold shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>

                <div className="relative w-full lg:w-64 shrink-0">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by name..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Spacious Split Layout: Hospitals + Map */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {/* Left Column: Hospital Cards */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <span>
                        {selectedCity} Facilities ({filteredHospitals.length})
                      </span>
                    </h2>

                    {selectedHospitalForFilter && (
                      <button
                        onClick={() => setSelectedHospitalForFilter(null)}
                        className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>

                  {osmLoading ? (
                    <div className="glass-card rounded-3xl p-14 text-center space-y-4">
                      <RefreshCw className="w-9 h-9 text-blue-600 mx-auto animate-spin" />
                      <h3 className="text-base font-bold text-slate-900">
                        Loading Facilities in {selectedCity}
                      </h3>
                    </div>
                  ) : filteredHospitals.length === 0 ? (
                    <div className="glass-card rounded-3xl p-14 text-center space-y-5">
                      <Building2 className="w-12 h-12 text-slate-400 mx-auto" />
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900">
                          No facilities listed for {selectedCity}
                        </h3>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                          Sync live hospital nodes from OpenStreetMap for {selectedCity}.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFetchOsmHospitals()}
                        className="px-5 py-2.5 rounded-xl hospital-btn-primary text-xs font-semibold cursor-pointer inline-flex items-center gap-2"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Sync {selectedCity} Hospitals</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {filteredHospitals.map((hosp) => (
                        <HospitalCard
                          key={hosp.id}
                          hospital={hosp}
                          isSelected={selectedHospitalForFilter?.id === hosp.id}
                          onSelect={(h) => {
                            setSelectedHospitalForFilter(h);
                            if (h.lat && h.lng) setMapCenter([h.lat, h.lng]);
                          }}
                          onViewDoctors={(h) => {
                            setSelectedHospitalForFilter(h);
                            setActiveView('doctors');
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Live Map */}
                <div className="sticky top-24 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      <span>Clinical Map</span>
                    </h3>
                    <span className="text-xs text-slate-500">
                      OpenStreetMap
                    </span>
                  </div>

                  <div className="h-[480px] rounded-3xl overflow-hidden glass-card p-2">
                    <HospitalMap
                      hospitals={filteredHospitals}
                      selectedHospital={selectedHospitalForFilter}
                      onSelectHospital={(h) => setSelectedHospitalForFilter(h)}
                      center={mapCenter}
                      zoom={12}
                    />
                  </div>

                  {selectedHospitalForFilter && (
                    <div className="p-5 glass-card rounded-2xl flex items-center justify-between gap-4 text-xs">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-sm block truncate">
                          {selectedHospitalForFilter.name}
                        </span>
                        <span className="text-slate-500 block truncate mt-0.5">
                          {selectedHospitalForFilter.city}
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveView('doctors')}
                        className="px-4 py-2.5 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 font-extrabold cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        View Doctors →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: FIND DOCTORS */}
          {activeView === 'doctors' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Medical Specialists
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedCity} {selectedHospitalForFilter && `· ${selectedHospitalForFilter.name}`}
                  </p>
                </div>

                {selectedHospitalForFilter && (
                  <button
                    onClick={() => setSelectedHospitalForFilter(null)}
                    className="px-4 py-2 rounded-xl glass-pill text-xs text-rose-600 font-bold hover:bg-rose-50 cursor-pointer self-start sm:self-auto"
                  >
                    Clear Hospital Filter
                  </button>
                )}
              </div>

              {/* Speciality Filter Buttons */}
              <div className="glass-card rounded-3xl p-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
                {SPECIALITIES.map((spec) => (
                  <button
                    key={spec}
                    onClick={() => setSelectedSpeciality(spec)}
                    className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      selectedSpeciality === spec
                        ? 'bg-[#0F172A] text-[#A3E635] font-bold shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>

              {filteredDoctors.length === 0 ? (
                <div className="glass-card rounded-3xl p-14 text-center space-y-3">
                  <Stethoscope className="w-12 h-12 text-slate-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900">No Specialists Found</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Switch department filter or select another city.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDoctors.map((doc) => (
                    <DoctorCard
                      key={doc.id}
                      doctor={doc}
                      onBook={(d) => {
                        setBookingDoctor(d);
                        setInitialBookingSymptoms('');
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* VIEW 3: SYMPTOM CHECKER / CLINICAL TRIAGE */}
        {activeView === 'symptoms' && (
          <SymptomChecker
            selectedCity={selectedCity}
            currentUser={currentUser}
            hospitals={filteredHospitals}
            onViewMap={() => setActiveView('search')}
            onSelectSpeciality={(spec) => {
              setSelectedSpeciality(spec);
              setActiveView('doctors');
            }}
            onBookDoctor={(doc, details) => {
              setBookingDoctor(doc);
              setInitialBookingSymptoms(details?.initialSymptoms || '');
              setInitialBookingDate(details?.initialDate || '');
              setInitialBookingSlot(details?.initialSlot || '');
            }}
          />
        )}

        {/* VIEW 4: WAITING ROOM QUEUE BOARD */}
        {activeView === 'queue_board' && (
          <WaitingRoomQueueBoard
            appointments={appointments}
            selectedCity={selectedCity}
            currentUser={currentUser}
            onRefresh={refreshAllData}
            onCallToken={(tok) => {
              setOsmNotification(`Token ${tok} announced`);
              setTimeout(() => setOsmNotification(null), 4000);
            }}
          />
        )}

        {/* VIEW 5: EHR VAULT */}
        {activeView === 'ehr_vault' && (
          <MedicalHistoryVault
            currentUser={currentUser}
            appointments={appointments}
          />
        )}

        {/* VIEW 6: NOTIFICATIONS */}
        {activeView === 'notifications' && (
          <NotificationSimulator
            notifications={notifications}
            appointments={appointments}
            currentUser={currentUser}
            onTriggerTestNotification={handleTriggerTestNotification}
          />
        )}

        {/* UNIFIED ROLE & ACCOUNT SWITCHER COMMAND BAR FOR PATIENT, DOCTOR, RECEPTION & OWNER/ADMIN PAGES */}
        {(activeView === 'patient_portal' ||
          activeView === 'doctor_portal' ||
          activeView === 'receptionist_portal' ||
          activeView === 'admin_portal') && (
          <div className="rounded-2xl bg-[#070D19]/95 backdrop-blur-2xl border border-white/15 px-4 py-3 text-slate-100 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Active Identity Summary */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#A3E635] text-slate-950 font-black text-sm flex items-center justify-center uppercase shrink-0 shadow-sm">
                {currentUser?.name ? currentUser.name.charAt(0) : currentRole.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-white truncate">
                    {currentUser?.name || 'Guest Session'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#A3E635]/15 border border-[#A3E635]/40 text-[#A3E635] text-[10px] font-black uppercase tracking-wider">
                    {currentRole === 'admin' ? 'Owner / Admin' : currentRole}
                  </span>
                  {currentUser?.id && (
                    <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      ID: {currentUser.id}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  {currentUser?.email || `${currentRole}@citycare.org`}
                </p>
              </div>
            </div>

            {/* 1-Click Switch Account Pills: Patient, Doctor, Reception, Owner/Admin + Full Sign In Hub */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
                Switch Workspace:
              </span>
              {(
                [
                  {
                    role: 'patient' as UserRole,
                    label: 'Patient',
                    view: 'patient_portal',
                    icon: UserIcon,
                  },
                  {
                    role: 'doctor' as UserRole,
                    label: 'Doctor',
                    view: 'doctor_portal',
                    icon: Stethoscope,
                  },
                  {
                    role: 'receptionist' as UserRole,
                    label: 'Reception',
                    view: 'receptionist_portal',
                    icon: ClipboardList,
                  },
                  {
                    role: 'admin' as UserRole,
                    label: 'Owner / Admin',
                    view: 'admin_portal',
                    icon: Crown,
                  },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.view;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => {
                      setCurrentRole(item.role);
                      const match =
                        item.role === 'admin'
                          ? users.find(
                              (u) => u.email?.toLowerCase() === 'bhavsarvaibhav001@gmail.com'
                            ) || users.find((u) => u.role === 'admin')
                          : users.find((u) => u.role === item.role);
                      if (match) {
                        setCurrentUser(match);
                        try {
                          localStorage.setItem('citycare_current_user', JSON.stringify(match));
                          localStorage.setItem('citycare_current_role', item.role);
                        } catch {
                          // ignore
                        }
                      }
                      setActiveView(item.view);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#A3E635] text-slate-950 font-extrabold shadow-sm'
                        : 'bg-white/[0.05] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="h-4 w-px bg-white/15 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={() => setActiveView('login')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#A3E635] text-white hover:text-slate-950 border border-white/15 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#A3E635] group-hover:text-slate-950" />
                <span>Sign In / Switch Account</span>
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* VIEW 7: PATIENT PORTAL */}
        {activeView === 'patient_portal' && (
          <PatientPortal
            appointments={appointments}
            doctors={doctors}
            currentUser={currentUser}
            onRefresh={refreshAllData}
            onOpenQueueBoard={() => setActiveView('queue_board')}
          />
        )}

        {/* VIEW 8: DOCTOR PORTAL */}
        {activeView === 'doctor_portal' && (
          <DoctorPortal
            appointments={appointments}
            doctors={doctors}
            currentUser={currentUser}
            onRefresh={refreshAllData}
          />
        )}

        {/* VIEW 9: RECEPTIONIST PORTAL */}
        {activeView === 'receptionist_portal' && (
          <ReceptionistPortal
            appointments={appointments}
            hospitals={hospitals}
            doctors={doctors}
            currentUser={currentUser}
            onRefresh={refreshAllData}
            onOpenQueueBoard={() => setActiveView('queue_board')}
          />
        )}

        {/* VIEW 10: ADMIN DASHBOARD */}
        {activeView === 'admin_portal' && (
          <AdminDashboard
            hospitals={hospitals}
            doctors={doctors}
            appointments={appointments}
            auditLogs={auditLogs}
            currentUser={currentUser}
            onRefresh={refreshAllData}
          />
        )}
      </main>

      {/* MODALS */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          initialSymptoms={initialBookingSymptoms}
          initialDate={initialBookingDate}
          initialSlot={initialBookingSlot}
          currentUser={currentUser}
          onSuccess={(newApt) => {
            setBookingDoctor(null);
            setInitialBookingDate('');
            setInitialBookingSlot('');
            setConfirmedAppointmentSlip(newApt);
            const autoAlert: NotificationAlert = {
              id: `alert-${Date.now()}`,
              patientId: newApt.patientId || currentUser?.id,
              type: 'whatsapp',
              recipient: newApt.patientPhone,
              patientName: newApt.patientName,
              title: `Confirmed: ${newApt.tokenNumber}`,
              message: `CityCare: Hello ${newApt.patientName}, your visit with ${newApt.doctorName} at ${newApt.hospitalName} is confirmed for ${newApt.appointmentDate} at ${newApt.appointmentTime}. Token: ${newApt.tokenNumber}.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'delivered',
              tokenNumber: newApt.tokenNumber,
            };
            setNotifications((prev) => [autoAlert, ...prev]);
            refreshAllData();
          }}
          onClose={() => {
            setBookingDoctor(null);
            setInitialBookingDate('');
            setInitialBookingSlot('');
          }}
        />
      )}

      {confirmedAppointmentSlip && (
        <AppointmentSlipModal
          appointment={confirmedAppointmentSlip}
          onClose={() => setConfirmedAppointmentSlip(null)}
        />
      )}

      {showVivaModal && (
        <AcademicVivaModal onClose={() => setShowVivaModal(false)} />
      )}

      {/* Clean Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200/80 glass-header py-6 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">CityCare</span>
            <span aria-hidden="true">·</span>
            <span>Hospital Appointment & Care Network</span>
          </div>

          <button
            onClick={() => setShowVivaModal(true)}
            className="text-blue-600 font-semibold hover:underline cursor-pointer"
          >
            System Architecture & Documentation
          </button>
        </div>
      </footer>
    </div>
  );
}
