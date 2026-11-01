import React, { useState } from 'react';
import { UserRole, User, Language, Doctor, Hospital } from '../types';
import { useInternetTime } from '../utils/internetTime';
import {
  User as UserIcon,
  Stethoscope,
  ClipboardList,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  UserPlus,
  Sparkles,
  KeyRound,
  Building2,
  Clock,
  RefreshCw,
  Crown,
  Zap,
  Check,
  Users,
} from 'lucide-react';

interface LoginPageProps {
  currentLanguage: Language;
  currentUser?: User | null;
  currentRole?: UserRole;
  users?: User[];
  onLoginSuccess: (user: User, role: UserRole, targetView?: any) => void;
  onContinueAsGuest: () => void;
  doctors: Doctor[];
  hospitals: Hospital[];
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  currentRole = 'patient',
  users = [],
  onLoginSuccess,
  onContinueAsGuest,
  doctors,
  hospitals,
}) => {
  const [activeTab, setActiveTab] = useState<UserRole>(currentRole || 'patient');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [customName, setCustomName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || '');
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitals[0]?.id || '');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAge, setRegAge] = useState('28');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regCity, setRegCity] = useState('Amalner');

  const clock = useInternetTime(1000);

  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 450, y: 260 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const roleCards: Record<
    UserRole,
    {
      title: string;
      shortTitle: string;
      roleBadge: string;
      tagline: string;
      accentText: string;
      accentBg: string;
      accentBorder: string;
      icon: React.ReactNode;
      capabilities: string[];
      defaultEmail: string;
      defaultPassword: string;
      defaultName: string;
      defaultPhone: string;
      targetView: string;
    }
  > = {
    patient: {
      title: 'Patient Portal',
      shortTitle: 'Patient',
      roleBadge: 'Citizen Health ID',
      tagline: 'Book live IST slots, track queue & digital prescriptions',
      accentText: 'text-[#A3E635]',
      accentBg: 'bg-white/10',
      accentBorder: 'border-white/25',
      icon: <UserIcon className="w-4 h-4" />,
      capabilities: [
        'Live IST slot booking with automatic past-slot protection',
        'Real-time OPD token status & My Visits completion sync',
        'Personal EHR vault with downloadable Rx & QR token slips',
      ],
      defaultEmail: 'rahul.patient@gmail.com',
      defaultPassword: 'patient123',
      defaultName: 'Rahul Verma',
      defaultPhone: '+91 98230 11223',
      targetView: 'patient_portal',
    },
    doctor: {
      title: 'Doctor Console',
      shortTitle: 'Doctor',
      roleBadge: 'Consulting Specialist',
      tagline: 'Call OPD tokens, write digital Rx & manage availability',
      accentText: 'text-[#A3E635]',
      accentBg: 'bg-white/10',
      accentBorder: 'border-white/25',
      icon: <Stethoscope className="w-4 h-4" />,
      capabilities: [
        'One-click voice chime to summon next checked-in patient',
        'Clinical diagnosis, medicines & follow-up Rx generator',
        'Switch between any specialist profile across city hospitals',
      ],
      defaultEmail: 'doctor@citycare.org',
      defaultPassword: 'doctor123',
      defaultName: 'Dr. Sameer Joshi',
      defaultPhone: '+91 98230 44556',
      targetView: 'doctor_portal',
    },
    receptionist: {
      title: 'Reception Desk',
      shortTitle: 'Reception',
      roleBadge: 'Front Desk Officer',
      tagline: 'Verify arrivals, collect fees & push to Live Queue',
      accentText: 'text-[#A3E635]',
      accentBg: 'bg-white/10',
      accentBorder: 'border-white/25',
      icon: <ClipboardList className="w-4 h-4" />,
      capabilities: [
        'Mark patients Checked-In → instantly updates Live Queue',
        'Complete consultations → syncs Patient My Visits status',
        'Verify Cash at Counter or Online UPI token receipts',
      ],
      defaultEmail: 'reception@citycare.org',
      defaultPassword: 'reception123',
      defaultName: 'Priya Sharma',
      defaultPhone: '+91 98230 77889',
      targetView: 'receptionist_portal',
    },
    admin: {
      title: 'Owner & Admin Hub',
      shortTitle: 'Owner / Admin',
      roleBadge: 'Hospital Owner & Root',
      tagline: 'Full hospital network oversight, staff & audit logs',
      accentText: 'text-[#A3E635]',
      accentBg: 'bg-white/15',
      accentBorder: 'border-white/30',
      icon: <Crown className="w-4 h-4" />,
      capabilities: [
        'Root Owner Authority: bhavsarvaibhav001@gmail.com',
        'Onboard new hospitals, specialists & emergency ICU capacity',
        'Real-time revenue telemetry, security logs & role delegation',
      ],
      defaultEmail: 'bhavsarvaibhav001@gmail.com',
      defaultPassword: 'admin123',
      defaultName: 'Vaibhav Bhavsar',
      defaultPhone: '+91 98230 99000',
      targetView: 'admin_portal',
    },
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (isRegistering && activeTab === 'patient') {
        if (!regName.trim() || !regPhone.trim()) {
          throw new Error('Please enter patient name and phone number');
        }
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: regName.trim(),
            email: regEmail.trim() || `${regPhone.trim().replace(/[^0-9]/g, '')}@patient.citycare.org`,
            phone: regPhone.trim(),
            role: 'patient',
            age: parseInt(regAge) || 28,
            gender: regGender,
            bloodGroup: regBloodGroup,
            city: regCity,
          }),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Registration failed');
        onLoginSuccess(data.user, 'patient', 'patient_portal');
        return;
      }

      const rawInput = emailOrPhone.trim();
      const isEmail = rawInput.includes('@');

      const credentials = {
        role: activeTab,
        name: customName.trim() || undefined,
        email: isEmail ? rawInput : !rawInput ? roleCards[activeTab].defaultEmail : undefined,
        phone: !isEmail && rawInput ? rawInput : undefined,
        password: password || roleCards[activeTab].defaultPassword,
      };

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Sign in failed.');
      }

      onLoginSuccess(data.user, activeTab, roleCards[activeTab].targetView);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAccountSwitch = async (
    role: UserRole,
    overrideEmail?: string,
    overrideName?: string
  ) => {
    const key = overrideEmail || role;
    setSwitchingRole(key);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          email: overrideEmail || roleCards[role].defaultEmail,
          name: overrideName || roleCards[role].defaultName,
        }),
      });

      const data = await response.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user, role, roleCards[role].targetView);
      } else {
        setErrorMessage(data.message || 'Switch account failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error.');
    } finally {
      setSwitchingRole(null);
    }
  };

  const autofillRoleCredentials = (role: UserRole) => {
    setActiveTab(role);
    setIsRegistering(false);
    setEmailOrPhone(roleCards[role].defaultEmail);
    setPassword(roleCards[role].defaultPassword);
    setCustomName(roleCards[role].defaultName);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-4">
      {/* Main Monochrome Black & White Glassmorphism Container with Cursor-Follow Spotlight */}
      <div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHoveringCard(true)}
        onMouseLeave={() => setIsHoveringCard(false)}
        className="relative rounded-[2rem] bg-[#050505]/95 backdrop-blur-3xl border border-white/20 text-zinc-100 shadow-[0_30px_90px_rgba(0,0,0,0.92)] overflow-hidden p-6 sm:p-10 lg:p-12 space-y-10 transition-colors"
      >
        {/* Interactive Cursor-Follow Glass Spotlight */}
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            opacity: isHoveringCard ? 1 : 0.45,
            background: `radial-gradient(520px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.11), rgba(255, 255, 255, 0.03) 40%, transparent 75%)`,
          }}
        />

        {/* Subtle Ambient Monochrome Corner Glows */}
        <div className="pointer-events-none absolute -top-28 -left-24 w-80 h-80 rounded-full bg-white/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-24 w-80 h-80 rounded-full bg-zinc-400/[0.05] blur-3xl" />

        {/* Header Bar: Friendly Welcome + Active Session Status */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/15">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/25 text-[#A3E635] text-xs font-extrabold uppercase tracking-wider backdrop-blur-md">
                <KeyRound className="w-3.5 h-3.5" />
                Easy Sign In & Account Switcher
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/15 text-zinc-300 text-xs font-mono backdrop-blur-md">
                <Clock className="w-3.5 h-3.5 text-[#A3E635]" />
                {clock.time12h} IST • {clock.dateDisplay}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome to <span className="text-[#A3E635]">CityCare</span> Portal
            </h1>
            <p className="text-sm text-zinc-400">
              Sign in with your account details below, or scroll down to switch accounts in 1 click.
            </p>
          </div>

          {/* Active Signed-In Session Pill */}
          {currentUser ? (
            <div className="flex items-center gap-3.5 p-3.5 pr-4 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/20 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white text-black font-black text-base flex items-center justify-center uppercase shadow-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#A3E635]">
                    Signed In: {currentRole === 'admin' ? 'Owner / Admin' : currentRole}
                  </span>
                </div>
                <p className="text-sm font-bold text-white truncate max-w-[180px]">
                  {currentUser.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onLoginSuccess(currentUser, currentRole, roleCards[currentRole].targetView)
                }
                className="ml-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/20 text-xs sm:text-sm font-bold text-[#A3E635] hover:text-white flex items-center gap-2 cursor-pointer transition-all backdrop-blur-md"
            >
              <span>Continue as Guest</span>
              <ArrowRight className="w-4 h-4 text-[#A3E635]" />
            </button>
          )}
        </div>

        {/* SECTION 1 (ON TOP): Main Sign-In / Registration Card */}
        <div className="relative z-10 rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/15 p-6 sm:p-8 lg:p-10 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          {/* Step 1: Beginner-Friendly Role Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#A3E635]">
                Step 1 — Choose Who You Are
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                Select a role to load its sign-in form
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {(['patient', 'doctor', 'receptionist', 'admin'] as UserRole[]).map((r) => {
                const card = roleCards[r];
                const isSelected = activeTab === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setActiveTab(r);
                      setIsRegistering(false);
                      setErrorMessage(null);
                      setEmailOrPhone(card.defaultEmail);
                      setPassword(card.defaultPassword);
                      setCustomName(card.defaultName);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 backdrop-blur-md ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.22)]'
                        : 'bg-white/[0.04] hover:bg-white/[0.09] text-white border-white/15'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-black/10 text-black'
                          : `${card.accentBg} ${card.accentText} border ${card.accentBorder}`
                      }`}
                    >
                      {card.icon}
                    </div>
                    <div className="min-w-0">
                      <span
                        className={`block font-black text-sm truncate ${
                          isSelected ? 'text-black' : 'text-white'
                        }`}
                      >
                        {card.shortTitle}
                      </span>
                      <span
                        className={`block text-[11px] truncate ${
                          isSelected ? 'text-zinc-700 font-semibold' : 'text-zinc-400'
                        }`}
                      >
                        {card.roleBadge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Sign-In or Registration Form */}
          <div className="space-y-6 pt-6 border-t border-white/15">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/25 text-[#A3E635] flex items-center justify-center">
                  {roleCards[activeTab].icon}
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#A3E635] block">
                    Step 2 — {isRegistering ? 'Create New Account' : 'Sign In Details'}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black leading-tight text-white">
                    {isRegistering ? 'New Patient Registration' : roleCards[activeTab].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                    {isRegistering
                      ? 'Fill in basic patient details below to create your health ID'
                      : roleCards[activeTab].tagline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={() => autofillRoleCredentials(activeTab)}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/20 text-xs font-bold text-[#A3E635] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Fill Demo {roleCards[activeTab].shortTitle} Details</span>
                  </button>
                )}

                {activeTab === 'patient' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setErrorMessage(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#A3E635]" />
                    <span>{isRegistering ? 'Back to Sign In' : 'New Patient? Register Here'}</span>
                  </button>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-white/10 border border-white/30 text-white text-sm font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {isRegistering ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">
                        Full Patient Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Aarav Patil"
                        className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/[0.05] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">
                        Mobile Number (WhatsApp / SMS) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+91 98230 12345"
                        className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/[0.05] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="patient@citycare.org"
                        className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/[0.05] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">
                        Home City
                      </label>
                      <input
                        type="text"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/[0.05] text-sm text-white focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        value={regAge}
                        onChange={(e) => setRegAge(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/[0.05] text-sm text-white focus:outline-none focus:border-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">
                        Gender
                      </label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl border border-white/20 bg-[#0d0d0d] text-sm text-white focus:outline-none focus:border-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">
                        Blood Group
                      </label>
                      <select
                        value={regBloodGroup}
                        onChange={(e) => setRegBloodGroup(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-white/20 bg-[#0d0d0d] text-sm text-white focus:outline-none focus:border-white"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Role-Specific Context Selector for Doctor or Receptionist */}
                  {activeTab === 'doctor' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">
                        Choose Doctor Profile
                      </label>
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => {
                          setSelectedDoctorId(e.target.value);
                          const doc = doctors.find((d) => d.id === e.target.value);
                          if (doc) {
                            setCustomName(doc.name);
                            setEmailOrPhone(
                              `${doc.name.toLowerCase().replace(/[^a-z]/g, '')}@citycare.org`
                            );
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-white/20 bg-[#0d0d0d] text-sm text-white focus:outline-none focus:border-white"
                      >
                        {doctors.slice(0, 12).map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} • {doc.speciality} ({doc.hospitalName})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {activeTab === 'receptionist' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">
                        Choose Hospital Reception Desk
                      </label>
                      <select
                        value={selectedHospitalId}
                        onChange={(e) => setSelectedHospitalId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-white/20 bg-[#0d0d0d] text-sm text-white focus:outline-none focus:border-white"
                      >
                        {hospitals.slice(0, 8).map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.city})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">
                        Email or Mobile Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                          {activeTab === 'patient' &&
                          !emailOrPhone.includes('@') &&
                          emailOrPhone.length > 0 ? (
                            <Phone className="w-4 h-4 text-[#A3E635]" />
                          ) : (
                            <Mail className="w-4 h-4 text-[#A3E635]" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={emailOrPhone}
                          onChange={(e) => setEmailOrPhone(e.target.value)}
                          placeholder={roleCards[activeTab].defaultEmail}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/20 bg-white/[0.05] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-2">
                        Your Name (Optional)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                          <UserIcon className="w-4 h-4 text-[#A3E635]" />
                        </div>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder={roleCards[activeTab].defaultName}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/20 bg-white/[0.05] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-zinc-300">
                        Password (Optional for Demo)
                      </label>
                      <span className="text-xs font-mono text-zinc-400">
                        Demo Password:{' '}
                        <span className="text-[#A3E635] font-bold">
                          {roleCards[activeTab].defaultPassword}
                        </span>
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <Lock className="w-4 h-4 text-[#A3E635]" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={`Leave blank to sign in automatically (${roleCards[activeTab].defaultPassword})`}
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-white/20 bg-white/[0.05] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-sm sm:text-base shadow-[0_10px_30px_rgba(255,255,255,0.18)] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <span>
                    {isLoading
                      ? 'Signing In...'
                      : isRegistering
                      ? 'Create Patient Account & Open Portal'
                      : `Sign In as ${roleCards[activeTab].shortTitle}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Clear Capabilities Summary Strip */}
            <div className="pt-5 border-t border-white/15">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-3">
                What you can do in {roleCards[activeTab].title}:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {roleCards[activeTab].capabilities.map((cap, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/15 flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#A3E635] shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 (AFTER THE SIGN-IN DIV): 1-Click Quick Account Switcher */}
        <div className="relative z-10 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/15 p-6 sm:p-8 lg:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/15">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#A3E635]" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#A3E635]">
                  Fast Demo Access
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Instant 1-Click Switch Account
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                Skip typing — click any role card below to jump straight into that dashboard.
              </p>
            </div>
            <span className="self-start sm:self-auto text-xs font-mono text-[#A3E635] bg-white/10 px-3 py-1.5 rounded-xl border border-white/25">
              No Password Needed
            </span>
          </div>

          {/* 4 Spacious Role Switch Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {(['patient', 'doctor', 'receptionist', 'admin'] as UserRole[]).map((r) => {
              const card = roleCards[r];
              const isCurrent = currentUser && currentRole === r;
              return (
                <div
                  key={r}
                  onClick={() => handleQuickAccountSwitch(r)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 backdrop-blur-md ${
                    isCurrent
                      ? 'bg-white/15 border-white/60 shadow-[0_0_28px_rgba(255,255,255,0.14)]'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                          isCurrent
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-[#A3E635] border border-white/20'
                        }`}
                      >
                        {card.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-extrabold truncate text-white">
                            {card.title}
                          </h4>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/10 text-[#A3E635] border border-white/15">
                            {card.shortTitle}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5 truncate">
                          {card.defaultName} •{' '}
                          <span className="font-mono text-zinc-400">{card.defaultEmail}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {card.tagline}
                  </p>

                  <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-zinc-400">
                      Role: <span className="text-[#A3E635]">{card.roleBadge}</span>
                    </span>
                    <button
                      type="button"
                      disabled={switchingRole !== null}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-white text-black'
                          : 'bg-white/10 hover:bg-white hover:text-black text-[#A3E635] border border-white/20'
                      }`}
                    >
                      {switchingRole === r ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Active Account</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>Switch to {card.shortTitle}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Direct Specialist Doctor Account Switcher */}
          {doctors.length > 0 && (
            <div className="pt-5 border-t border-white/15 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Or Switch Directly to a Specialist Doctor Console
                </span>
                <span className="text-xs text-[#A3E635] font-semibold">
                  1-Click Doctor Login
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {doctors.slice(0, 4).map((doc) => {
                  const docEmail = `${doc.name.toLowerCase().replace(/[^a-z]/g, '')}@citycare.org`;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => handleQuickAccountSwitch('doctor', docEmail, doc.name)}
                      className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.1] border border-white/15 hover:border-white/40 text-left transition-all cursor-pointer group space-y-1"
                    >
                      <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#A3E635] block truncate">
                        {doc.name}
                      </span>
                      <span className="text-xs text-[#A3E635] block truncate">
                        {doc.speciality}
                      </span>
                      <span className="text-[11px] text-zinc-400 block truncate">
                        {doc.hospitalName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Security Footer */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#A3E635] shrink-0" />
              <span>
                Role-Based Access Control (RBAC) • Live Queue & Patient Visits Synchronized
              </span>
            </div>
            {users.length > 0 && (
              <span className="font-mono text-[#A3E635] shrink-0">
                {users.length} Active Accounts Ready
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

