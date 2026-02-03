const TIMEZONE = 'Europe/Istanbul';

/**
 * RESTRICTED kullanıcıların rezervasyon yapabildiği saatler (backend ile aynı):
 * - Hafta içi: 09:00-18:00
 * - Hafta sonu: 18:00-24:00
 * dateStr: YYYY-MM-DD, timeStr: HH:mm veya HH:00
 */
export function isSlotAllowedForRestrictedUser(dateStr: string, timeStr: string): boolean {
  if (!dateStr || !timeStr) return true;
  const normalized = timeStr.includes(':') ? timeStr.slice(0, 5) : timeStr.slice(0, 2) + ':00';
  const hour = parseInt(normalized.split(':')[0] || '0', 10);
  const d = new Date(dateStr + 'T' + normalized + ':00+03:00');
  if (isNaN(d.getTime())) return true;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'short',
  });
  const weekday = formatter.formatToParts(d).find((p) => p.type === 'weekday')?.value || '';
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  if (isWeekend) return hour >= 18 && hour < 24;
  return hour >= 9 && hour < 18;
}
