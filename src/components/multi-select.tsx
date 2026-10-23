import type { ReactNode } from 'react';

import { useEffect, useRef, useState } from 'react';

import { Check, ChevronDown, Search } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface Props {
  label: string;
  options: Option[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  searchable?: boolean;
  emptyLabel?: string;
}

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  searchable = false,
  emptyLabel = 'All'
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
    : options;
  const selectedOptions = options.filter((o) => selected.has(o.value));

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        aria-haspopup='listbox'
        aria-expanded={open}
        className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-all duration-200 ${
          selected.size
            ? 'border-indigo-500/40 bg-indigo-500/10 text-[var(--card-text)]'
            : 'border-[var(--border)] bg-[var(--overlay-4)] text-[var(--color)] hover:border-[var(--border-hover)]'
        }`}
      >
        <span className='text-[var(--color-muted)]'>{label}</span>
        {selected.size ? (
          <span className='flex items-center gap-1.5'>
            <span className='flex -space-x-1'>
              {selectedOptions.slice(0, 3).map((o) =>
                o.icon ? (
                  <span key={o.value} className='rounded-full ring-2 ring-[var(--secondary)]'>
                    {o.icon}
                  </span>
                ) : null
              )}
            </span>
            <span className='font-medium'>
              {selected.size === 1 ? selectedOptions[0]?.label : selected.size}
            </span>
          </span>
        ) : (
          <span className='font-medium'>{emptyLabel}</span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--color-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className='absolute left-0 z-30 mt-1.5 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--secondary)] shadow-xl shadow-black/10 dark:shadow-black/40'
          style={{ animation: 'fadeInUp 0.15s ease-out both' }}
        >
          {searchable && (
            <div className='relative border-b border-[var(--border)] p-2'>
              <Search className='absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted)]' />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className='w-full rounded-lg bg-[var(--overlay-4)] py-2 pl-8 pr-3 text-xs text-[var(--color)] placeholder-[var(--color-muted)] outline-none focus:bg-[var(--overlay-6)]'
              />
            </div>
          )}

          <div className='flex items-center justify-between px-3 py-1.5 text-[11px] text-[var(--color-muted)]'>
            <span>
              {selected.size ? `${selected.size} selected` : `${options.length} available`}
            </span>
            <button
              type='button'
              onClick={() => onChange(new Set())}
              disabled={!selected.size}
              className='font-medium text-indigo-500 hover:text-indigo-400 disabled:opacity-40'
            >
              Clear
            </button>
          </div>

          <ul role='listbox' aria-multiselectable className='max-h-72 overflow-y-auto p-1'>
            {visible.map((o) => {
              const active = selected.has(o.value);
              return (
                <li key={o.value}>
                  <button
                    type='button'
                    role='option'
                    aria-selected={active}
                    onClick={() => toggle(o.value)}
                    className='flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--overlay-6)]'
                  >
                    <span
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                        active
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-[var(--border-hover)]'
                      }`}
                    >
                      {active && <Check className='h-3 w-3' strokeWidth={3} />}
                    </span>
                    {o.icon}
                    <span className='min-w-0 flex-1 truncate text-[var(--card-text)]'>
                      {o.label}
                    </span>
                    {o.count !== undefined && (
                      <span className='font-mono text-[11px] tabular-nums text-[var(--color-muted)]'>
                        {o.count.toLocaleString()}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
            {visible.length === 0 && (
              <li className='px-3 py-6 text-center text-xs text-[var(--color-muted)]'>
                No matches
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
