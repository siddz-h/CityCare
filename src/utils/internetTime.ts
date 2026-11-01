import { useState, useEffect } from 'react';

export interface LiveISTClock {
  now: Date;
  todayStr: string; // YYYY-MM-DD in Asia/Kolkata
  tomorrowStr: string; // YYYY-MM-DD in Asia/Kolkata
  time12h: string; // e.g. "08:24:15 PM"
  timeShort: string; // e.g. "08:24 PM"
  dateDisplay: string; // e.g. "Sat, 24 Oct 2026"
  minutesSinceMidnight: number; // 0 - 1439 in IST
  hour24: number;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  isSyncedWithInternet: boolean;
  sourceLabel: string;
}

// Offset in ms between authoritative Internet Time and browser's Date.now()
let internetTimeOffsetMs = 0;
let isInternetSynced = false;
let syncSource = 'System IST Clock';
let syncPromise: Promise<void> | null = null;

/**
 * Syncs client clock with backend /api/time (which syncs with internet time servers)
 * and falls back to WorldTimeAPI if needed.
 */
export async function syncInternetTime(): Promise<void> {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    try {
      const start = Date.now();
      const res = await fetch('/api/time');
      if (res.ok) {
        const data = await res.json();
        const rtt = (Date.now() - start) / 2;
        if (typeof data.epochMs === 'number') {
          internetTimeOffsetMs = data.epochMs + rtt - Date.now();
          isInternetSynced = true;
          syncSource = data.source || 'Live Internet Time (IST)';
          return;
        }
      }
    } catch {
      // Fallback to direct public time API if backend /api/time is unreachable
    }

    try {
      const start = Date.now();
      const res = await fetch('https://worldtimeapi.org/api/timezone/Asia/Kolkata');
      if (res.ok) {
        const data = await res.json();
        const rtt = (Date.now() - start) / 2;
        if (data.unixtime) {
          internetTimeOffsetMs = data.unixtime * 1000 + rtt - Date.now();
          isInternetSynced = true;
          syncSource = 'WorldTimeAPI (Asia/Kolkata)';
        }
      }
    } catch {
      // Keep browser clock formatted in Asia/Kolkata timezone
    }
  })();

  return syncPromise;
}

/**
 * Computes current live IST (Asia/Kolkata) clock details using the synced internet offset.
 */
export function getLiveISTClock(): LiveISTClock {
  const correctedNow = new Date(Date.now() + internetTimeOffsetMs);

  // Extract exact parts in Asia/Kolkata timezone
  const partsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = partsFormatter.formatToParts(correctedNow);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }

  const year = parseInt(map.year || '2026', 10);
  const month = parseInt(map.month || '1', 10);
  const day = parseInt(map.day || '1', 10);
  let hour24 = parseInt(map.hour || '0', 10);
  if (hour24 === 24) hour24 = 0;
  const minute = parseInt(map.minute || '0', 10);
  const second = parseInt(map.second || '0', 10);

  const todayStr = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Compute tomorrow in IST by adding 24h to midday IST
  const istMidday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  istMidday.setUTCDate(istMidday.getUTCDate() + 1);
  const tomYear = istMidday.getUTCFullYear();
  const tomMonth = String(istMidday.getUTCMonth() + 1).padStart(2, '0');
  const tomDay = String(istMidday.getUTCDate()).padStart(2, '0');
  const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`;

  const minutesSinceMidnight = hour24 * 60 + minute;

  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const time12h = `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} ${ampm}`;
  const timeShort = `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;

  const dateDisplay = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(correctedNow);

  let period: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
  if (hour24 >= 5 && hour24 < 12) period = 'morning';
  else if (hour24 >= 12 && hour24 < 17) period = 'afternoon';
  else if (hour24 >= 17 && hour24 < 22) period = 'evening';
  else period = 'night';

  return {
    now: correctedNow,
    todayStr,
    tomorrowStr,
    time12h,
    timeShort,
    dateDisplay,
    minutesSinceMidnight,
    hour24,
    period,
    isSyncedWithInternet: isInternetSynced,
    sourceLabel: syncSource,
  };
}

/**
 * Generates an array of upcoming N dates starting from Today in IST.
 */
export function getUpcomingISTDates(daysCount = 7, clock = getLiveISTClock()) {
  const [y, m, d] = clock.todayStr.split('-').map((n) => parseInt(n, 10));
  const baseUTC = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  return Array.from({ length: daysCount }, (_, i) => {
    const dt = new Date(baseUTC);
    dt.setUTCDate(baseUTC.getUTCDate() + i);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayName = dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    const monthDay = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

    return {
      dateStr,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${dayName}, ${monthDay}`,
      dayOfWeek: dayName,
      monthDay,
    };
  });
}

/**
 * Parses a 12-hour slot string like "09:00 AM", "02:30 PM", "08:30 PM" into minutes since midnight (0..1439).
 */
export function parseSlotToMinutes(slot: string): number {
  const cleaned = (slot || '').trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const mer = match[3];
  if (mer === 'PM' && hours < 12) hours += 12;
  if (mer === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
}

/**
 * Checks whether a given appointment date + time slot has already passed in live IST time.
 */
export function isSlotPastInIST(
  appointmentDate: string,
  slot: string,
  clock: LiveISTClock = getLiveISTClock()
): boolean {
  if (!appointmentDate || !slot) return false;
  if (appointmentDate < clock.todayStr) return true;
  if (appointmentDate > clock.todayStr) return false;

  const slotMins = parseSlotToMinutes(slot);
  // A slot on today's date is considered past if its start time is <= current live time
  return slotMins <= clock.minutesSinceMidnight;
}

/**
 * Standard full-day OPD slots (Morning, Afternoon, and Evening OPD) so evening users can still book remaining evening slots today.
 */
export const FULL_DAY_OPD_SLOTS = [
  '09:00 AM',
  '10:30 AM',
  '12:00 PM',
  '02:00 PM',
  '04:00 PM',
  '05:30 PM',
  '07:00 PM',
  '08:30 PM',
  '09:30 PM',
];

/**
 * React hook that returns a live-ticking IST clock synced with Internet time.
 */
export function useInternetTime(tickIntervalMs = 1000): LiveISTClock {
  const [clock, setClock] = useState<LiveISTClock>(() => getLiveISTClock());

  useEffect(() => {
    let mounted = true;
    syncInternetTime().then(() => {
      if (mounted) setClock(getLiveISTClock());
    });

    const timer = setInterval(() => {
      if (mounted) {
        setClock(getLiveISTClock());
      }
    }, tickIntervalMs);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [tickIntervalMs]);

  return clock;
}
