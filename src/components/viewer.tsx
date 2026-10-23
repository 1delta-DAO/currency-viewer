import type { TagKey } from '../lib/tags';

import { useEffect, useMemo, useState } from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Github,
  Link as LinkIcon,
  Loader2,
  Moon,
  Search,
  Sun,
  X
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import Image1D from '../assets/images/1delta_dark.svg';
import { getCurrencyTags, TAG_FILTERS, TONE_DOT } from '../lib/tags';
import Button from './button';
import Card from './card';
import ChainLogo from './chain-logo';
import MultiSelect from './multi-select';

const DEFAULT_URL = 'https://raw.githubusercontent.com/1delta-DAO/token-lists/main/omni-list.json';
const CHAINS_URL = 'https://raw.githubusercontent.com/1delta-DAO/chains/main/data.json';
const SOLANA_URL = 'https://raw.githubusercontent.com/1delta-DAO/token-lists/main/solana.json';

const PAGE_SIZE = 8;

// Solana is published as its own chain list (the omni list only covers EVM/Fuel);
// each token carries the omni `assetGroup` it belongs to, so we fold it in here.
const mergeSolana = (omni: Record<string, any>, solanaList: Record<string, any>) => {
  const merged = { ...omni };
  for (const { assetGroup, currencyId, ...currency } of Object.values(solanaList)) {
    const groupId = assetGroup ?? currencyId ?? currency.address;
    const group = merged[groupId];
    merged[groupId] = group
      ? { ...group, currencies: [...group.currencies, currency] }
      : {
          id: groupId,
          name: currency.name,
          symbol: currency.symbol,
          logoURI: currency.logoURI,
          currencies: [currency]
        };
  }
  return merged;
};

interface IndexedGroup {
  group: any;
  name: string;
  symbol: string;
  chains: Set<string>;
  tags: Set<TagKey>;
}

// precomputed once per data load so filtering 40k groups stays cheap
const indexGroups = (data: Record<string, any>): IndexedGroup[] =>
  Object.values(data).map((group: any) => {
    const chains = new Set<string>();
    const tags = new Set<TagKey>();
    for (const currency of group?.currencies ?? []) {
      chains.add(String(currency.chainId));
      for (const tag of getCurrencyTags(currency)) tags.add(tag.key);
    }
    return {
      group,
      name: String(group?.name ?? '').toLowerCase(),
      symbol: String(group?.symbol ?? '').toLowerCase(),
      chains,
      tags
    };
  });

const parseList = (value: string | null) => new Set((value ?? '').split(',').filter(Boolean));

const intersects = (a: Set<string>, b: Set<string>) => {
  for (const x of a) if (b.has(x)) return true;
  return false;
};

function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, () => setDark((d) => !d)] as const;
}

const iconButton =
  'rounded-lg p-2 text-[var(--color-muted)] transition-all duration-200 hover:bg-[var(--overlay-6)] hover:text-[var(--card-text)] disabled:pointer-events-none disabled:opacity-30';

function Pagination({
  page,
  pageCount,
  onChange
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className='flex items-center gap-0.5'>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className={iconButton}
        aria-label='Previous page'
      >
        <ChevronLeft className='h-4 w-4' />
      </button>
      <span className='min-w-[4.5rem] text-center font-mono text-xs tabular-nums text-[var(--color-muted)]'>
        {page + 1}
        <span className='mx-1 opacity-40'>/</span>
        {pageCount}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount - 1}
        className={iconButton}
        aria-label='Next page'
      >
        <ChevronRight className='h-4 w-4' />
      </button>
    </div>
  );
}

function FilterChip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className='inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 py-0.5 pl-2.5 pr-1 text-xs text-[var(--card-text)]'>
      {children}
      <button
        onClick={onRemove}
        className='rounded-full p-0.5 text-[var(--color-muted)] hover:bg-indigo-500/20 hover:text-[var(--card-text)]'
        aria-label='Remove filter'
      >
        <X className='h-3 w-3' />
      </button>
    </span>
  );
}

export default function OmniCurrencyViewer() {
  const [data, setData] = useState<Record<string, any>>({});
  const [chainData, setChainData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [urlOpen, setUrlOpen] = useState(false);
  const [fetchUrl, setFetchUrl] = useState(DEFAULT_URL);
  const [dark, toggleTheme] = useTheme();

  // filter state lives in the URL so a view can be shared
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const page = Math.max(0, Number(params.get('p')) || 0);
  const selectedChains = useMemo(() => parseList(params.get('chains')), [params]);
  const selectedTypes = useMemo(() => parseList(params.get('types')), [params]);

  const updateParams = (patch: Record<string, string | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true }
    );
  const setFilter = (key: 'q' | 'chains' | 'types', value: string) =>
    updateParams({ [key]: value, p: undefined });
  const setPage = (next: number) => {
    updateParams({ p: next > 0 ? String(next) : undefined });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const clearFilters = () =>
    updateParams({ q: undefined, chains: undefined, types: undefined, p: undefined });

  useEffect(() => {
    fetch(CHAINS_URL)
      .then((res) => res.json())
      .then((json: any) => setChainData(json))
      .catch((err: any) => console.error('Failed to fetch chain data', err));
  }, []);

  useEffect(() => {
    if (!fetchUrl) return;
    setLoading(true);
    setError(null);
    const solana =
      fetchUrl === DEFAULT_URL
        ? fetch(SOLANA_URL)
            .then((res) => res.json())
            .then((json: any) => json?.list ?? {})
            .catch((err: any) => {
              console.error('Failed to fetch solana list', err);
              return {};
            })
        : Promise.resolve({});
    Promise.all([fetch(fetchUrl).then((res) => res.json()), solana])
      .then(([json, solanaList]: any[]) => {
        setData(mergeSolana(json, solanaList));
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message);
        setLoading(false);
      });
  }, [fetchUrl]);

  // broadest assets first so page one is USDC/ETH-style groups, not single-chain PTs
  const indexed = useMemo(
    () =>
      indexGroups(data).sort(
        (a, b) => (b.group.currencies?.length ?? 0) - (a.group.currencies?.length ?? 0)
      ),
    [data]
  );

  const chainName = (id: string) =>
    chainData[id]?.shortName ?? chainData[id]?.name ?? (id === 'solana' ? 'Solana' : `Chain ${id}`);

  const chainOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { group } of indexed)
      for (const currency of group.currencies ?? []) {
        const id = String(currency.chainId);
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    return [...counts]
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({
        value: id,
        label: chainName(id),
        count,
        icon: <ChainLogo chainId={id} shortName={chainName(id)} size={16} />
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexed, chainData]);

  const typeOptions = useMemo(() => {
    const counts = new Map<TagKey, number>();
    for (const { tags } of indexed)
      for (const key of tags) counts.set(key, (counts.get(key) ?? 0) + 1);
    return TAG_FILTERS.filter((t) => counts.has(t.key)).map((t) => ({
      value: t.key,
      label: t.label,
      count: counts.get(t.key),
      icon: <span className={`h-2 w-2 flex-shrink-0 rounded-full ${TONE_DOT[t.tone]}`} />
    }));
  }, [indexed]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const out = indexed.filter(
      (g) =>
        (!term || g.name.includes(term) || g.symbol.includes(term)) &&
        (!selectedChains.size || intersects(g.chains, selectedChains)) &&
        (!selectedTypes.size || intersects(g.tags, selectedTypes))
    );
    if (term)
      out.sort((a, b) => {
        const aExact = a.name === term || a.symbol === term;
        const bExact = b.name === term || b.symbol === term;
        return aExact === bExact ? 0 : aExact ? -1 : 1;
      });
    return out;
  }, [indexed, search, selectedChains, selectedTypes]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageData = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const ready = !loading && !error;
  const hasFilters = Boolean(search) || selectedChains.size > 0 || selectedTypes.size > 0;
  const typeLabel = (key: string) => TAG_FILTERS.find((t) => t.key === key)?.label ?? key;

  return (
    <div className='min-h-screen'>
      <header className='sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-xl'>
        <div className='mx-auto max-w-6xl px-4 sm:px-6'>
          {/* Title row */}
          <div className='flex h-14 items-center justify-between gap-4'>
            <div className='flex min-w-0 items-center gap-3'>
              <div className='flex-shrink-0 rounded-lg bg-[var(--overlay-6)] p-1.5 ring-1 ring-[var(--ring)]'>
                <img src={Image1D} className='h-5 w-5' alt='1delta' />
              </div>
              <div className='min-w-0'>
                <h1 className='text-sm font-semibold leading-tight text-[var(--card-text)]'>
                  Asset Registry
                </h1>
                <p className='truncate text-[11px] leading-tight text-[var(--color-muted)]'>
                  {ready
                    ? `${filtered.length.toLocaleString()} of ${indexed.length.toLocaleString()} assets · ${chainOptions.length} chains`
                    : 'Loading…'}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-0.5'>
              <button
                onClick={() => setUrlOpen((o) => !o)}
                className={`${iconButton} ${urlOpen ? 'bg-[var(--overlay-6)] text-[var(--card-text)]' : ''}`}
                title='Load a custom list'
              >
                <LinkIcon className='h-4 w-4' />
              </button>
              <button
                onClick={toggleTheme}
                className={iconButton}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
              </button>
              <a
                href='https://github.com/1delta-DAO/token-lists'
                target='_blank'
                rel='noopener noreferrer'
                className={iconButton}
                title='Token lists on GitHub'
              >
                <Github className='h-4 w-4' />
              </a>
            </div>
          </div>

          {/* Custom URL row */}
          {urlOpen && (
            <div className='flex items-center gap-2 pb-3'>
              <div className='relative flex-1'>
                <LinkIcon className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted)]' />
                <input
                  autoFocus
                  placeholder='Custom JSON URL…'
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && url && setFetchUrl(url)}
                  className='h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--overlay-4)] pl-9 pr-4 font-mono text-xs text-[var(--color)] placeholder-[var(--color-muted)] outline-none transition-all duration-200 hover:border-[var(--border-hover)] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30'
                />
              </div>
              <Button variant='ghost' onClick={() => url && setFetchUrl(url)} disabled={!url}>
                Load
              </Button>
              {fetchUrl !== DEFAULT_URL && (
                <Button variant='ghost' onClick={() => setFetchUrl(DEFAULT_URL)}>
                  Reset
                </Button>
              )}
            </div>
          )}

          {/* Filter row */}
          {ready && (
            <div className='flex flex-wrap items-center gap-2 pb-3'>
              <div className='relative min-w-[12rem] flex-1'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]' />
                <input
                  placeholder='Search by name or symbol…'
                  value={search}
                  onChange={(e) => setFilter('q', e.target.value)}
                  className='h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--overlay-4)] pl-10 pr-9 text-sm text-[var(--color)] placeholder-[var(--color-muted)] outline-none transition-all duration-200 hover:border-[var(--border-hover)] focus:border-indigo-500/50 focus:bg-[var(--overlay-6)] focus:ring-1 focus:ring-indigo-500/30'
                />
                {search && (
                  <button
                    onClick={() => setFilter('q', '')}
                    className='absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--color-muted)] hover:text-[var(--card-text)]'
                    aria-label='Clear search'
                  >
                    <X className='h-3.5 w-3.5' />
                  </button>
                )}
              </div>
              <MultiSelect
                label='Chains'
                options={chainOptions}
                selected={selectedChains}
                onChange={(next) => setFilter('chains', [...next].join(','))}
                searchable
              />
              <MultiSelect
                label='Type'
                options={typeOptions}
                selected={selectedTypes}
                onChange={(next) => setFilter('types', [...next].join(','))}
              />
              <div className='ml-auto'>
                <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
              </div>
            </div>
          )}

          {/* Active filters */}
          {ready && (selectedChains.size > 0 || selectedTypes.size > 0) && (
            <div className='-mt-1 flex flex-wrap items-center gap-1.5 pb-3'>
              {[...selectedChains].map((id) => (
                <FilterChip
                  key={`c-${id}`}
                  onRemove={() => {
                    const next = new Set(selectedChains);
                    next.delete(id);
                    setFilter('chains', [...next].join(','));
                  }}
                >
                  <ChainLogo chainId={id} shortName={chainName(id)} size={14} />
                  {chainName(id)}
                </FilterChip>
              ))}
              {[...selectedTypes].map((key) => (
                <FilterChip
                  key={`t-${key}`}
                  onRemove={() => {
                    const next = new Set(selectedTypes);
                    next.delete(key);
                    setFilter('types', [...next].join(','));
                  }}
                >
                  {typeLabel(key)}
                </FilterChip>
              ))}
              <button
                onClick={clearFilters}
                className='ml-1 text-xs text-[var(--color-muted)] underline-offset-2 hover:text-[var(--card-text)] hover:underline'
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </header>

      <main className='mx-auto max-w-6xl px-4 py-6 sm:px-6'>
        {loading && (
          <div className='flex flex-col items-center justify-center py-32 text-[var(--color-muted)]'>
            <Loader2 className='mb-3 h-8 w-8 animate-spin text-indigo-400' />
            <p className='text-sm'>Loading assets…</p>
          </div>
        )}

        {error && (
          <div className='mx-auto max-w-md rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center'>
            <p className='text-sm text-red-400'>Failed to load data</p>
            <p className='mt-1 font-mono text-xs text-red-400/60'>{error}</p>
            {fetchUrl !== DEFAULT_URL && (
              <button
                onClick={() => setFetchUrl(DEFAULT_URL)}
                className='mt-4 text-xs text-indigo-400 hover:underline'
              >
                Back to the default list
              </button>
            )}
          </div>
        )}

        {ready && (
          <div className='space-y-4'>
            {pageData.map(({ group }, idx) => (
              <Card
                key={group.id ?? idx}
                assetGroup={group}
                chainData={chainData}
                visibleChains={selectedChains.size ? selectedChains : undefined}
              />
            ))}

            {pageData.length === 0 && (
              <div className='py-24 text-center'>
                <p className='text-sm text-[var(--color-muted)]'>No assets match these filters.</p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className='mt-3 text-xs text-indigo-400 hover:underline'
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {pageCount > 1 && (
              <div className='flex justify-center pt-4'>
                <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
