import type { Tag } from '../lib/tags';

import { useMemo, useState } from 'react';

import { Check, Copy, ExternalLink } from 'lucide-react';

import { getCurrencyTags, TONE_CLASSES } from '../lib/tags';
import ChainLogo from './chain-logo';

interface AssetInfo {
  medianPrice: number;
  liquidity: number;
  fdv: number;
  marketCap: number;
}

type ApiReturn = { data: Record<string, Record<string, AssetInfo>> };

interface Props {
  assetGroup: any;
  chainData: Record<string, any>;
  /** When set, tokens on other chains are collapsed behind a toggle. */
  visibleChains?: Set<string>;
}

const API_ENDPOINT = 'https://liquidity.1delta.io/liquidity/';

// Solscan serves mints under /token, EVM explorers use /address
const EXPLORER_PATHS: Record<string, string> = { solana: 'token' };

const MAX_STRIP = 8;
const MAX_GROUP_TAGS = 6;

const getChainShortName = (chainData: Record<string, any>, chainId: string) =>
  chainData[String(chainId)]?.shortName ??
  chainData[String(chainId)]?.name ??
  (String(chainId) === 'solana' ? 'Solana' : `Chain ${chainId}`);

const getAddressExplorerLink = (
  chainData: Record<string, any>,
  chainId: string,
  address: string
) => {
  const chain = chainData[String(chainId)];
  const baseUrl = chain?.explorers?.[0]?.url?.replace(/\/$/, '');
  if (!baseUrl) return undefined;
  return `${baseUrl}/${EXPLORER_PATHS[String(chainId)] ?? 'address'}/${address}`;
};

// hex addresses are keyed lowercase; Solana mints are base58 and case-sensitive
const normalizeAddress = (address: string) =>
  address.startsWith('0x') ? address.toLowerCase() : address;

const abbreviateAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

const abbreviate = (text: string, maxLen: number) =>
  text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;

const formatCompact = (value: number) => {
  if (!Number.isFinite(value)) return '–';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const formatPrice = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value >= 1) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${value.toPrecision(3)}`;
};

function TagChip({ tag }: { tag: Tag }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-4 ${TONE_CLASSES[tag.tone]}`}
    >
      {tag.label}
    </span>
  );
}

function TokenLogo({ src, alt, size }: { src?: string; alt: string; size: number }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (!src || failed)
    return (
      <div
        style={style}
        className='flex flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/10 font-bold text-indigo-400 ring-1 ring-indigo-500/20'
      >
        <span style={{ fontSize: size * 0.36 }}>{alt.slice(0, 2).toUpperCase() || '?'}</span>
      </div>
    );
  return (
    <img
      src={src}
      alt={alt}
      style={style}
      loading='lazy'
      className='flex-shrink-0 rounded-full bg-[var(--overlay-6)] object-contain'
      onError={() => setFailed(true)}
    />
  );
}

export default function Card({ assetGroup, chainData, visibleChains }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const [assetData, setAssetData] = useState<ApiReturn | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const currencies: any[] = assetGroup.currencies ?? [];
  const filter = visibleChains && visibleChains.size > 0 ? visibleChains : null;
  const shown =
    filter && !showAll ? currencies.filter((c) => filter.has(String(c.chainId))) : currencies;
  const hiddenCount = currencies.length - shown.length;

  const { chainIds, groupTags } = useMemo(() => {
    const ids = [...new Set(currencies.map((c) => String(c.chainId)))];
    const counts = new Map<string, { tag: Tag; n: number }>();
    for (const c of currencies)
      for (const tag of getCurrencyTags(c)) {
        const entry = counts.get(tag.label);
        if (entry) entry.n += 1;
        else counts.set(tag.label, { tag, n: 1 });
      }
    const tags = [...counts.values()].sort((a, b) => b.n - a.n).map((e) => e.tag);
    return { chainIds: ids, groupTags: tags };
  }, [currencies]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const fetchAssetData = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINT + assetGroup?.id);
      setAssetData((await res.json()) as ApiReturn);
    } catch (err) {
      console.error('Failed to fetch asset data', err);
    } finally {
      setLoading(false);
    }
  };

  const infoFor = (currency: any): AssetInfo | undefined =>
    assetData?.data?.[String(currency.chainId)]?.[normalizeAddress(currency.address)];

  const highestLiquidityKey = currencies
    .map((c) => ({
      key: `${c.chainId}_${normalizeAddress(c.address)}`,
      liq: infoFor(c)?.liquidity
    }))
    .filter((e) => Number.isFinite(e.liq))
    .sort((a, b) => (b.liq ?? 0) - (a.liq ?? 0))[0]?.key;

  return (
    <article
      className='rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4 transition-colors duration-200 hover:border-[var(--border-hover)] sm:p-5'
      style={{ animation: 'fadeInUp 0.3s ease-out both' }}
    >
      {/* Header */}
      <header className='mb-4 flex flex-wrap items-start justify-between gap-3'>
        <div className='flex min-w-0 items-start gap-3.5'>
          <TokenLogo src={assetGroup.logoURI} alt={assetGroup.symbol ?? '?'} size={44} />
          <div className='min-w-0'>
            <h2
              className='flex flex-wrap items-baseline gap-x-2 text-base font-semibold leading-tight text-[var(--card-text)]'
              title={`${assetGroup.name} (${assetGroup.symbol})`}
            >
              <span className='truncate'>{abbreviate(String(assetGroup.name ?? ''), 36)}</span>
              <span className='font-mono text-sm font-normal text-indigo-500'>
                {abbreviate(String(assetGroup.symbol ?? ''), 14)}
              </span>
            </h2>
            <p className='mt-0.5 text-[11px] text-[var(--color-muted)]'>
              {currencies.length} {currencies.length === 1 ? 'token' : 'tokens'} on{' '}
              {chainIds.length} {chainIds.length === 1 ? 'chain' : 'chains'}
              {assetGroup.id &&
                assetGroup.id !== assetGroup.symbol &&
                assetGroup.id !== assetGroup.name && (
                  <span className='ml-2 font-mono opacity-50' title={assetGroup.id}>
                    #{abbreviate(String(assetGroup.id), 40)}
                  </span>
                )}
            </p>
            {groupTags.length > 0 && (
              <div className='mt-1.5 flex flex-wrap gap-1'>
                {groupTags.slice(0, MAX_GROUP_TAGS).map((tag) => (
                  <TagChip key={tag.label} tag={tag} />
                ))}
                {groupTags.length > MAX_GROUP_TAGS && (
                  <span className='rounded-md bg-[var(--overlay-4)] px-1.5 py-0.5 text-[10px] text-[var(--color-muted)]'>
                    +{groupTags.length - MAX_GROUP_TAGS}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {/* Chain strip */}
          <div
            className='flex items-center -space-x-1.5'
            title={chainIds.map((id) => getChainShortName(chainData, id)).join(', ')}
          >
            {chainIds.slice(0, MAX_STRIP).map((id) => (
              <span key={id} className='rounded-full ring-2 ring-[var(--secondary)]'>
                <ChainLogo chainId={id} shortName={getChainShortName(chainData, id)} size={22} />
              </span>
            ))}
            {chainIds.length > MAX_STRIP && (
              <span className='flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[var(--overlay-8)] px-1 font-mono text-[10px] text-[var(--color-muted)] ring-2 ring-[var(--secondary)]'>
                +{chainIds.length - MAX_STRIP}
              </span>
            )}
          </div>

          <button
            onClick={fetchAssetData}
            disabled={loading}
            className='flex-shrink-0 rounded-lg border border-[var(--border)] bg-[var(--overlay-4)] px-3 py-2 text-xs font-medium text-[var(--color-muted)] transition-all duration-200 hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-500 disabled:pointer-events-none disabled:opacity-40'
          >
            {loading ? (
              <span className='flex items-center gap-1.5'>
                <span className='inline-block h-3 w-3 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400' />
                Loading
              </span>
            ) : assetData ? (
              'Refresh market data'
            ) : (
              'Market data'
            )}
          </button>
        </div>
      </header>

      {/* Token grid */}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {shown.map((currency) => {
          const chainId = String(currency.chainId);
          const address = String(currency.address ?? '');
          const key = `${chainId}_${normalizeAddress(address)}`;
          const info = infoFor(currency);
          const isTop = key === highestLiquidityKey;
          const tags = getCurrencyTags(currency);
          const issuer = currency.props?.issuer?.name;
          const explorer = getAddressExplorerLink(chainData, chainId, address);
          const shortName = getChainShortName(chainData, chainId);
          const price = info ? formatPrice(info.medianPrice) : null;

          return (
            <div
              key={key}
              className={`flex flex-col gap-2.5 rounded-xl border p-3 transition-colors duration-200 ${
                isTop
                  ? 'border-indigo-500/40 bg-indigo-500/[0.06]'
                  : 'border-[var(--overlay-4)] bg-[var(--overlay-2)] hover:border-[var(--overlay-8)] hover:bg-[var(--overlay-4)]'
              }`}
            >
              {/* Chain row */}
              <div className='flex items-center justify-between gap-2'>
                <div className='flex min-w-0 items-center gap-1.5'>
                  <ChainLogo chainId={chainId} shortName={shortName} size={16} />
                  <span className='truncate text-[11px] font-medium text-[var(--color-muted)]'>
                    {shortName}
                  </span>
                </div>
                <div className='flex flex-shrink-0 items-center gap-1'>
                  {isTop && (
                    <span className='rounded-md bg-indigo-500 px-1.5 py-0.5 text-[10px] font-semibold leading-4 text-white'>
                      Top liquidity
                    </span>
                  )}
                  {currency.tier && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] leading-4 ${
                        currency.tier === 1
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : currency.tier === 2
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-[var(--overlay-4)] text-[var(--color-muted)]'
                      }`}
                    >
                      Tier {currency.tier}
                    </span>
                  )}
                  <span className='rounded-md bg-[var(--overlay-4)] px-1.5 py-0.5 font-mono text-[10px] leading-4 text-[var(--color-muted)]'>
                    {currency.decimals}d
                  </span>
                </div>
              </div>

              {/* Token row */}
              <div className='flex items-center gap-2.5'>
                <TokenLogo src={currency.logoURI} alt={currency.symbol ?? '?'} size={30} />
                <div className='min-w-0'>
                  <p
                    className='truncate text-sm font-semibold leading-tight text-[var(--card-text)]'
                    title={currency.symbol}
                  >
                    {abbreviate(String(currency.symbol ?? ''), 18)}
                  </p>
                  <p className='truncate text-xs text-[var(--color-muted)]' title={currency.name}>
                    {abbreviate(String(currency.name ?? ''), 28)}
                    {issuer && <span className='opacity-70'> · {issuer}</span>}
                  </p>
                </div>
              </div>

              {tags.length > 0 && (
                <div className='flex flex-wrap gap-1'>
                  {tags.map((tag) => (
                    <TagChip key={tag.label} tag={tag} />
                  ))}
                </div>
              )}

              {/* Address row */}
              <div className='mt-auto flex items-center gap-1'>
                {explorer ? (
                  <a
                    href={explorer}
                    target='_blank'
                    rel='noopener noreferrer'
                    title={address}
                    className='inline-flex items-center gap-1 rounded-md bg-[var(--overlay-4)] px-2 py-1 font-mono text-xs text-[var(--address-text)] transition-colors hover:bg-[var(--overlay-8)] hover:text-[var(--address-hover)]'
                  >
                    {abbreviateAddress(address)}
                    <ExternalLink className='h-3 w-3 opacity-60' />
                  </a>
                ) : (
                  <span
                    title={address}
                    className='rounded-md bg-[var(--overlay-4)] px-2 py-1 font-mono text-xs text-[var(--color-muted)]'
                  >
                    {abbreviateAddress(address)}
                  </span>
                )}
                <button
                  onClick={() => handleCopy(address)}
                  className='rounded-md p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--overlay-6)] hover:text-[var(--card-text)]'
                  title='Copy address'
                >
                  {copied === address ? (
                    <Check className='h-3.5 w-3.5 text-emerald-500' />
                  ) : (
                    <Copy className='h-3.5 w-3.5' />
                  )}
                </button>
              </div>

              {/* Market data */}
              {info && (
                <dl className='grid grid-cols-2 gap-x-3 gap-y-1 border-t border-[var(--overlay-6)] pt-2.5 text-xs'>
                  {price && (
                    <>
                      <dt className='text-[11px] text-[var(--color-muted)]'>Price</dt>
                      <dd className='text-right font-mono tabular-nums text-[var(--card-text)]'>
                        {price}
                      </dd>
                    </>
                  )}
                  <dt className='text-[11px] text-[var(--color-muted)]'>Liquidity</dt>
                  <dd className='text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400'>
                    {formatCompact(info.liquidity)}
                  </dd>
                  <dt className='text-[11px] text-[var(--color-muted)]'>FDV</dt>
                  <dd className='text-right font-mono tabular-nums text-[var(--card-text)]'>
                    {formatCompact(info.fdv)}
                  </dd>
                  <dt className='text-[11px] text-[var(--color-muted)]'>Mkt cap</dt>
                  <dd className='text-right font-mono tabular-nums text-[var(--card-text)]'>
                    {formatCompact(info.marketCap)}
                  </dd>
                </dl>
              )}
            </div>
          );
        })}
      </div>

      {filter && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className='mt-3 w-full rounded-lg border border-dashed border-[var(--border)] py-2 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--overlay-4)] hover:text-[var(--card-text)]'
        >
          Show {hiddenCount} more on other chains
        </button>
      )}
      {filter && showAll && (
        <button
          onClick={() => setShowAll(false)}
          className='mt-3 w-full rounded-lg border border-dashed border-[var(--border)] py-2 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--overlay-4)] hover:text-[var(--card-text)]'
        >
          Only show selected chains
        </button>
      )}
    </article>
  );
}
