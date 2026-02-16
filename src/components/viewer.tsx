import { useEffect, useState } from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Loader2,
  Moon,
  Search,
  Sun
} from 'lucide-react';

import Image1D from '../assets/images/1delta_dark.svg';
import Button from './button';
import Card from './card';

const DEFAULT_URL = 'https://raw.githubusercontent.com/1delta-DAO/token-lists/main/omni-list.json';
const CHAINS_URL = 'https://raw.githubusercontent.com/1delta-DAO/chains/main/data.json';

const PAGE_SIZE = 5;

function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, () => setDark((d) => !d)] as const;
}

export default function OmniCurrencyViewer() {
  const [data, setData] = useState({});
  const [chainData, setChainData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [url, setUrl] = useState('');
  const [fetchUrl, setFetchUrl] = useState(DEFAULT_URL);
  const [search, setSearch] = useState('');
  const [dark, toggleTheme] = useTheme();

  useEffect(() => {
    fetch(CHAINS_URL)
      .then((res) => res.json())
      .then((json: any) => setChainData(json))
      .catch((err: any) => console.error('Failed to fetch chain data', err));
  }, []);

  useEffect(() => {
    if (!fetchUrl) return;
    setLoading(true);
    fetch(fetchUrl)
      .then((res) => res.json())
      .then((json: any) => {
        setData(json);
        setLoading(false);
        setPage(0);
      })
      .catch((err: any) => {
        setError(err.message);
        setLoading(false);
      });
  }, [fetchUrl]);

  const omniArray = Object.values(data)
    .filter((item: any) => {
      const term = search?.toLowerCase();
      return item?.name?.toLowerCase().includes(term) || item?.symbol?.toLowerCase().includes(term);
    })
    .sort((a: any, b: any) => {
      const term = search?.toLowerCase();
      const aExact = a?.name?.toLowerCase() === term || a?.symbol?.toLowerCase() === term;
      const bExact = b?.name?.toLowerCase() === term || b?.symbol?.toLowerCase() === term;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

  const pageCount = Math.ceil(omniArray.length / PAGE_SIZE);
  const pageData = omniArray.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className='min-h-screen bg-[var(--primary)] transition-colors duration-300'>
      {/* Fixed header */}
      <header className='fixed left-0 right-0 top-0 z-10 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-xl'>
        <div className='mx-auto max-w-6xl px-4 py-4 sm:px-6'>
          {/* Top row: logo, URL input, theme toggle, pagination */}
          <div className='flex items-center justify-between gap-4'>
            <div className='flex min-w-0 items-center gap-3'>
              {/* Logo */}
              <div className='flex-shrink-0 rounded-lg bg-[var(--overlay-6)] p-2 ring-1 ring-[var(--ring)]'>
                <img src={Image1D} className='h-6 w-6' alt='1delta' />
              </div>

              {/* URL input - desktop only */}
              {window.innerWidth >= 768 && (
                <div className='flex items-center gap-2'>
                  <div className='relative'>
                    <LinkIcon className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted)]' />
                    <input
                      placeholder='Custom JSON URL...'
                      value={url}
                      onChange={(e: any) => setUrl(e.target.value)}
                      className='w-64 rounded-lg border border-[var(--border)] bg-[var(--overlay-4)] py-2.5 pl-9 pr-4 text-xs text-[var(--color)] placeholder-[var(--color-muted)] outline-none transition-all duration-200 hover:border-[var(--border-hover)] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30'
                    />
                  </div>
                  <Button variant='ghost' onClick={() => setFetchUrl(url)}>
                    Fetch
                  </Button>
                </div>
              )}
            </div>

            <div className='flex items-center gap-2'>
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className='rounded-lg p-2 text-[var(--color-muted)] transition-all duration-200 hover:bg-[var(--overlay-6)] hover:text-[var(--card-text)]'
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
              </button>

              {/* Pagination */}
              {!loading && !error && (
                <div className='flex items-center gap-1.5'>
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className='rounded-lg p-2 text-[var(--color-muted)] transition-all duration-200 hover:bg-[var(--overlay-6)] hover:text-[var(--card-text)] disabled:pointer-events-none disabled:opacity-30'
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </button>
                  <span className='min-w-[5rem] text-center text-xs font-medium text-[var(--color-muted)]'>
                    {page + 1}
                    <span className='mx-1 opacity-40'>/</span>
                    {pageCount}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                    className='rounded-lg p-2 text-[var(--color-muted)] transition-all duration-200 hover:bg-[var(--overlay-6)] hover:text-[var(--card-text)] disabled:pointer-events-none disabled:opacity-30'
                  >
                    <ChevronRight className='h-4 w-4' />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          {!loading && !error && (
            <div className='relative mt-3'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]' />
              <input
                placeholder='Search by name or symbol...'
                value={search}
                onChange={(e: any) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className='w-full rounded-lg border border-[var(--border)] bg-[var(--overlay-4)] py-2.5 pl-10 pr-4 text-sm text-[var(--color)] placeholder-[var(--color-muted)] outline-none transition-all duration-200 hover:border-[var(--border-hover)] focus:border-indigo-500/50 focus:bg-[var(--overlay-6)] focus:ring-1 focus:ring-indigo-500/30'
              />
              {search && (
                <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-muted)]'>
                  {omniArray.length} result{omniArray.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className='mx-auto max-w-6xl px-4 pb-12 pt-36 sm:px-6'>
        {loading && (
          <div className='flex flex-col items-center justify-center py-32 text-[var(--color-muted)]'>
            <Loader2 className='mb-3 h-8 w-8 animate-spin text-indigo-400' />
            <p className='text-sm'>Loading assets...</p>
          </div>
        )}

        {error && (
          <div className='mx-auto max-w-md rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center'>
            <p className='text-sm text-red-400'>Failed to load data</p>
            <p className='mt-1 text-xs text-red-400/60'>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className='space-y-4'>
            {pageData.map((assetGroup, idx) => (
              <Card key={idx} assetGroup={assetGroup} chainData={chainData} />
            ))}

            {pageData.length === 0 && (
              <div className='py-20 text-center'>
                <p className='text-sm text-[var(--color-muted)]'>No assets match your search.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
