import { useState } from 'react';

interface AssetInfo {
  medianPrice: number;
  liquidity: number;
  fdv: number;
  marketCap: number;
}

type ApiReturn = { data: Record<string, Record<string, AssetInfo>> };

const getChainLogoURI = (chainData: Record<string, any>, chainId: string) =>
  chainData[String(chainId)]?.icon;

const getChainShortName = (chainData: Record<string, any>, chainId: string) =>
  chainData[String(chainId)]?.shortName;

const getAddressExplorerLink = (
  chainData: Record<string, any>,
  chainId: string,
  address: string
) => {
  const chain = chainData[String(chainId)];
  const baseUrl = chain?.explorers?.[0]?.url?.replace(/\/$/, '');
  if (!baseUrl) return '#';
  return `${baseUrl}/address/${address}`;
};

const abbreviateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const abbreviateName = (name: string, maxLen = 20) =>
  name.length > maxLen ? name.slice(0, maxLen - 1) + '\u2026' : name;

const abbreviateSymbol = (symbol: string, maxLen = 10) =>
  symbol.length > maxLen ? symbol.slice(0, maxLen - 1) + '\u2026' : symbol;

const formatCompact = (value: number) => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
};

const API_ENDPOINT = 'https://liquidity.1delta.io/liquidity/';

export default function Card({ assetGroup, chainData }: any) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [assetData, setAssetData] = useState<ApiReturn | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const fetchAssetData = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINT + assetGroup?.id);
      const json: ApiReturn = (await res.json()) as any;
      setAssetData(json);
    } catch (err) {
      console.error('Failed to fetch asset data', err);
    } finally {
      setLoading(false);
    }
  };

  const liquidityMap = assetGroup.currencies.reduce(
    (acc: Record<string, number>, currency: any) => {
      const chainIdStr = String(currency.chainId);
      const addressLC = currency.address;
      const info: AssetInfo | undefined = assetData?.data?.[chainIdStr]?.[addressLC];
      if (info) {
        acc[`${chainIdStr}_${addressLC}`] = info.liquidity;
      }
      return acc;
    },
    {}
  );

  const highestLiquidityKey = Object.entries(liquidityMap).sort(
    (a: any, b: any) => b[1] - a[1]
  )[0]?.[0];

  return (
    <div
      className='rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-5 transition-all duration-300 hover:border-[var(--border-hover)] hover:shadow-lg hover:shadow-indigo-500/[0.04]'
      style={{ animation: 'fadeInUp 0.4s ease-out both' }}
    >
      {/* Header */}
      <div className='mb-5 flex flex-wrap items-center justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-3.5'>
          {assetGroup.logoURI ? (
            <div className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--overlay-6)] p-1.5'>
              <img
                src={assetGroup.logoURI}
                alt={assetGroup.name}
                className='h-full w-full rounded-full object-contain'
              />
            </div>
          ) : (
            <div className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/20'>
              <span className='text-base font-bold text-indigo-400'>
                {assetGroup.symbol?.slice(0, 2) || '?'}
              </span>
            </div>
          )}
          <div className='min-w-0'>
            <h2
              className='truncate text-lg font-semibold text-[var(--card-text)]'
              title={`${assetGroup.name} (${assetGroup.symbol})`}
            >
              {abbreviateName(assetGroup.name)}{' '}
              <span className='font-normal text-indigo-500'>
                {abbreviateSymbol(assetGroup.symbol)}
              </span>
            </h2>
            <p className='text-xs text-[var(--color-muted)]'>
              {assetGroup.currencies.length} chain{assetGroup.currencies.length !== 1 ? 's' : ''}
              {assetGroup.id && <span className='ml-2 opacity-50'>#{assetGroup.id}</span>}
            </p>
          </div>
        </div>

        <button
          onClick={fetchAssetData}
          className='flex-shrink-0 rounded-lg border border-[var(--border)] bg-[var(--overlay-4)] px-3.5 py-2 text-xs font-medium text-[var(--color-muted)] transition-all duration-200 hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-500 disabled:pointer-events-none disabled:opacity-40'
          disabled={loading}
        >
          {loading ? (
            <span className='flex items-center gap-1.5'>
              <span className='inline-block h-3 w-3 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400' />
              Loading
            </span>
          ) : assetData ? (
            'Refresh Data'
          ) : (
            'Fetch Market Data'
          )}
        </button>
      </div>

      {/* Currency grid */}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {assetGroup.currencies.map((currency: any, cidx: number) => {
          const chainIdStr = String(currency.chainId);
          const addressLC = currency.address.toLowerCase();
          const info: AssetInfo | undefined = assetData?.data?.[chainIdStr]?.[addressLC];

          const dataKey = `${String(currency.chainId)}_${currency.address.toLowerCase()}`;
          const isHighestLiquidity = dataKey === highestLiquidityKey;

          return (
            <div
              key={cidx}
              className={`group relative rounded-lg border p-3.5 transition-all duration-200 ${
                isHighestLiquidity
                  ? 'border-indigo-500/30 bg-indigo-500/[0.06]'
                  : 'border-[var(--overlay-4)] bg-[var(--overlay-2)] hover:border-[var(--overlay-8)] hover:bg-[var(--overlay-4)]'
              }`}
            >
              {/* Chain badge */}
              <div className='absolute right-3 top-2.5 flex items-center gap-1.5'>
                <span className='text-[10px] font-medium text-[var(--color-muted)]'>
                  {getChainShortName(chainData, currency.chainId)}
                </span>
                <img
                  src={getChainLogoURI(chainData, currency.chainId)}
                  alt={`Chain ${currency.chainId}`}
                  className='h-5 w-5 rounded-full'
                />
              </div>

              {isHighestLiquidity && (
                <span className='absolute -top-2 left-3 rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md shadow-indigo-500/30'>
                  Top Liquidity
                </span>
              )}

              {/* Token info */}
              <div className='mb-3 flex items-center gap-2.5'>
                {currency.logoURI ? (
                  <img
                    src={currency.logoURI}
                    alt={currency.symbol}
                    className='h-7 w-7 rounded-full object-contain'
                  />
                ) : (
                  <div className='flex h-7 w-7 items-center justify-center rounded-full bg-[var(--overlay-6)] text-[10px] font-bold text-[var(--color-muted)]'>
                    {currency.symbol?.slice(0, 2)}
                  </div>
                )}
                <div className='min-w-0'>
                  <p
                    className='truncate text-sm font-semibold text-[var(--card-text)]'
                    title={currency.symbol}
                  >
                    {abbreviateSymbol(currency.symbol)}
                  </p>
                  <p className='truncate text-xs text-[var(--color-muted)]' title={currency.name}>
                    {abbreviateName(currency.name, 18)}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className='mb-3 flex flex-wrap gap-1.5'>
                <span className='rounded-md bg-[var(--overlay-4)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]'>
                  {currency.decimals}d
                </span>
                {currency.tier && (
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] ${
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
              </div>

              {/* Address */}
              <div className='flex items-center gap-1.5'>
                <a
                  href={getAddressExplorerLink(chainData, currency.chainId, currency.address)}
                  target='_blank'
                  rel='noopener noreferrer'
                  title={currency.address}
                  className='rounded bg-[var(--overlay-4)] px-2 py-1 font-mono text-xs text-[var(--address-text)] transition-colors hover:bg-[var(--overlay-8)] hover:text-[var(--address-hover)]'
                >
                  {abbreviateAddress(currency.address)}
                </a>
                <button
                  onClick={() => handleCopy(currency.address, cidx)}
                  className='rounded p-1 text-[var(--color-muted)] transition-colors hover:bg-[var(--overlay-6)] hover:text-[var(--card-text)]'
                  title='Copy address'
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='13'
                    height='13'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <rect width='14' height='14' x='8' y='8' rx='2' ry='2' />
                    <path d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' />
                  </svg>
                </button>

                {copiedIndex === cidx && (
                  <span className='animate-pulse rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400'>
                    Copied
                  </span>
                )}
              </div>

              {/* Market data */}
              {info && (
                <div className='mt-3 space-y-1.5 border-t border-[var(--overlay-4)] pt-3'>
                  {info.medianPrice && !isNaN(info.medianPrice) && (
                    <div className='flex items-center justify-between'>
                      <span className='text-[11px] text-[var(--color-muted)]'>Price</span>
                      <span className='text-xs font-medium text-[var(--card-text)]'>
                        ${info.medianPrice.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center justify-between'>
                    <span className='text-[11px] text-[var(--color-muted)]'>Liquidity</span>
                    <span className='text-xs font-medium text-emerald-600 dark:text-emerald-400'>
                      {formatCompact(info.liquidity)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-[11px] text-[var(--color-muted)]'>FDV</span>
                    <span className='text-xs font-medium text-[var(--card-text)]'>
                      {formatCompact(info.fdv)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-[11px] text-[var(--color-muted)]'>Mkt Cap</span>
                    <span className='text-xs font-medium text-[var(--card-text)]'>
                      {formatCompact(info.marketCap)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
