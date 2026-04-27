/**
 * 30 dakikalık slot bitmask yardımcı fonksiyonları.
 *
 * Günün 00:00–23:30 arasında 48 slot'a bölünür.
 * Her slot bir bit ile temsil edilir; bit N → günün başından N*30. dakika.
 *
 * Örnek: 09:00–12:00 arası bloke etmek için bit 18–23 set edilir.
 *   maskForRange(09*60, 12*60) === 0b000000000000000000111111000000000000000000000000n
 */

export const SLOT_DURATION_MINUTES = 30;
export const SLOTS_PER_DAY = 48; // 24 saat × 2

/** Saat + dakikayı slot indeksine çevirir. */
export function timeToSlot(hours: number, minutes: number): number {
  return Math.floor((hours * 60 + minutes) / SLOT_DURATION_MINUTES);
}

/** Slot indeksini dakikaya (gece yarısından itibaren) çevirir. */
export function slotToMinutes(slot: number): number {
  return slot * SLOT_DURATION_MINUTES;
}

/** [startMinutes, endMinutes) aralığı için bitmask oluşturur. */
export function buildRangeMask(startMinutes: number, endMinutes: number): bigint {
  const startSlot = Math.floor(startMinutes / SLOT_DURATION_MINUTES);
  const endSlot = Math.ceil(endMinutes / SLOT_DURATION_MINUTES);
  let mask = 0n;
  for (let s = startSlot; s < endSlot && s < SLOTS_PER_DAY; s++) {
    mask |= 1n << BigInt(s);
  }
  return mask;
}

/** Date nesnelerinden bitmask oluşturur (aynı gün içinde olmalı). */
export function buildMaskFromDates(startTime: Date, endTime: Date): bigint {
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
  return buildRangeMask(startMinutes, endMinutes);
}

/** Saat (tam saat) için bitmask oluşturur: saat H → H:00–H:59 arası 2 slot. */
export function buildHourMask(hour: number): bigint {
  return buildRangeMask(hour * 60, (hour + 1) * 60);
}

/** İki mask'ın çakışıp çakışmadığını döner. */
export function masksOverlap(mask1: bigint, mask2: bigint): boolean {
  return (mask1 & mask2) !== 0n;
}

/** Mask'taki bloke edilmiş tam saatleri döner (herhangi bir slotu bloke ise dahil). */
export function maskToBlockedHours(mask: bigint): number[] {
  const hours = new Set<number>();
  for (let slot = 0; slot < SLOTS_PER_DAY; slot++) {
    if ((mask >> BigInt(slot)) & 1n) {
      hours.add(Math.floor(slotToMinutes(slot) / 60));
    }
  }
  return Array.from(hours).sort((a, b) => a - b);
}

/** Mask'ı ardışık zaman aralıklarına çözer: [{ startTime, endTime, ... }] */
export function maskToTimeRanges(mask: bigint): { startTime: string; endTime: string }[] {
  const ranges: { startTime: string; endTime: string }[] = [];
  let inRange = false;
  let rangeStart = 0;

  for (let slot = 0; slot <= SLOTS_PER_DAY; slot++) {
    const isSet = slot < SLOTS_PER_DAY && ((mask >> BigInt(slot)) & 1n) === 1n;
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

/** DB'den gelen bigint string'i BigInt'e çevirir. */
export function parseMask(value: string | bigint | number | null | undefined): bigint {
  if (value === null || value === undefined) return 0n;
  return BigInt(value);
}

/** BigInt mask'ı DB'ye yazılacak string'e çevirir. */
export function serializeMask(mask: bigint): string {
  return mask.toString();
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
