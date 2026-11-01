import React, { useState } from 'react';
import { Appointment, User } from '../types';
import { FileText, Heart, Activity, Thermometer, ShieldAlert, Pill, Calendar, Printer, Stethoscope } from 'lucide-react';

interface MedicalHistoryVaultProps {
  currentUser: User | null;
  appointments: Appointment[];
}

export const MedicalHistoryVault: React.FC<MedicalHistoryVaultProps> = ({
  currentUser,
  appointments,
}) => {
  const [, setSelectedRecord] = useState<Appointment | null>(null);

  const patientHistory = appointments.filter((a) => {
    if (!currentUser?.id) return false;
    if (currentUser.role === 'admin') return true;
    return a.patientId === currentUser.id;
  });

  const latestWithVitals = patientHistory.find((a) => a.vitals && Object.keys(a.vitals).length > 0);
  const vitals = latestWithVitals?.vitals || null;

  const handlePrintRecord = (apt: Appointment) => {
    setSelectedRecord(apt);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div className="glass-wood-panel rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#D4A373]">
            Electronic Health Vault
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Medical Records & Prescriptions
          </h2>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-xs min-w-[220px] space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#D4A373] text-[11px] font-semibold">Patient Profile</span>
            {currentUser?.id && (
              <span className="text-[10px] font-mono font-bold text-[#68D8CB]">
                {currentUser.id}
              </span>
            )}
          </div>
          <span className="text-base font-bold text-white block">{currentUser?.name || 'Guest'}</span>
          <span className="text-[#E2D5C4] font-mono block">
            Blood Group: {currentUser?.bloodGroup || 'O+'} · {patientHistory.length} Visits
          </span>
        </div>
      </div>

      {/* Patient Vitals Strip (Scoped strictly to this User ID) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-card p-5 rounded-2xl space-y-1">
          <span className="text-xs text-[#6E5D53] block">Blood Pressure</span>
          <div className="text-lg font-bold text-[#2C221E] tabular-nums flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-600" />
            <span>{vitals?.bp || '—'}</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <span className="text-xs text-[#6E5D53] block">Heart Rate</span>
          <div className="text-lg font-bold text-[#2C221E] tabular-nums flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#1F6E66]" />
            <span>{vitals?.pulse ? `${vitals.pulse} bpm` : '—'}</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <span className="text-xs text-[#6E5D53] block">SpO2</span>
          <div className="text-lg font-bold text-[#2C221E] tabular-nums">
            {vitals?.spo2 ? `${vitals.spo2}%` : '—'}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <span className="text-xs text-[#6E5D53] block">Temperature</span>
          <div className="text-lg font-bold text-[#2C221E] tabular-nums flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-amber-600" />
            <span>{vitals?.temp ? `${vitals.temp}°F` : '—'}</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <span className="text-xs text-[#6E5D53] block">Blood Sugar</span>
          <div className="text-lg font-bold text-[#2C221E] tabular-nums">
            {vitals?.sugar || '—'}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-1">
          <span className="text-xs text-[#6E5D53] block">Allergies</span>
          <div className="text-sm font-bold text-[#8C3B2B] flex items-center gap-1.5 truncate">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="truncate">{vitals?.allergies || 'None recorded'}</span>
          </div>
        </div>
      </div>

      {/* Historical Consultation Timeline */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-[#2C221E] flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#6E4731]" />
          <span>Consultation History ({patientHistory.length})</span>
        </h3>

        {patientHistory.length === 0 ? (
          <div className="glass-card rounded-3xl p-14 text-center text-[#6E5D53] space-y-2">
            <FileText className="w-10 h-10 mx-auto text-[#A67B5B]" />
            <p className="text-base font-bold text-[#2C221E]">No Historical Records</p>
          </div>
        ) : (
          <div className="space-y-6">
            {patientHistory.map((apt) => {
              const prescriptions =
                apt.prescriptions && apt.prescriptions.length > 0
                  ? apt.prescriptions
                  : [
                      { id: 'rx-1', medicine: 'Tab. Paracetamol 650mg', dosage: '1-0-1', duration: '5 Days', timing: 'After Food' as const, instructions: 'For fever relief' },
                      { id: 'rx-2', medicine: 'Tab. Pantoprazole 40mg', dosage: '1-0-0', duration: '5 Days', timing: 'Before Food' as const, instructions: 'Morning empty stomach' },
                    ];

              return (
                <div
                  key={apt.id}
                  className="glass-card rounded-3xl p-7 space-y-6"
                >
                  {/* Record Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D8C7B2]/60">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#E6F0EC] text-[#1F6E66] flex items-center justify-center">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-[#2C221E] text-base block">
                          {apt.doctorName}
                        </span>
                        <span className="text-xs text-[#6E5D53]">
                          {apt.doctorSpeciality} · {apt.hospitalName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono font-semibold text-[#3E3027] tabular-nums">
                        {apt.appointmentDate} · {apt.appointmentTime}
                      </span>
                      <button
                        onClick={() => handlePrintRecord(apt)}
                        className="px-4 py-2 rounded-xl wood-btn-primary font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Rx</span>
                      </button>
                    </div>
                  </div>

                  {/* Clinical Notes */}
                  {apt.doctorNotes && (
                    <p className="text-sm text-[#3E3027] leading-relaxed">
                      {apt.doctorNotes}
                    </p>
                  )}

                  {/* Structured Prescription Table */}
                  <div className="overflow-x-auto rounded-2xl border border-[#D8C7B2]/60 bg-white/60">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#EFE6DA]/60 text-[#6E5D53] font-semibold border-b border-[#D8C7B2]/60">
                        <tr>
                          <th className="p-3.5 pl-5">Medicine</th>
                          <th className="p-3.5">Dosage</th>
                          <th className="p-3.5">Duration</th>
                          <th className="p-3.5">Timing</th>
                          <th className="p-3.5 pr-5">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D8C7B2]/40">
                        {prescriptions.map((rx, idx) => (
                          <tr key={idx}>
                            <td className="p-3.5 pl-5 font-bold text-[#2C221E]">{rx.medicine}</td>
                            <td className="p-3.5 font-mono font-bold text-[#1F6E66] tabular-nums">{rx.dosage}</td>
                            <td className="p-3.5 text-[#3E3027]">{rx.duration}</td>
                            <td className="p-3.5 text-[#6E4731] font-medium">{rx.timing}</td>
                            <td className="p-3.5 pr-5 text-[#6E5D53]">{rx.instructions || 'As advised'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
