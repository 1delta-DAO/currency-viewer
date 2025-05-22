import { CHAIN_INFO } from "@1delta/asset-registry";
import React, { useState } from "react";

interface AssetInfo {
    medianPrice: number;
    liquidity: number;
    fdv: number;
    marketCap: number;
}

type ApiReturn = { data: Record<string, Record<string, AssetInfo>> };

const getChainLogoURI = (chainId: string) => CHAIN_INFO[chainId]?.icon;
const getAddressExplorerLink = (chainId: string, address: string) =>
    `${CHAIN_INFO[chainId]?.explorers[0].url}/address/${address}`;

const abbreviateAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;


const API_ENDPOINT = "https://liquidity.1delta.io/liquidity/"

export default function Card({ assetGroup }: any) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [assetData, setAssetData] = useState<ApiReturn | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCopy = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 1500);
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    const fetchAssetData = async () => {
        try {
            setLoading(true);
            const res = await fetch(API_ENDPOINT + assetGroup?.id); // replace with real endpoint
            const json: ApiReturn = await res.json() as any;
            setAssetData(json);
        } catch (err) {
            console.error("Failed to fetch asset data", err);
        } finally {
            setLoading(false);
        }
    };

    const liquidityMap = assetGroup.currencies.reduce((acc: Record<string, number>, currency: any) => {
        const chainIdStr = String(currency.chainId);
        const addressLC = currency.address;
        const info: AssetInfo | undefined = assetData?.data?.[chainIdStr]?.[addressLC];
        if (info) {
            acc[`${chainIdStr}_${addressLC}`] = info.liquidity;
        }
        return acc;
    }, {});

    const highestLiquidityKey = Object.entries(liquidityMap).sort((a: any, b: any) => b[1] - a[1])[0]?.[0];


    return (
        <div className="border rounded p-4 shadow">
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                <div className="flex items-center gap-4">
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

                <button
                    onClick={fetchAssetData}
                    className="text-sm px-3 py-1.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Fetch Market Data"}
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {assetGroup.currencies.map((currency: any, cidx: number) => {
                    const chainIdStr = String(currency.chainId);
                    const addressLC = currency.address.toLowerCase();
                    const info: AssetInfo | undefined =
                        assetData?.data?.[chainIdStr]?.[addressLC];

                    const dataKey = `${String(currency.chainId)}_${currency.address.toLowerCase()}`;
                    const isHighestLiquidity = dataKey === highestLiquidityKey;


                    return (
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

                            {/* Display API data */}
                            {info && (
                                <div
                                    className={`mt-4 text-sm text-gray-700 p-3 rounded border transition ${isHighestLiquidity
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 bg-gray-50"
                                        }`}
                                >
                                    {info.medianPrice && !isNaN(info.medianPrice) && <div className="flex justify-between">
                                        <span className="font-medium">Median Price:</span>
                                        <span>${info.medianPrice?.toFixed(2)}</span>
                                    </div>}
                                    <div className="flex justify-between">
                                        <span className="font-medium">Liquidity:</span>
                                        <span>${info.liquidity.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">FDV:</span>
                                        <span>${info.fdv.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Market Cap:</span>
                                        <span>${info.marketCap.toLocaleString()}</span>
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
