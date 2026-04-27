const TIMEZONE = 'Europe/Istanbul';

/**
 * RESTRICTED kullanıcıların rezervasyon yapabildiği saatler:
 * - Hafta içi: 09:00-18:00
 * - Hafta sonu: 18:00-24:00
 * Bu saatlerin dışı "kısıtlı saat"tir; full user bile olsa RESTRICTED kullanıcıyı bu saatte participant olarak ekleyemez.
 */
export function isSlotAllowedForRestrictedUser(startTime: Date): boolean {
  const hourFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    hour12: false,
  });
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'short',
  });

  const hourParts = hourFormatter.formatToParts(startTime);
  const weekdayParts = weekdayFormatter.formatToParts(startTime);
  const hour = parseInt(hourParts.find((p) => p.type === 'hour')?.value || '0', 10);
  const weekday = weekdayParts.find((p) => p.type === 'weekday')?.value || '';

  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  if (isWeekend) {
    return hour >= 18 && hour < 24;
  }
  return hour >= 9 && hour < 18;
}
