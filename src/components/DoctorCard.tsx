import React from 'react';
import { Doctor } from '../types';
import { Calendar, Clock, Star, Building2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { getDoctorCartoonAvatar } from '../utils/doctorAvatars';

interface DoctorCardProps {
  doctor: Doctor;
  onBook: (doctor: Doctor) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBook }) => {
  const cartoonAvatar =
    doctor.avatar && doctor.avatar.startsWith('data:image/svg+xml')
      ? doctor.avatar
      : getDoctorCartoonAvatar(doctor.name, doctor.speciality, doctor.gender);

  return (
    <div className="rounded-2xl card-premium glass-card-hover p-4 sm:p-5 flex flex-col justify-between gap-3.5">
      <div className="space-y-3">
        {/* Profile Header */}
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <img
              src={cartoonAvatar}
              alt={doctor.name}
              className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shadow-xs bg-slate-50"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-blue-600 truncate">
                {doctor.speciality}
              </span>
              <span className="inline-flex items-center gap-1 font-extrabold text-slate-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md tabular-nums shrink-0">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                {doctor.rating}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                {doctor.name}
              </h3>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            </div>

            <p className="text-[11px] text-slate-500 truncate">
              {doctor.qualification} · <span className="tabular-nums">{doctor.experience} yrs exp</span>
            </p>
          </div>
        </div>

        {/* Hospital & Schedule Info */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-800">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-bold truncate">{doctor.hospitalName}</span>
          </div>

          <div className="flex items-center justify-between text-slate-500 pt-1.5 border-t border-slate-200/70">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{doctor.availableDays.slice(0, 4).join(', ')}</span>
            </span>

            <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-700 font-bold">
              <Clock className="w-3 h-3" />
              <span>{(doctor.availableSlots || [])[0] || '10:00 AM'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer Fee & CTA */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-medium text-slate-500 block">Consultation Fee</span>
          <span className="text-base font-extrabold text-emerald-700 tabular-nums">
            ₹{doctor.fee}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onBook(doctor)}
          className="px-3.5 py-2 rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
        >
          <span>Book Visit</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
