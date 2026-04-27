/**
 * Backend `timeSlotMask.utils` ile uyumlu: 48 slot (30 dk), bigInt mask string.
 * blocked_time_slots API: `date` + `busyMask` → başlangıç/bitiş gösterimi.
 */

export const SLOT_DURATION_MINUTES = 30;
const SLOTS_PER_DAY = 48;

function slotToMinutes(slot: number): number {
  return slot * SLOT_DURATION_MINUTES;
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function parseMask(value: string | bigint | number | null | undefined): bigint {
  if (value === null || value === undefined) return 0n;
  return BigInt(String(value));
}

/**
 * Bit mask'ındaki ardışık aralıklar: endTime, son slotun bitişi (dakika).
 * Backend maskToTimeRanges ile aynı.
 */
export function maskToTimeRanges(mask: bigint): { startTime: string; endTime: string }[] {
  const ranges: { startTime: string; endTime: string }[] = [];
  let inRange = false;
  let rangeStart = 0;

  for (let slot = 0; slot <= SLOTS_PER_DAY; slot++) {
    const isSet =
      slot < SLOTS_PER_DAY && (mask >> BigInt(slot) & 1n) === 1n;
    if (isSet && !inRange) {
      inRange = true;
      rangeStart = slot;
    } else if (!isSet && inRange) {
      inRange = false;
      ranges.push({
        startTime: minutesToTimeString(slotToMinutes(rangeStart)),
        endTime: minutesToTimeString(slotToMinutes(slot)),
      });
    }
  }
  return ranges;
}

function dateOnly(date: string | Date | undefined): string | null {
  if (date == null) return null;
  if (typeof date === 'string') return date.split('T')[0] ?? null;
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD + HH:mm → tarayıcıda local parse (timezone sorunu olmaması için T ile birleşik) */
function combineDateAndWallTime(dateStr: string, hhmm: string): string {
  return `${dateStr}T${hhmm}:00`;
}

function toHHmm(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export type ApiBlockedTimeSlot = {
  id: number;
  court: { id: number; name: string };
  date?: string | Date;
  busyMask?: string;
  startTime?: string;
  endTime?: string;
  reason?: string | null;
  isActive: boolean;
  blockedBy?: unknown;
};

export type TimeRange = { startTime: string; endTime: string };

export type NormalizedBlockedSlot = {
  id: number;
  court: { id: number; name: string };
  startTime: string;
  endTime: string;
  reason?: string;
  isActive: boolean;
  /** Mask veya start/end’den türetilen aralıklar (UI) */
  timeRanges: TimeRange[];
  date?: string;
  busyMask?: string;
  /** Eski/edge: sadece metin (mask=0) */
  timeRangeLabel?: string;
};

/**
 * API satırını liste/form için startTime / endTime (ISO kalıbında) ile normalize eder.
 * Eski API startTime/endTime veriyorsa aynen geçirir.
 */
export function normalizeBlockedSlotFromApi(row: ApiBlockedTimeSlot): NormalizedBlockedSlot {
  if (row.startTime && row.endTime) {
    const s = new Date(row.startTime);
    const e = new Date(row.endTime);
    const dStr = dateOnly(s) || dateOnly(row.date) || undefined;
    return {
      id: row.id,
      court: row.court,
      startTime: row.startTime,
      endTime: row.endTime,
      reason: row.reason ?? undefined,
      isActive: row.isActive,
      timeRanges: [{ startTime: toHHmm(s), endTime: toHHmm(e) }],
      date: dStr,
    };
  }

  const dateStr = dateOnly(row.date);
  if (!dateStr) {
    const fallback = new Date().toISOString();
    return {
      id: row.id,
      court: row.court,
      startTime: fallback,
      endTime: fallback,
      reason: row.reason ?? undefined,
      isActive: row.isActive,
      timeRanges: [],
    };
  }

  const ranges = maskToTimeRanges(parseMask(row.busyMask));
  if (ranges.length === 0) {
    const mid = combineDateAndWallTime(dateStr, '12:00');
    return {
      id: row.id,
      court: row.court,
      startTime: mid,
      endTime: mid,
      reason: row.reason ?? undefined,
      isActive: row.isActive,
      timeRanges: [],
      timeRangeLabel: 'Bloke aralığı yok (mask=0)',
      date: dateStr,
      busyMask: row.busyMask,
    };
  }

  const first = ranges[0]!;
  const last = ranges[ranges.length - 1]!;

  return {
    id: row.id,
    court: row.court,
    startTime: combineDateAndWallTime(dateStr, first.startTime),
    endTime: combineDateAndWallTime(dateStr, last.endTime),
    reason: row.reason ?? undefined,
    isActive: row.isActive,
    timeRanges: ranges,
    date: dateStr,
    busyMask: row.busyMask,
  };
}

export function normalizeBlockedSlotsFromApi(rows: ApiBlockedTimeSlot[]): NormalizedBlockedSlot[] {
  return rows.map(normalizeBlockedSlotFromApi);
}
