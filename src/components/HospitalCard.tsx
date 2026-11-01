import React, { useState } from 'react';
import { Hospital } from '../types';
import { Building2, MapPin, Star, ArrowRight } from 'lucide-react';

interface HospitalCardProps {
  hospital: Hospital;
  isSelected?: boolean;
  onSelect: (hospital: Hospital) => void;
  onViewDoctors: (hospital: Hospital) => void;
}

export const HospitalCard: React.FC<HospitalCardProps> = ({
  hospital,
  isSelected,
  onSelect,
  onViewDoctors,
}) => {
  const [imgError, setImgError] = useState(false);

  const generalAvail =
    hospital.bedDetails?.generalAvailable ?? Math.floor((hospital.beds || 150) * 0.4);
  const icuAvail = hospital.bedDetails?.icuAvailable ?? 4;
  const ventAvail = hospital.bedDetails?.ventilatorsAvailable ?? 2;

  return (
    <div
      className={`group relative rounded-2xl card-premium glass-card-hover p-4 flex flex-col justify-between gap-3.5 ${
        isSelected ? 'ring-2 ring-blue-600 border-blue-600' : ''
      }`}
    >
      <div className="space-y-3">
        {/* Image Header */}
        <div className="relative h-36 rounded-xl overflow-hidden bg-slate-100">
          {!imgError && hospital.image ? (
            <img
              src={hospital.image}
              alt={hospital.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col items-center justify-center text-white p-4">
              <Building2 className="w-8 h-8 text-[#A3E635] mb-1.5" />
              <span className="text-xs font-semibold text-center line-clamp-1">{hospital.name}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />

          {/* Top Floating Glass Overlay */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-950/70 backdrop-blur-md text-[#A3E635] border border-white/15">
              {hospital.isOpen24x7 ? '24/7 Emergency' : 'OPD 08:00–20:00'}
            </span>

            <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-extrabold text-slate-900 flex items-center gap-1 shadow-xs">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span className="tabular-nums">{hospital.rating || '4.6'}</span>
            </div>
          </div>

          {/* Title & City on Scrim */}
          <div className="absolute bottom-2.5 left-3 right-3 text-white">
            <h3 className="font-extrabold text-sm sm:text-base leading-snug line-clamp-1">
              {hospital.name}
            </h3>
            <p className="text-[11px] text-slate-200 flex items-center gap-1.5 mt-0.5 line-clamp-1">
              <MapPin className="w-3 h-3 text-[#A3E635] shrink-0" />
              <span>{hospital.city}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{hospital.phone}</span>
            </p>
          </div>
        </div>

        {/* Bed Capacity Strip */}
        <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              General
            </span>
            <span className="text-xs font-extrabold text-slate-900 tabular-nums mt-0.5 block">
              {generalAvail} beds
            </span>
          </div>
          <div className="border-x border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              ICU
            </span>
            <span className="text-xs font-extrabold text-blue-600 tabular-nums mt-0.5 block">
              {icuAvail} open
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Ventilator
            </span>
            <span className="text-xs font-extrabold text-emerald-600 tabular-nums mt-0.5 block">
              {ventAvail} ready
            </span>
          </div>
        </div>

        {/* Specialities Line */}
        <div className="text-[11px] text-slate-500 flex items-center flex-wrap gap-1.5">
          {(hospital.departments || ['General Medicine', 'Emergency'])
            .slice(0, 3)
            .map((d, i, arr) => (
              <React.Fragment key={i}>
                <span className="font-semibold text-slate-700">{d}</span>
                {i < arr.length - 1 && (
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                )}
              </React.Fragment>
            ))}
          {(hospital.departments || []).length > 3 && (
            <span className="text-blue-600 font-semibold">
              +{hospital.departments.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onSelect(hospital)}
          className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>Map View</span>
        </button>
        <button
          type="button"
          onClick={() => onViewDoctors(hospital)}
          className="px-3 py-2 text-xs font-extrabold rounded-xl bg-[#A3E635] hover:bg-[#84CC16] text-slate-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
        >
          <span>Specialists</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
