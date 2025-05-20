import { CHAIN_INFO } from "@1delta/asset-registry";
import React, { useState } from "react";

const getChainLogoURI = (chainId: string) => CHAIN_INFO[chainId].icon;
const getAddressExplorerLink = (chainId: string, address: string) =>
    `${CHAIN_INFO[chainId].explorers[0].url}/address/${address}`;

const abbreviateAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

export default function Card({ assetGroup }: any) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopy = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 1500); // Hide after 1.5s
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    return (
        <div className="border rounded p-4 shadow">
            <div className="flex items-center gap-4 mb-4">
                {assetGroup.logoURI && (
                    <img
                        src={assetGroup.logoURI}
                        alt={assetGroup.name}
                        className="w-10 h-10 rounded-full object-contain"
                    />
                )}
                <div>
                    <h2 className="text-xl font-bold">
                        {assetGroup.name} ({assetGroup.symbol})
                    </h2>
                    <p className="text-gray-500">ID: {assetGroup.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {assetGroup.currencies.map((currency: any, cidx: number) => (
                    <div key={cidx} className="relative border p-3 rounded shadow-sm">
                        <img
                            src={getChainLogoURI(currency.chainId)}
                            alt={`Chain ${currency.chainId}`}
                            className="absolute top-2 right-2 w-5 h-5"
                            style={{ borderRadius: 50 }}
                        />

                        <div className="flex items-center gap-3 mb-2">
                            {currency.logoURI && (
                                <img
                                    src={currency.logoURI}
                                    alt={currency.symbol}
                                    className="w-6 h-6 rounded object-contain"
                                />
                            )}
                            <div>
                                <p className="font-semibold">{currency.symbol}</p>
                                <p className="text-xs text-gray-400">{currency.name}</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600">Chain ID: {currency.chainId}</p>
                        <p className="text-sm text-gray-600">Decimals: {currency.decimals}</p>
                        <p className="text-sm text-gray-600">Tier: {currency.tier}</p>

                        <div className="text-sm text-gray-600 break-words flex items-center gap-1 relative">
                            Address:&nbsp;
                            <a
                                href={getAddressExplorerLink(currency.chainId, currency.address)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={currency.address}
                                className="text-blue-600 underline hover:text-blue-800"
                            >
                                {abbreviateAddress(currency.address)}
                            </a>
                            <button
                                onClick={() => handleCopy(currency.address, cidx)}
                                className="ml-1 text-gray-500 hover:text-black"
                                title="Copy address"
                            >
                                📋
                            </button>

                            {copiedIndex === cidx && (
                                <span className="absolute -top-0 right-0 bg-black text-white text-xs rounded px-2 py-1 opacity-80 shadow">
                                    Copied!
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
