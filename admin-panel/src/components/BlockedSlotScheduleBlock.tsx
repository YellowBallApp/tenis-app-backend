import { useId, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { HiCalendar, HiClock } from 'react-icons/hi';
import type { NormalizedBlockedSlot } from '../utils/timeSlotMask';

type Props = {
  slot: NormalizedBlockedSlot;
  /** Tablo hücresi: daha sıkı tipografi, dar alan */
  compact?: boolean;
};

function formatTurkishDate(yyyyMmDd: string): string {
  return new Date(`${yyyyMmDd}T12:00:00`).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Bloke satırı: tarih + tek/çoklu aralık. Çoklu aralıklarda açılır alt kart.
 */
export function BlockedSlotScheduleBlock({ slot, compact = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const headId = useId();
  const panelId = `${headId}-panel`;
  const ranges = slot.timeRanges;
  const dateStr = slot.date;

  const dateLabel = dateStr ? formatTurkishDate(dateStr) : null;
  const textSm = compact ? 'text-xs' : 'text-sm';
  const titleSm = compact ? 'text-[11px]' : 'text-xs';
  const pad = compact ? 'p-2' : 'p-3';

  if (slot.timeRangeLabel && ranges.length === 0) {
    return (
      <div
        className={`rounded-lg border border-amber-500/25 bg-amber-950/20 ${pad} ${textSm} text-amber-100/90`}
      >
        {slot.timeRangeLabel}
      </div>
    );
  }

  if (ranges.length === 0) {
    return (
      <div className={`rounded-lg border border-white/10 bg-slate-800/30 ${pad} ${textSm} text-soft-white/60`}>
        Saat aralığı yok
      </div>
    );
  }

  if (ranges.length === 1) {
    const r = ranges[0]!;
    return (
      <div className="space-y-2">
        {dateLabel && (
          <div className={`glass rounded-lg ${pad}`}>
            <div
              className={`flex items-center gap-1.5 text-soft-white/50 ${titleSm} mb-1 font-medium uppercase tracking-wide`}
            >
              <HiCalendar className="shrink-0 opacity-80" />
              Tarih
            </div>
            <p
              className={`text-soft-white font-medium capitalize ${
                compact ? 'text-xs leading-snug' : 'text-sm md:text-base'
              }`}
            >
              {dateLabel}
            </p>
          </div>
        )}
        <div
          className={`glass rounded-lg border border-emerald-500/20 ${pad}`}
        >
          <div
            className={`flex items-center gap-1.5 text-emerald-200/70 ${titleSm} mb-1 font-medium uppercase tracking-wide`}
          >
            <HiClock className="shrink-0" />
            Bloke süresi
          </div>
          <p
            className={`text-soft-white font-semibold font-mono tracking-tight ${
              compact ? 'text-sm' : 'text-base md:text-lg'
            }`}
          >
            {r.startTime} – {r.endTime}
          </p>
        </div>
      </div>
    );
  }

  // Çoklu aralık: özet + açılır detay
  return (
    <div className="space-y-2">
      {dateLabel && (
        <div className={`glass rounded-lg ${pad}`}>
          <div
            className={`flex items-center gap-1.5 text-soft-white/50 ${titleSm} mb-1 font-medium uppercase tracking-wide`}
          >
            <HiCalendar className="shrink-0 opacity-80" />
            Tarih
          </div>
          <p
            className={`text-soft-white font-medium capitalize ${
              compact ? 'text-xs' : 'text-sm md:text-base'
            }`}
          >
            {dateLabel}
          </p>
        </div>
      )}

      <div
        className={`rounded-xl border border-white/10 bg-slate-800/50 overflow-hidden ${
          compact ? 'shadow-sm' : ''
        }`}
      >
        <button
          type="button"
          id={headId}
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={
            expanded
              ? 'Bloke saat aralıklarını gizle'
              : 'Bloke saat aralıklarını göster'
          }
          onClick={() => setExpanded((v) => !v)}
          className={`w-full flex items-start sm:items-center justify-between gap-2 text-left hover:bg-white/[0.04] transition-colors ${
            compact ? 'px-2 py-2' : 'px-3 py-3'
          }`}
        >
          <div className="min-w-0 flex-1">
            <p
              className={`text-soft-white/90 font-medium ${
                compact ? 'text-xs' : 'text-sm'
              }`}
            >
              Bloke saat aralıkları
            </p>
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-emerald-400/90 mt-0.5" aria-hidden />
          ) : (
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-soft-white/50 mt-0.5" aria-hidden />
          )}
        </button>

        {expanded && (
          <ul
            id={panelId}
            role="region"
            aria-labelledby={headId}
            className={`${compact ? 'px-2 py-2' : 'px-3 py-2'} border-t border-white/5 space-y-1.5 max-h-[min(50vh,14rem)] overflow-y-auto overscroll-contain`}
          >
            {ranges.map((r, i) => (
              <li
                key={`${r.startTime}-${r.endTime}-${i}`}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-lg bg-slate-900/60 px-2.5 py-2 sm:px-3 border border-white/[0.06]"
              >
                <span className="text-[10px] sm:text-xs text-soft-white/40 shrink-0">#{i + 1}</span>
                <span
                  className={`font-mono text-soft-white font-medium tabular-nums ${
                    compact ? 'text-xs' : 'text-sm'
                  }`}
                >
                  {r.startTime} – {r.endTime}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
