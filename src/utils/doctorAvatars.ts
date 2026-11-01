// Deterministic Anime / Cartoon Style Doctor Avatar Generator (Male & Female)

const FEMALE_FIRST_NAMES = new Set([
  'ananya',
  'meera',
  'shalini',
  'neha',
  'neeta',
  'sneha',
  'priya',
  'kavita',
  'pooja',
  'sunita',
  'swati',
  'pallavi',
  'anjali',
  'divya',
  'ritusmita',
  'sonali',
  'madhuri',
  'archana',
  'vandana',
  'deepika',
  'shruti',
  'nandini',
  'aditi',
  'rashmi',
  'vidya',
  'rekha',
  'bhavana',
  'shweta',
  'gayatri',
  'vaishali',
  'rupali',
  'manisha',
  'jyoti',
  'smita',
  'ashwini',
  'sujata',
  'varsha',
  'amruta',
  'tejaswini',
  'radhika',
  'kriti',
  'fatima',
  'ayesha',
  'maria',
]);

export function inferDoctorGender(name: string, explicitGender?: string): 'male' | 'female' {
  if (explicitGender) {
    const g = explicitGender.trim().toLowerCase();
    if (g === 'female' || g === 'f') return 'female';
    if (g === 'male' || g === 'm') return 'male';
  }
  const cleaned = (name || '')
    .replace(/^dr\.?\s+/i, '')
    .trim()
    .toLowerCase();
  const firstToken = cleaned.split(/\s+/)[0]?.replace(/[^a-z]/g, '') || '';
  if (FEMALE_FIRST_NAMES.has(firstToken)) {
    return 'female';
  }
  // Heuristic check for common Indian female name endings if token length > 4
  if (
    firstToken.endsWith('tai') ||
    firstToken.endsWith('bai') ||
    firstToken.endsWith('shree') ||
    firstToken.endsWith('shri') ||
    firstToken.endsWith('wati') ||
    firstToken.endsWith('mati')
  ) {
    return 'female';
  }
  return 'male';
}

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

const BG_PALETTES: Record<string, { bg1: string; bg2: string; scrub: string; badge: string }> = {
  cardiology: { bg1: '#FFE4E6', bg2: '#FECDD3', scrub: '#E11D48', badge: '#FB7185' },
  pediatrics: { bg1: '#FEF3C7', bg2: '#FDE68A', scrub: '#D97706', badge: '#FBBF24' },
  orthopedics: { bg1: '#E0E7FF', bg2: '#C7D2FE', scrub: '#4F46E5', badge: '#818CF8' },
  neurology: { bg1: '#F3E8FF', bg2: '#E9D5FF', scrub: '#7C3AED', badge: '#A78BFA' },
  pulmonology: { bg1: '#E0F2FE', bg2: '#BAE6FD', scrub: '#0284C7', badge: '#38BDF8' },
  gastroenterology: { bg1: '#FFEDD5', bg2: '#FED7AA', scrub: '#EA580C', badge: '#FB923C' },
  dermatology: { bg1: '#FCE7F3', bg2: '#FBCFE8', scrub: '#DB2777', badge: '#F472B6' },
  dental: { bg1: '#CCFBF1', bg2: '#99F6E4', scrub: '#0D9488', badge: '#2DD4BF' },
  default: { bg1: '#DCFCE7', bg2: '#BBF7D0', scrub: '#059669', badge: '#34D399' },
};

const SKIN_TONES = ['#FDE2C8', '#F7C9A6', '#EAB68F', '#F3D1B0', '#E5AD84'];
const HAIR_COLORS = ['#1E293B', '#0F172A', '#3B2314', '#271810', '#1C1917', '#334155'];

export function getDoctorCartoonAvatar(
  name: string,
  speciality = 'General Medicine',
  explicitGender?: string
): string {
  const gender = inferDoctorGender(name, explicitGender);
  const h = hashString(`${name}-${speciality}-${gender}`);

  const specKey = speciality.toLowerCase();
  const palette =
    BG_PALETTES[specKey] ||
    Object.entries(BG_PALETTES).find(([k]) => specKey.includes(k))?.[1] ||
    BG_PALETTES.default;

  const skin = SKIN_TONES[h % SKIN_TONES.length];
  const hair = HAIR_COLORS[(h >> 3) % HAIR_COLORS.length];
  const hasGlasses = h % 3 === 0;
  const hairVariant = h % 3;

  // Anime/Cartoon Hair Paths for Female vs Male
  const femaleBackHair =
    hairVariant === 0
      ? `<path d="M52 72 C44 105 46 142 60 158 L140 158 C154 142 156 105 148 72 Z" fill="${hair}" />`
      : hairVariant === 1
      ? `<circle cx="100" cy="40" r="22" fill="${hair}" /><path d="M56 76 C50 105 54 134 66 146 L134 146 C146 134 150 105 144 76 Z" fill="${hair}" />`
      : `<path d="M50 75 C40 112 48 150 64 162 L136 162 C152 150 160 112 150 75 Z" fill="${hair}" />`;

  const femaleFrontHair =
    hairVariant === 0
      ? `<path d="M54 78 C54 44 74 30 100 30 C126 30 146 44 146 78 C134 58 116 52 100 56 C84 52 66 58 54 78 Z" fill="${hair}" />`
      : `<path d="M54 80 C54 45 75 31 100 31 C125 31 146 45 146 80 C138 62 122 50 104 54 C88 50 68 60 54 80 Z" fill="${hair}" />`;

  const maleHair =
    hairVariant === 0
      ? `<path d="M55 78 C53 45 73 30 100 30 C127 30 147 45 145 78 C138 58 122 50 100 52 C78 50 62 58 55 78 Z" fill="${hair}" />
         <path d="M72 34 L82 24 L94 32 L108 22 L118 33" fill="${hair}" />`
      : hairVariant === 1
      ? `<path d="M56 76 C54 44 74 32 100 32 C126 32 146 44 144 76 C135 55 112 48 90 54 C74 56 62 64 56 76 Z" fill="${hair}" />`
      : `<path d="M55 76 C54 42 75 28 100 28 C125 28 146 42 145 76 C134 56 118 48 100 48 C82 48 66 56 55 76 Z" fill="${hair}" />`;

  const glassesSvg = hasGlasses
    ? `<g stroke="#1E293B" stroke-width="2.4" fill="rgba(255,255,255,0.25)">
         <rect x="69" y="74" width="24" height="15" rx="5" />
         <rect x="107" y="74" width="24" height="15" rx="5" />
         <line x1="93" y1="81" x2="107" y2="81" />
       </g>`
    : '';

  const eyelashes =
    gender === 'female'
      ? `<path d="M72 78 Q81 73 89 78" stroke="#0F172A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
         <path d="M111 78 Q119 73 128 78" stroke="#0F172A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
         <circle cx="63" cy="88" r="3" fill="#F43F5E" opacity="0.55" />
         <circle cx="137" cy="88" r="3" fill="#F43F5E" opacity="0.55" />`
      : `<path d="M72 75 L90 76" stroke="${hair}" stroke-width="3" stroke-linecap="round"/>
         <path d="M110 76 L128 75" stroke="${hair}" stroke-width="3" stroke-linecap="round"/>`;

  const mouth =
    gender === 'female'
      ? `<path d="M91 102 Q100 110 109 102" stroke="#E11D48" stroke-width="2.8" fill="none" stroke-linecap="round" />`
      : `<path d="M90 103 Q100 110 110 103" stroke="#7C2D12" stroke-width="2.6" fill="none" stroke-linecap="round" />`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.bg1}" />
        <stop offset="100%" stop-color="${palette.bg2}" />
      </linearGradient>
    </defs>

    <!-- Background Circle/Square -->
    <rect width="200" height="200" rx="32" fill="url(#bgGrad)" />
    <circle cx="100" cy="105" r="76" fill="#FFFFFF" opacity="0.45" />

    <!-- Medical Cross Emblem in Corner -->
    <g transform="translate(152, 18)">
      <circle cx="14" cy="14" r="14" fill="#FFFFFF" opacity="0.9" />
      <path d="M14 7 V21 M7 14 H21" stroke="${palette.scrub}" stroke-width="3.5" stroke-linecap="round" />
    </g>

    <!-- Female Back Hair -->
    ${gender === 'female' ? femaleBackHair : ''}

    <!-- Neck -->
    <rect x="88" y="114" width="24" height="26" rx="8" fill="${skin}" />

    <!-- Doctor Scrubs & White Lab Coat -->
    <path d="M34 200 C36 152 62 134 100 134 C138 134 164 152 166 200 Z" fill="${palette.scrub}" />
    <!-- White Coat Left & Right Lapels -->
    <path d="M34 200 C36 152 58 136 82 134 L94 200 Z" fill="#FFFFFF" />
    <path d="M166 200 C164 152 142 136 118 134 L106 200 Z" fill="#FFFFFF" />
    <path d="M82 134 L95 172 L72 166 Z" fill="#F1F5F9" />
    <path d="M118 134 L105 172 L128 166 Z" fill="#F1F5F9" />

    <!-- Stethoscope around Neck -->
    <path d="M74 132 C72 162 84 176 100 176 C116 176 128 162 126 132" stroke="#0F172A" stroke-width="4.5" fill="none" stroke-linecap="round" />
    <circle cx="122" cy="168" r="8" fill="#CBD5E1" stroke="#0F172A" stroke-width="3" />
    <circle cx="122" cy="168" r="3" fill="${palette.badge}" />

    <!-- Ears -->
    <circle cx="58" cy="84" r="8" fill="${skin}" />
    <circle cx="142" cy="84" r="8" fill="${skin}" />

    <!-- Head / Face -->
    <rect x="60" y="42" width="80" height="78" rx="36" fill="${skin}" />

    <!-- Cheeks Blush -->
    <ellipse cx="74" cy="93" rx="6" ry="3.5" fill="#FB7185" opacity="0.35" />
    <ellipse cx="126" cy="93" rx="6" ry="3.5" fill="#FB7185" opacity="0.35" />

    <!-- Eyes -->
    ${eyelashes}
    <circle cx="81" cy="83" r="4.5" fill="#0F172A" />
    <circle cx="119" cy="83" r="4.5" fill="#0F172A" />
    <circle cx="82.5" cy="81.5" r="1.6" fill="#FFFFFF" />
    <circle cx="120.5" cy="81.5" r="1.6" fill="#FFFFFF" />

    <!-- Nose -->
    <path d="M100 84 L98 93 L102 94" stroke="#C28E66" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Smile -->
    ${mouth}

    <!-- Glasses if applicable -->
    ${glassesSvg}

    <!-- Front Hair -->
    ${gender === 'female' ? femaleFrontHair : maleHair}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
