import { useState } from 'react';

// same icon source as worker-api (`chainLogoURI` in @1delta/data-sdk); the registry's
// `icon` field points at the stale chain-icons repo and is missing for newer chains
const CHAIN_LOGO_BASE = 'https://raw.githubusercontent.com/1delta-DAO/chains/main';

export const chainLogoURI = (chainId: string | number) =>
  `${CHAIN_LOGO_BASE}/${String(chainId)}.webp`;

interface Props {
  chainId: string | number;
  shortName?: string;
  size?: number;
  className?: string;
}

export default function ChainLogo({ chainId, shortName, size = 20, className = '' }: Props) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  if (failed)
    return (
      <span
        style={style}
        className={`inline-flex flex-shrink-0 items-center justify-center rounded-full bg-[var(--overlay-8)] font-bold text-[var(--color-muted)] ${className}`}
        title={shortName ?? String(chainId)}
      >
        <span style={{ fontSize: Math.max(7, size * 0.4) }}>
          {(shortName ?? String(chainId)).slice(0, 2).toUpperCase()}
        </span>
      </span>
    );

  return (
    <img
      src={chainLogoURI(chainId)}
      alt={shortName ?? `Chain ${chainId}`}
      style={style}
      loading='lazy'
      className={`flex-shrink-0 rounded-full ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
