'use client';

import * as React from 'react';
import { Popover, PopoverTrigger, PopoverContent, Button } from '@heroui/react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import 'react-day-picker/dist/style.css';

type Props = {
  value?: { start: string | null; end: string | null };
  onChange?: (start: string | null, end: string | null) => void;
  onApply?: (start: string | null, end: string | null) => void;
  className?: string;
  buttonClassName?: string;
};

const toISO = (d: Date | null | undefined) =>
  d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10) : null;

const fromISO = (s?: string | null) => (s ? new Date(s + 'T00:00:00') : undefined);

const labelFor = (start: string | null, end: string | null) => {
  if (start && end) return `${format(new Date(start), 'MMM d, yyyy')} – ${format(new Date(end), 'MMM d, yyyy')}`;
  if (start) return format(new Date(start), 'MMM d, yyyy');
  return 'Select range';
};

type PresetKey = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';

export default function RangeCalendar({
  value,
  onChange,
  onApply,
  className,
  buttonClassName,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [preset, setPreset] = React.useState<PresetKey>('custom');

  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(() => ({
    from: fromISO(value?.start ?? null),
    to: fromISO(value?.end ?? null),
  }));

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setPreset('custom');
      setTempRange({
        from: fromISO(value?.start ?? null),
        to: fromISO(value?.end ?? null),
      });
    }
  };

  const apply = () => {
    const start = toISO(tempRange?.from ?? null);
    const end = toISO(tempRange?.to ?? null);
    onChange?.(start, end);
    onApply?.(start, end);
    setOpen(false);
  };

  const cancel = () => {
    setTempRange({
      from: fromISO(value?.start ?? null),
      to: fromISO(value?.end ?? null),
    });
    setPreset('custom');
    setOpen(false);
  };

  const setByPreset = (key: PresetKey) => {
    setPreset(key);
    const today = new Date();
    if (key === 'today') return setTempRange({ from: today, to: today });
    if (key === 'yesterday') {
      const y = subDays(today, 1);
      return setTempRange({ from: y, to: y });
    }
    if (key === 'last7') return setTempRange({ from: subDays(today, 6), to: today });
    if (key === 'last30') return setTempRange({ from: subDays(today, 29), to: today });
    if (key === 'thisMonth') return setTempRange({ from: startOfMonth(today), to: endOfMonth(today) });
    if (key === 'lastMonth') {
      const last = subMonths(today, 1);
      return setTempRange({ from: startOfMonth(last), to: endOfMonth(last) });
    }
  };

  const displayLabel = labelFor(value?.start ?? null, value?.end ?? null);

  return (
    <div className={className}>
      <Popover isOpen={open} onOpenChange={handleOpenChange} placement="bottom-start">
        <PopoverTrigger>
          <Button variant="bordered" className={`rounded-xl text-sm font-semibold gap-2 ${buttonClassName ?? ''}`}>
            <span className="inline-flex size-5 items-center justify-center rounded-md bg-primary/10">
              <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80">
                <path fill="currentColor" d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v3H3V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1m14 9H3v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" />
              </svg>
            </span>
            {displayLabel}
          </Button>
        </PopoverTrigger>

        {/* bg-content1 + text-foreground ensure good contrast in dark mode */}
        <PopoverContent className="w-[760px] p-0 overflow-hidden bg-content1 text-foreground shadow-xl z-[9999]">
          <div className="flex min-h-[360px]">
            {/* Presets */}
            <div className="w-48 border-r border-default p-2">
              {[
                { key: 'today', label: 'Today' },
                { key: 'yesterday', label: 'Yesterday' },
                { key: 'last7', label: 'Last 7 Days' },
                { key: 'last30', label: 'Last 30 Days' },
                { key: 'thisMonth', label: 'This Month' },
                { key: 'lastMonth', label: 'Last Month' },
                { key: 'custom', label: 'Custom Range' },
              ].map((it) => (
                <button
                  key={it.key}
                  onClick={() => setByPreset(it.key as PresetKey)}
                  className={`block w-full text-left rounded-lg px-3 py-2 text-sm ${
                    preset === it.key ? 'bg-primary text-primary-foreground' : 'hover:bg-default-100'
                  }`}
                >
                  {it.label}
                </button>
              ))}
            </div>

            {/* Calendars */}
            <div className="flex-1 p-3">
              <DayPicker
                mode="range"
                weekStartsOn={0}
                numberOfMonths={2}
                selected={tempRange}
                onSelect={(r) => {
                  if (r?.from && r?.to && r.from > r.to) setTempRange({ from: r.to, to: r.from });
                  else setTempRange(r);
                  setPreset('custom');
                }}
                captionLayout="buttons"
                pagedNavigation
                styles={{
                  // —— These style overrides make it readable on dark backgrounds
                  root: { background: 'transparent', color: 'var(--nextui-colors-foreground)' },
                  caption: { color: 'var(--nextui-colors-foreground)' },
                  caption_label: { fontWeight: 600 },
                  head: { color: 'var(--nextui-colors-foreground-500)' },
                  head_cell: { color: 'var(--nextui-colors-foreground-500)', fontSize: 12 },
                  day: { color: 'var(--nextui-colors-foreground)' },
                  nav_button: { color: 'var(--nextui-colors-foreground)' },
                  day_selected: { background: '#3b82f6', color: 'white' },
                  day_range_start: { background: '#3b82f6', color: 'white' },
                  day_range_end: { background: '#3b82f6', color: 'white' },
                  day_range_middle: { background: 'rgba(59,130,246,.15)' },
                }}
              />

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-default pt-3">
                <div className="text-xs text-foreground-500">
                  {tempRange?.from ? format(tempRange.from, 'MMM d, yyyy') : '—'} –{' '}
                  {tempRange?.to ? format(tempRange.to, 'MMM d, yyyy') : '—'}
                </div>
                <div className="flex gap-2">
                  <Button variant="bordered" radius="full" onPress={cancel}>
                    Cancel
                  </Button>
                  <Button color="primary" radius="full" onPress={apply} isDisabled={!tempRange?.from || !tempRange?.to}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
