export type Tone =
  | 'amber'
  | 'emerald'
  | 'sky'
  | 'violet'
  | 'fuchsia'
  | 'purple'
  | 'lime'
  | 'cyan'
  | 'orange'
  | 'red'
  | 'neutral';

export type TagKey =
  | 'rwa'
  | 'stablecoin'
  | 'lst'
  | 'pendle'
  | 'exponent'
  | 'spectra'
  | 'savings'
  | 'oft'
  | 'native'
  | 'receipt'
  | 'permit'
  | 'flagged';

export interface Tag {
  key: TagKey;
  label: string;
  tone: Tone;
}

/** The categories exposed in the "Type" filter, in display order. */
export const TAG_FILTERS: { key: TagKey; label: string; tone: Tone }[] = [
  { key: 'rwa', label: 'RWA', tone: 'amber' },
  { key: 'stablecoin', label: 'Stablecoin', tone: 'emerald' },
  { key: 'lst', label: 'LST / LRT', tone: 'sky' },
  { key: 'pendle', label: 'Pendle', tone: 'violet' },
  { key: 'exponent', label: 'Exponent', tone: 'fuchsia' },
  { key: 'spectra', label: 'Spectra', tone: 'purple' },
  { key: 'savings', label: 'Savings', tone: 'lime' },
  { key: 'oft', label: 'OFT', tone: 'cyan' },
  { key: 'native', label: 'Native', tone: 'neutral' },
  { key: 'receipt', label: 'Receipt', tone: 'orange' },
  { key: 'permit', label: 'Permit', tone: 'neutral' },
  { key: 'flagged', label: 'Flagged', tone: 'red' }
];

// literal class strings so Tailwind's scanner picks them up
export const TONE_CLASSES: Record<Tone, string> = {
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  sky: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  fuchsia: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
  purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  lime: 'bg-lime-500/10 text-lime-700 dark:text-lime-300',
  cyan: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  neutral: 'bg-[var(--overlay-6)] text-[var(--color-muted)]'
};

export const TONE_DOT: Record<Tone, string> = {
  amber: 'bg-amber-400',
  emerald: 'bg-emerald-400',
  sky: 'bg-sky-400',
  violet: 'bg-violet-400',
  fuchsia: 'bg-fuchsia-400',
  purple: 'bg-purple-400',
  lime: 'bg-lime-400',
  cyan: 'bg-cyan-400',
  orange: 'bg-orange-400',
  red: 'bg-red-400',
  neutral: 'bg-[var(--color-muted)]'
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// pendle/exponent/spectra carry a unix expiry (seconds, occasionally ms)
const formatExpiry = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '';
  const ms = value > 1e12 ? value : value * 1000;
  return new Date(ms).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
};

const yieldLabel = (protocol: string, p: any) => {
  const expiry = formatExpiry(p?.expiry ?? p?.maturity);
  const type = p?.tokenType ? ` ${p.tokenType}` : '';
  return `${protocol}${type}${expiry ? ` · ${expiry}` : ''}`;
};

/** Human-readable tags for one currency entry, derived from its `props`. */
export function getCurrencyTags(currency: any): Tag[] {
  const p = currency?.props ?? {};
  const tags: Tag[] = [];

  if (p.rwa)
    tags.push({
      key: 'rwa',
      label: p.rwa.type ? `RWA · ${cap(p.rwa.type)}` : 'RWA',
      tone: 'amber'
    });
  if (p.stablecoin)
    tags.push({
      key: 'stablecoin',
      label: p.stablecoin.base ? `Stable · ${p.stablecoin.base}` : 'Stablecoin',
      tone: 'emerald'
    });
  if (p.lst) {
    const kind = p.lst.type === 'restaking' ? 'LRT' : 'LST';
    tags.push({ key: 'lst', label: p.lst.asset ? `${kind} · ${p.lst.asset}` : kind, tone: 'sky' });
  }
  if (p.pendle) tags.push({ key: 'pendle', label: yieldLabel('Pendle', p.pendle), tone: 'violet' });
  if (p.exponent)
    tags.push({ key: 'exponent', label: yieldLabel('Exponent', p.exponent), tone: 'fuchsia' });
  if (p.spectra)
    tags.push({ key: 'spectra', label: yieldLabel('Spectra', p.spectra), tone: 'purple' });
  if (p.savings)
    tags.push({
      key: 'savings',
      label: p.savings.base ? `Savings · ${p.savings.base}` : 'Savings',
      tone: 'lime'
    });
  if (p.oft) tags.push({ key: 'oft', label: 'OFT', tone: 'cyan' });
  if (p.isNative) tags.push({ key: 'native', label: 'Native', tone: 'neutral' });
  else if (p.wnative) tags.push({ key: 'native', label: 'Wrapped native', tone: 'neutral' });
  if (p.receipt)
    tags.push({
      key: 'receipt',
      label: p.receipt.protocol ? `Receipt · ${p.receipt.protocol}` : 'Receipt',
      tone: 'orange'
    });
  if (p.permit) tags.push({ key: 'permit', label: 'Permit', tone: 'neutral' });
  if (p.mimic) tags.push({ key: 'flagged', label: 'Mimic', tone: 'red' });
  else if (p.suspicious) tags.push({ key: 'flagged', label: 'Suspicious', tone: 'red' });
  else if (p.risk?.category === 'COMPROMISED')
    tags.push({ key: 'flagged', label: 'Compromised', tone: 'red' });

  return tags;
}
