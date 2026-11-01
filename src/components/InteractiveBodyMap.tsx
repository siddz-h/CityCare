import React, { useState } from 'react';
import {
  Activity,
  Brain,
  HeartPulse,
  Wind,
  Flame,
  Bone,
  Sparkles,
  Eye,
  Smile,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';

export interface BodyZone {
  id: string;
  name: string;
  department: string;
  view: 'front' | 'back' | 'both';
  cx: number;
  cy: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  defaultQuery: string;
  subSymptoms: { label: string; query: string; urgency?: 'Routine' | 'Medium' | 'High' }[];
  prepTip: string;
}

export const BODY_ZONES: BodyZone[] = [
  {
    id: 'head',
    name: 'Head & Brain',
    department: 'Neurology',
    view: 'both',
    cx: 100,
    cy: 34,
    icon: Brain,
    color: '#F43F5E',
    defaultQuery: 'severe migraine headache dizziness vertigo neurology',
    subSymptoms: [
      { label: 'Throbbing Migraine', query: 'severe throbbing migraine headache sensitivity to light neurology', urgency: 'High' },
      { label: 'Dizziness / Vertigo', query: 'dizziness spinning sensation vertigo balance issue neurology', urgency: 'Medium' },
      { label: 'Tension Headache', query: 'forehead tension headache stress headache neurology', urgency: 'Routine' },
      { label: 'Numbness / Tingling', query: 'tingling numbness nerve weakness neurology', urgency: 'High' },
    ],
    prepTip: 'Note headache triggers, frequency, and avoid caffeine 4 hours before neurological evaluation.',
  },
  {
    id: 'ent_eyes',
    name: 'Eyes, Ear & Throat',
    department: 'General Medicine',
    view: 'front',
    cx: 100,
    cy: 50,
    icon: Eye,
    color: '#0EA5E9',
    defaultQuery: 'sore throat sinus congestion ear pain blurred vision',
    subSymptoms: [
      { label: 'Sore Throat & Tonsils', query: 'sore throat painful swallowing tonsils fever general medicine', urgency: 'Medium' },
      { label: 'Sinus & Nasal Block', query: 'sinus headache nasal congestion facial pressure', urgency: 'Routine' },
      { label: 'Ear Pain / Ringing', query: 'ear pain discharge tinnitus hearing discomfort', urgency: 'Medium' },
      { label: 'Red / Watery Eyes', query: 'red watery eyes eye strain blurred vision', urgency: 'Routine' },
    ],
    prepTip: 'Bring any current eye drops or nasal sprays you have used in the past 48 hours.',
  },
  {
    id: 'dental',
    name: 'Dental & Jaw',
    department: 'Dental',
    view: 'front',
    cx: 100,
    cy: 64,
    icon: Smile,
    color: '#14B8A6',
    defaultQuery: 'toothache molar pain gum swelling sensitivity dental',
    subSymptoms: [
      { label: 'Sharp Toothache', query: 'sharp toothache molar pain cavity dental', urgency: 'Medium' },
      { label: 'Bleeding / Swollen Gums', query: 'bleeding gums swollen gums dental hygiene', urgency: 'Routine' },
      { label: 'Cold / Hot Sensitivity', query: 'tooth sensitivity to cold water and sweet food dental', urgency: 'Routine' },
      { label: 'Wisdom Tooth / Jaw Pain', query: 'lower jaw pain wisdom tooth swelling dental', urgency: 'Medium' },
    ],
    prepTip: 'Avoid extremely hot or cold beverages 2 hours prior to dental examination.',
  },
  {
    id: 'chest',
    name: 'Heart & Chest',
    department: 'Cardiology',
    view: 'front',
    cx: 112,
    cy: 105,
    icon: HeartPulse,
    color: '#EF4444',
    defaultQuery: 'chest heaviness palpitations high blood pressure cardiology',
    subSymptoms: [
      { label: 'Chest Heaviness', query: 'chest heaviness tightness on exertion cardiology', urgency: 'High' },
      { label: 'Rapid Palpitations', query: 'heart racing palpitations irregular heartbeat cardiology', urgency: 'High' },
      { label: 'High BP Checkup', query: 'high blood pressure hypertension review cardiology', urgency: 'Medium' },
      { label: 'Breathless on Walking', query: 'shortness of breath while climbing stairs fatigue cardiology', urgency: 'High' },
    ],
    prepTip: 'Bring previous ECG/Echo reports and your current blood pressure medication list.',
  },
  {
    id: 'lungs',
    name: 'Lungs & Airways',
    department: 'Pulmonology',
    view: 'both',
    cx: 86,
    cy: 102,
    icon: Wind,
    color: '#3B82F6',
    defaultQuery: 'persistent cough wheezing chest congestion asthma pulmonology',
    subSymptoms: [
      { label: 'Persistent Dry Cough', query: 'persistent dry cough for 5 days throat irritation pulmonology', urgency: 'Medium' },
      { label: 'Wheezing & Asthma', query: 'wheezing shortness of breath asthma inhaler pulmonology', urgency: 'High' },
      { label: 'Chest Congestion', query: 'chest congestion phlegm productivo cough bronchitis pulmonology', urgency: 'Medium' },
      { label: 'Viral Fever & Cold', query: 'child fever cold cough viral infection pediatrics general medicine', urgency: 'Medium' },
    ],
    prepTip: 'Carry any inhalers or nebulizer prescriptions currently in use for spirometry check.',
  },
  {
    id: 'abdomen',
    name: 'Stomach & Digestive',
    department: 'Gastroenterology',
    view: 'front',
    cx: 100,
    cy: 142,
    icon: Flame,
    color: '#F59E0B',
    defaultQuery: 'stomach pain acidity cramps indigestion gas gastroenterology',
    subSymptoms: [
      { label: 'Burning Acidity / GERD', query: 'stomach pain burning acidity heartburn reflux gastroenterology', urgency: 'Routine' },
      { label: 'Abdominal Cramps', query: 'lower stomach cramps abdominal pain bloating gastroenterology', urgency: 'Medium' },
      { label: 'Nausea & Vomiting', query: 'vomiting nausea food poisoning dehydration gastroenterology', urgency: 'Medium' },
      { label: 'Indigestion & Gas', query: 'chronic indigestion gas constipation liver check gastroenterology', urgency: 'Routine' },
    ],
    prepTip: 'Prefer light meals or 4-hour fasting in case an abdominal ultrasound is advised.',
  },
  {
    id: 'joints',
    name: 'Spine, Knees & Joints',
    department: 'Orthopedics',
    view: 'both',
    cx: 100,
    cy: 215,
    icon: Bone,
    color: '#6366F1',
    defaultQuery: 'joint pain knee stiffness back pain arthritis orthopedics',
    subSymptoms: [
      { label: 'Lower Back / Spine Pain', query: 'lower back pain lumbar stiffness sciatica orthopedics', urgency: 'Medium' },
      { label: 'Swollen / Painful Knee', query: 'knee joint pain swelling difficulty walking orthopedics', urgency: 'Medium' },
      { label: 'Shoulder / Neck Stiffness', query: 'frozen shoulder neck stiffness cervical pain orthopedics', urgency: 'Routine' },
      { label: 'Ankle Sprain / Injury', query: 'ankle sprain sports injury ligament pain orthopedics', urgency: 'High' },
    ],
    prepTip: 'Wear loose clothing around the affected joint and bring any prior X-Ray or MRI films.',
  },
  {
    id: 'skin',
    name: 'Skin & Allergy',
    department: 'Dermatology',
    view: 'both',
    cx: 56,
    cy: 138,
    icon: Sparkles,
    color: '#EC4899',
    defaultQuery: 'skin rash itching allergy eczema dermatology',
    subSymptoms: [
      { label: 'Itchy Red Rash', query: 'itchy red skin rash hives allergic reaction dermatology', urgency: 'Medium' },
      { label: 'Eczema / Dry Patches', query: 'dry scaly skin patches eczema dermatitis dermatology', urgency: 'Routine' },
      { label: 'Acne & Pigmentation', query: 'persistent facial acne scars skin pigmentation dermatology', urgency: 'Routine' },
      { label: 'Fungal / Ringworm', query: 'fungal skin infection itching ringworm dermatology', urgency: 'Routine' },
    ],
    prepTip: 'Avoid applying makeup or heavy steroid creams to the affected area before inspection.',
  },
];

interface InteractiveBodyMapProps {
  selectedZoneId: string;
  onSelectSymptom: (params: {
    zone: BodyZone;
    symptomLabel: string;
    query: string;
    painLevel: number;
    duration: string;
  }) => void;
}

export const InteractiveBodyMap: React.FC<InteractiveBodyMapProps> = ({
  selectedZoneId,
  onSelectSymptom,
}) => {
  const [bodyOrientation, setBodyOrientation] = useState<'front' | 'back'>('front');
  const [activeZoneId, setActiveZoneId] = useState<string>(selectedZoneId || 'chest');
  const [selectedSubLabel, setSelectedSubLabel] = useState<string>('Chest Heaviness');
  const [painLevel, setPainLevel] = useState<number>(5);
  const [duration, setDuration] = useState<string>('2-3 days');

  const activeZone = BODY_ZONES.find((z) => z.id === activeZoneId) || BODY_ZONES[3];

  const visibleZones = BODY_ZONES.filter(
    (z) => z.view === 'both' || z.view === bodyOrientation
  );

  const triggerSelection = (
    zone: BodyZone,
    subLabel: string,
    baseQuery: string,
    newPain = painLevel,
    newDuration = duration
  ) => {
    const severityDescriptor =
      newPain >= 8 ? 'severe high intensity' : newPain >= 5 ? 'moderate' : 'mild';
    const enrichedQuery = `${subLabel} (${severityDescriptor}, pain ${newPain}/10, duration ${newDuration}) - ${baseQuery}`;
    onSelectSymptom({
      zone,
      symptomLabel: `${zone.name}: ${subLabel} (Severity ${newPain}/10, ${newDuration})`,
      query: enrichedQuery,
      painLevel: newPain,
      duration: newDuration,
    });
  };

  return (
    <div className="rounded-2xl bg-slate-950 text-white border border-slate-800 p-4 sm:p-5 space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A3E635]" />
          <h4 className="text-xs sm:text-sm font-extrabold tracking-tight text-white">
            Interactive Anatomical Scanner
          </h4>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            · Click body region to localize symptoms
          </span>
        </div>

        <button
          type="button"
          onClick={() => setBodyOrientation((prev) => (prev === 'front' ? 'back' : 'front'))}
          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#A3E635] text-xs font-bold border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="capitalize">{bodyOrientation} View</span>
        </button>
      </div>

      {/* Main Split: Left SVG Body Silhouette + Right Localized Symptom Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Left: SVG Human Body Map */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center bg-[#0B1120] rounded-2xl border border-slate-800/90 p-3 relative min-h-[290px]">
          <div className="absolute top-2.5 left-3 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            {bodyOrientation === 'front' ? 'Anterior Scan' : 'Posterior Scan'}
          </div>
          <div className="absolute top-2.5 right-3 text-[10px] font-mono text-[#A3E635] font-bold">
            {activeZone.department}
          </div>

          <svg
            viewBox="0 0 200 280"
            className="w-44 h-64 select-none overflow-visible"
            aria-label="Interactive Human Body Map"
          >
            {/* Subtle Medical Grid Lines */}
            <line x1="100" y1="10" x2="100" y2="270" stroke="#1E293B" strokeDasharray="3 3" strokeWidth="1" />
            <line x1="30" y1="105" x2="170" y2="105" stroke="#1E293B" strokeDasharray="3 3" strokeWidth="1" />
            <line x1="30" y1="165" x2="170" y2="165" stroke="#1E293B" strokeDasharray="3 3" strokeWidth="1" />

            {/* Stylized Human Body Silhouette */}
            <g
              fill="#1E293B"
              stroke="#334155"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Head */}
              <circle cx="100" cy="38" r="20" />
              {/* Neck */}
              <rect x="92" y="57" width="16" height="12" rx="4" />
              {/* Torso */}
              <path d="M68 68 C68 68 100 65 132 68 L126 164 C126 168 114 172 100 172 C86 172 74 168 74 164 Z" />
              {/* Left Arm */}
              <path d="M68 70 L46 145 C44 150 48 154 53 152 L71 95" />
              {/* Right Arm */}
              <path d="M132 70 L154 145 C156 150 152 154 147 152 L129 95" />
              {/* Left Leg */}
              <path d="M76 168 L70 258 C70 264 82 264 84 258 L95 172" />
              {/* Right Leg */}
              <path d="M124 168 L130 258 C130 264 118 264 116 258 L105 172" />
            </g>

            {/* Spine Line if Back View */}
            {bodyOrientation === 'back' && (
              <line
                x1="100"
                y1="62"
                x2="100"
                y2="165"
                stroke="#6366F1"
                strokeWidth="3"
                strokeDasharray="4 3"
              />
            )}

            {/* Interactive Organ / Zone Hotspots */}
            {visibleZones.map((zone) => {
              const isSelected = zone.id === activeZone.id;
              return (
                <g
                  key={zone.id}
                  onClick={() => {
                    setActiveZoneId(zone.id);
                    const firstSub = zone.subSymptoms[0];
                    setSelectedSubLabel(firstSub.label);
                    triggerSelection(zone, firstSub.label, firstSub.query);
                  }}
                  className="cursor-pointer group"
                >
                  {isSelected && (
                    <circle
                      cx={zone.cx}
                      cy={zone.cy}
                      r="16"
                      fill={zone.color}
                      fillOpacity="0.22"
                      stroke={zone.color}
                      strokeWidth="1.5"
                    />
                  )}
                  <circle
                    cx={zone.cx}
                    cy={zone.cy}
                    r={isSelected ? 8.5 : 6.5}
                    fill={isSelected ? '#A3E635' : zone.color}
                    stroke="#0F172A"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </svg>

          {/* Quick Region Pills below Body SVG */}
          <div className="flex flex-wrap justify-center gap-1 pt-1">
            {BODY_ZONES.map((z) => {
              const isActive = z.id === activeZone.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => {
                    setActiveZoneId(z.id);
                    if (z.view !== 'both' && z.view !== bodyOrientation) {
                      setBodyOrientation(z.view);
                    }
                    const firstSub = z.subSymptoms[0];
                    setSelectedSubLabel(firstSub.label);
                    triggerSelection(z, firstSub.label, firstSub.query);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#A3E635] text-slate-950'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {z.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Specific Symptoms + Pain Intensity + Duration */}
        <div className="sm:col-span-7 space-y-3.5">
          {/* Selected Region Header */}
          <div className="flex items-center justify-between gap-2 bg-slate-900/90 px-3.5 py-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#A3E635]/15 border border-[#A3E635]/40 flex items-center justify-center text-[#A3E635]">
                <activeZone.icon className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                  {activeZone.name}
                </h5>
                <span className="text-[11px] text-[#A3E635] font-semibold">
                  Target Dept: {activeZone.department}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              Severity {painLevel}/10
            </span>
          </div>

          {/* Specific Localized Symptoms Grid */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 block">
              Select specific symptom in {activeZone.name}:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {activeZone.subSymptoms.map((sub) => {
                const isPicked = selectedSubLabel === sub.label;
                return (
                  <button
                    key={sub.label}
                    type="button"
                    onClick={() => {
                      setSelectedSubLabel(sub.label);
                      triggerSelection(activeZone, sub.label, sub.query);
                    }}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between gap-1.5 border ${
                      isPicked
                        ? 'bg-[#A3E635] text-slate-950 border-[#A3E635] font-extrabold'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
                    }`}
                  >
                    <span className="truncate">{sub.label}</span>
                    {isPicked && <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pain Scale Slider (1-10) & Duration Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300">Discomfort Scale</span>
                <span
                  className={`font-extrabold tabular-nums ${
                    painLevel >= 8
                      ? 'text-rose-400'
                      : painLevel >= 5
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {painLevel}/10 {painLevel >= 8 ? '(Severe)' : painLevel >= 5 ? '(Moderate)' : '(Mild)'}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={painLevel}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setPainLevel(val);
                  const currentSub =
                    activeZone.subSymptoms.find((s) => s.label === selectedSubLabel) ||
                    activeZone.subSymptoms[0];
                  triggerSelection(activeZone, currentSub.label, currentSub.query, val, duration);
                }}
                className="w-full accent-[#A3E635] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-300 block">How long?</span>
              <div className="grid grid-cols-3 gap-1">
                {['Today', '2-3 days', '1+ week'].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => {
                      setDuration(dur);
                      const currentSub =
                        activeZone.subSymptoms.find((s) => s.label === selectedSubLabel) ||
                        activeZone.subSymptoms[0];
                      triggerSelection(
                        activeZone,
                        currentSub.label,
                        currentSub.query,
                        painLevel,
                        dur
                      );
                    }}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                      duration === dur
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clinical Prep Guidance Strip */}
          <div className="p-2.5 rounded-xl bg-blue-950/50 border border-blue-500/30 flex items-start gap-2 text-[11px] text-blue-200">
            <AlertCircle className="w-4 h-4 text-[#A3E635] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Pre-Visit Tip:</strong> {activeZone.prepTip}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
