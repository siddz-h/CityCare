import React from 'react';
import { Appointment } from '../types';
import { Printer, Download, CheckCircle, Clock, Building2, User, Phone, Calendar, ShieldCheck, QrCode } from 'lucide-react';

interface AppointmentSlipModalProps {
  appointment: Appointment;
  onClose: () => void;
}

export const AppointmentSlipModal: React.FC<AppointmentSlipModalProps> = ({
  appointment,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isPaid = appointment.paymentStatus === 'paid';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#070D19]/95 backdrop-blur-2xl text-slate-100 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-white/15 max-w-2xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Actions bar (non-printable) */}
        <div className="print:hidden px-5 py-3 bg-gradient-to-r from-[#0B1528] via-[#0F1F38] to-[#0B1528] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#A3E635] shadow-[0_0_8px_#A3E635]"></span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Confirmed OPD Token Slip
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-[#A3E635] hover:bg-[#bef264] text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-[#A3E635]/15 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable OPD Slip Body */}
        <div
          id="opd-slip-printable"
          className="p-4 sm:p-5 space-y-3.5 bg-[#070D19]/90 text-slate-100 print:bg-white print:text-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 print:border-slate-300 pb-3.5 gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#A3E635] text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
                  +
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-black text-white print:text-slate-900 tracking-tight leading-tight">
                    {appointment.hospitalName}
                  </h1>
                  <p className="text-[11px] text-slate-400 print:text-slate-600">
                    CityCare Healthcare Network • {appointment.city} • <span className="text-[#A3E635] print:text-teal-700 font-semibold">OPD Desk Active</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Token Badge */}
            <div className="text-right shrink-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                Token / OPD No.
              </span>
              <div className="px-3 py-1 bg-[#A3E635]/15 border border-[#A3E635] rounded-xl text-[#A3E635] print:text-teal-900 print:border-teal-700 font-mono font-black text-sm sm:text-base tracking-wider inline-block mt-0.5 shadow-sm">
                {appointment.tokenNumber}
              </div>
            </div>
          </div>

          {/* Appointment Core Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.04] print:bg-slate-50 border border-white/10 print:border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Consulting Specialist
              </span>
              <span className="text-xs sm:text-sm font-bold text-white print:text-slate-900 block mt-0.5">
                {appointment.doctorName}
              </span>
              <span className="text-[11px] text-[#A3E635] print:text-teal-700 font-semibold block">
                {appointment.doctorSpeciality}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Appointment Schedule
              </span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                <div className="flex items-center gap-1 font-bold text-xs sm:text-sm text-white print:text-slate-900">
                  <Calendar className="w-3.5 h-3.5 text-[#A3E635] print:text-teal-600" />
                  <span>{appointment.appointmentDate}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-300 print:text-slate-700 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-[#A3E635] print:text-teal-600" />
                  <span>{appointment.appointmentTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] print:bg-white border border-white/10 print:border-slate-200">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 pb-1 border-b border-white/10 print:border-slate-200">
              Patient Identification & Clinical Triage
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Patient Name</span>
                <span className="font-bold text-white print:text-slate-900 truncate block">{appointment.patientName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Age / Gender</span>
                <span className="font-bold text-white print:text-slate-900">{appointment.patientAge} yrs • {appointment.patientGender}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Contact Phone</span>
                <span className="font-bold text-white print:text-slate-900 font-mono">{appointment.patientPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Chief Concern</span>
                <span className="font-semibold text-slate-200 print:text-slate-700 truncate block">
                  {appointment.symptoms || 'Routine Consultation'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Receipt Stamp + QR Code combined row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-8 p-3.5 rounded-2xl bg-white/[0.04] print:bg-slate-50 border border-dashed border-white/20 print:border-slate-300 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Payment Summary
                </span>
                <div className="text-sm sm:text-base font-black text-white print:text-slate-900 mt-0.5">
                  Consultation Fee: <span className="text-[#A3E635] print:text-teal-800">₹{appointment.fee}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate max-w-[240px]">
                  {appointment.paymentMethod === 'demo_online' ? 'Online Gateway' : 'Cash at Counter'}
                  {appointment.transactionId && ` • ${appointment.transactionId}`}
                </div>
              </div>

              {/* Verification Stamp */}
              <div
                className={`px-3 py-1.5 rounded-xl text-center border uppercase font-black text-[10px] tracking-wider shrink-0 ${
                  isPaid
                    ? 'border-[#A3E635]/50 bg-[#A3E635]/15 text-[#A3E635] print:border-emerald-600 print:text-emerald-800'
                    : 'border-amber-400/50 bg-amber-400/15 text-amber-300 print:border-amber-600 print:text-amber-800'
                }`}
              >
                {isPaid ? (
                  <>
                    <div>✓ PAID ONLINE</div>
                    <div className="text-[9px] font-mono opacity-80">{appointment.transactionId || 'VERIFIED'}</div>
                  </>
                ) : (
                  <>
                    <div>PAY AT COUNTER</div>
                    <div className="text-[9px] opacity-80">DUE AT CHECK-IN</div>
                  </>
                )}
              </div>
            </div>

            {/* QR & Quick Instructions */}
            <div className="sm:col-span-4 p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-2.5">
              <div className="text-[10px] text-slate-400 space-y-0.5 leading-snug">
                <p className="font-bold text-slate-200 print:text-slate-800">OPD Check-In:</p>
                <p>Arrive 15m early & show token <span className="text-[#A3E635] font-bold">{appointment.tokenNumber}</span></p>
              </div>
              <div className="flex flex-col items-center shrink-0">
                <div className="w-11 h-11 bg-white rounded-lg p-1 flex items-center justify-center shadow-sm">
                  <QrCode className="w-9 h-9 text-slate-900" />
                </div>
                <span className="text-[8px] font-mono text-[#A3E635] mt-0.5 font-bold">VERIFIED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="print:hidden px-5 py-3 bg-[#0B1528]/90 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Present this digital slip at the Hospital Reception Desk
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-[#A3E635] hover:bg-[#bef264] text-slate-950 text-xs font-extrabold cursor-pointer transition-all shadow-md shadow-[#A3E635]/15"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
