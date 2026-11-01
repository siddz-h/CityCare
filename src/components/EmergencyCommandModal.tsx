import React, { useState, useEffect } from 'react';
import { Hospital } from '../types';
import {
  AlertTriangle,
  PhoneCall,
  X,
  Activity,
  Building2,
  MapPin,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Navigation,
  HeartPulse,
  Wind,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface EmergencyCommandModalProps {
  selectedCity: string;
  hospitals: Hospital[];
  onClose: () => void;
  onSelectHospitalDoctors?: (hospital: Hospital) => void;
}

interface HospitalCapacity {
  hospital: Hospital;
  icuTotal: number;
  icuAvailable: number;
  oxygenTotal: number;
  oxygenAvailable: number;
  ventilatorAvailable: number;
  erWaitMins: number;
  traumaTeamReady: boolean;
}

export const EmergencyCommandModal: React.FC<EmergencyCommandModalProps> = ({
  selectedCity,
  hospitals,
  onClose,
  onSelectHospitalDoctors,
}) => {
  // Compute deterministic, realistic capacity metrics for each hospital in the city
  const capacityList: HospitalCapacity[] = (
    hospitals.length > 0
      ? hospitals
      : [
          {
            id: 'hosp-fallback-1',
            name: `${selectedCity} Civil & Trauma Super-Speciality Center`,
            city: selectedCity,
            state: 'Maharashtra',
            address: `Main Station Road, ${selectedCity}`,
            phone: '+91 2587 224500',
            emergencyPhone: '108',
            email: 'trauma@citycare.org',
            departments: ['Cardiology', 'Trauma', 'General Medicine', 'Orthopedics'],
            rating: 4.8,
            beds: 240,
            lat: 21.0441,
            lng: 75.0641,
            isOpen24x7: true,
            image: '',
          },
        ]
  ).map((h, idx) => {
    const totalBeds = h.beds || 150;
    const icuTotal = Math.max(12, Math.round(totalBeds * 0.12));
    const icuAvailable = Math.max(2, ((idx * 3 + 5) % Math.max(4, Math.floor(icuTotal * 0.45))) + 2);
    const oxygenTotal = Math.max(24, Math.round(totalBeds * 0.25));
    const oxygenAvailable = Math.max(6, ((idx * 7 + 11) % Math.max(8, Math.floor(oxygenTotal * 0.5))) + 4);
    const ventilatorAvailable = Math.max(1, ((idx * 2 + 3) % 6) + 1);
    const erWaitMins = 3 + ((idx * 4) % 9);

    return {
      hospital: h,
      icuTotal,
      icuAvailable,
      oxygenTotal,
      oxygenAvailable,
      ventilatorAvailable,
      erWaitMins,
      traumaTeamReady: true,
    };
  });

  const [selectedHospId, setSelectedHospId] = useState<string>(
    capacityList[0]?.hospital.id || ''
  );
  const [dispatchActive, setDispatchActive] = useState<boolean>(false);
  const [dispatchProgress, setDispatchProgress] = useState<number>(0);
  const [patientLocation, setPatientLocation] = useState<string>(
    `${selectedCity} Central Bus Stand / Sector 4`
  );
  const [emergencyType, setEmergencyType] = useState<string>('Cardiac / Chest Pain');
  const [reservedToken, setReservedToken] = useState<string | null>(null);
  const [simulatedCallActive, setSimulatedCallActive] = useState<boolean>(false);
  const [callSeconds, setCallSeconds] = useState<number>(0);

  const activeCap =
    capacityList.find((c) => c.hospital.id === selectedHospId) || capacityList[0];

  // Animate 108 Ambulance Route progress when dispatched
  useEffect(() => {
    if (!dispatchActive) return;
    const timer = setInterval(() => {
      setDispatchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 4;
      });
    }, 350);
    return () => clearInterval(timer);
  }, [dispatchActive]);

  // Simulated 108 Demo Call Timer
  useEffect(() => {
    if (!simulatedCallActive) {
      setCallSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [simulatedCallActive]);

  const handleDispatchAmbulance = (cap: HospitalCapacity) => {
    setSelectedHospId(cap.hospital.id);
    setDispatchProgress(12);
    setDispatchActive(true);
    const code = `ER-${(selectedCity || 'CTY').slice(0, 3).toUpperCase()}-${Math.floor(
      100 + Math.random() * 899
    )}`;
    setReservedToken(code);
  };

  const handleSimulate108Call = () => {
    setSimulatedCallActive((prev) => {
      const next = !prev;
      if (next && !dispatchActive && activeCap) {
        handleDispatchAmbulance(activeCap);
      }
      return next;
    });
  };

  const formatCallDuration = (secs: number) => {
    const mins = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const rem = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${rem}`;
  };

  const remainingEtaMins = Math.max(
    1,
    Math.ceil(((100 - dispatchProgress) / 100) * (activeCap?.erWaitMins + 4 || 7))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0B1120] text-white rounded-3xl max-w-5xl w-full border border-slate-800 shadow-2xl overflow-hidden my-auto">
        {/* Top Project Showcase Disclaimer Banner */}
        <div className="px-6 py-2 bg-amber-500/15 border-b border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="font-bold text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#A3E635]" />
            <span>
              PROJECT SHOWCASE SIMULATION ONLY — All 108 Calls, SOS & Ambulance Dispatches are
              simulated in-app demos (No real emergency calls are placed).
            </span>
          </span>
          <span className="font-mono text-amber-200/80 uppercase">Academic Demo Mode</span>
        </div>

        {/* Top Command Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#2B1216] via-[#111C38] to-[#0B1120] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#A3E635] font-bold">
                  CityCare Emergency Showcase Simulator
                </span>
                <span className="text-xs text-slate-400">· {selectedCity}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Simulated 24/7 ICU Bed Matrix & 108 Ambulance Dispatch
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSimulate108Call}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                simulatedCallActive
                  ? 'bg-[#A3E635] text-slate-950 animate-pulse'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>
                {simulatedCallActive
                  ? `Demo 108 Call Active (${formatCallDuration(callSeconds)}) — End`
                  : 'Simulate 108 Call (Demo)'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Simulated In-App 108 Call Banner when Demo Call is Triggered */}
        {simulatedCallActive && (
          <div className="mx-5 sm:mx-6 mt-4 p-4 rounded-2xl bg-emerald-950/80 border border-[#A3E635]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#A3E635] text-slate-950 flex items-center justify-center shrink-0 font-black">
                <PhoneCall className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#A3E635] uppercase tracking-wider">
                    Simulated 108 Control Room Connected • {formatCallDuration(callSeconds)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-white">
                    DEMO ONLY
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-0.5">
                  “CityCare 108 Demo Desk ({selectedCity}): Simulated ALS Ambulance dispatched to{' '}
                  <strong>{patientLocation}</strong> and Trauma Bay reserved at{' '}
                  <strong>{activeCap?.hospital.name}</strong>.”
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSimulatedCallActive(false)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold cursor-pointer shrink-0"
            >
              End Demo Call
            </button>
          </div>
        )}

        {/* Main 2-Column Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[82vh] overflow-y-auto">
          {/* LEFT 7 COLS: Live ICU, Oxygen & Trauma Bed Matrix */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#A3E635]" />
                <span>
                  Live Hospital Bed & ICU Availability ({capacityList.length} Facilities)
                </span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Real-Time Trauma Readiness
              </span>
            </div>

            <div className="space-y-3">
              {capacityList.map((cap) => {
                const isSelected = cap.hospital.id === activeCap?.hospital.id;
                return (
                  <div
                    key={cap.hospital.id}
                    onClick={() => setSelectedHospId(cap.hospital.id)}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-[#111C38] border-[#A3E635] shadow-lg'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-extrabold text-white">
                            {cap.hospital.name}
                          </h4>
                          <span className="text-[11px] font-bold text-[#A3E635]">
                            24×7 Trauma
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cap.hospital.address}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-lg tabular-nums">
                          ER Wait: ~{cap.erWaitMins}m
                        </span>
                      </div>
                    </div>

                    {/* 3 Capacity Meters: ICU, Oxygen, Ventilator */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                            <span>ICU Beds</span>
                          </span>
                          <span className="font-mono font-extrabold text-white tabular-nums">
                            {cap.icuAvailable}/{cap.icuTotal}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-[#A3E635] rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((cap.icuAvailable / cap.icuTotal) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Wind className="w-3.5 h-3.5 text-sky-400" />
                            <span>O₂ Beds</span>
                          </span>
                          <span className="font-mono font-extrabold text-white tabular-nums">
                            {cap.oxygenAvailable}/{cap.oxygenTotal}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-sky-400 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((cap.oxygenAvailable / cap.oxygenTotal) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Ventilators</span>
                          </span>
                          <span className="font-mono font-extrabold text-[#A3E635] tabular-nums">
                            {cap.ventilatorAvailable} Ready
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                          <div className="h-full bg-amber-400 rounded-full w-3/4" />
                        </div>
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-slate-400">
                        Emergency Desk: <strong className="text-slate-200">{cap.hospital.phone}</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {onSelectHospitalDoctors && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectHospitalDoctors(cap.hospital);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer transition-colors"
                          >
                            Specialists
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDispatchAmbulance(cap);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Pre-Alert ER & Dispatch 108</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT 5 COLS: 108 ALS Ambulance Dispatch & Telemetry Simulator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-[#111C38] border border-slate-800 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#A3E635] flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" />
                  <span>108 ALS Dispatch Simulator</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">GPS Corridor</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Pickup Landmark ({selectedCity})
                  </label>
                  <input
                    type="text"
                    value={patientLocation}
                    onChange={(e) => setPatientLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-[#A3E635]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Emergency Category
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      'Cardiac / Chest Pain',
                      'Road Accident / Trauma',
                      'Acute Breathlessness',
                      'High Fever / Pediatric',
                    ].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEmergencyType(cat)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left cursor-pointer border transition-all ${
                          emergencyType === cat
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Animated GPS Route Corridor Visualization */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">
                    Target: {activeCap?.hospital.name}
                  </span>
                  <span className="font-mono font-extrabold text-[#A3E635] tabular-nums">
                    {dispatchActive
                      ? dispatchProgress >= 100
                        ? 'ARRIVED AT ER BAY'
                        : `ETA ~${remainingEtaMins} min`
                      : 'Standby'}
                  </span>
                </div>

                {/* SVG Route Track */}
                <div className="relative py-3">
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-[#A3E635] transition-all duration-300"
                      style={{ width: `${dispatchActive ? dispatchProgress : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1.5">
                    <span>Pickup: {patientLocation.slice(0, 18)}...</span>
                    <span>Green Corridor</span>
                    <span>Trauma Bay #1</span>
                  </div>
                </div>

                {/* Live Paramedic Telemetry Readout when Dispatched */}
                {dispatchActive ? (
                  <div className="p-3 rounded-xl bg-slate-900 border border-[#A3E635]/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#A3E635] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Trauma Bay Pre-Alert Token: {reservedToken}</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        ALS-108-MH19
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Emergency classification <strong className="text-white">{emergencyType}</strong>{' '}
                      transmitted to <strong className="text-white">{activeCap?.hospital.name}</strong>.
                      On-duty trauma team and ICU bed reserved.
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-[11px]">
                      <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">O₂ Support</span>
                        <span className="text-emerald-400 font-bold">Ready (15L)</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">Defibrillator</span>
                        <span className="text-[#A3E635] font-bold">Armed</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400 block text-[9px]">ER Priority</span>
                        <span className="text-rose-400 font-bold">Code Red</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDispatchAmbulance(activeCap)}
                    className="w-full py-3 px-4 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Simulate 108 Dispatch & Reserve ER Bay</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#A3E635]" />
                  <span>Zero-Delay Trauma Handshake</span>
                </span>
                <span className="font-mono">Toll-Free 108 / 112</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
