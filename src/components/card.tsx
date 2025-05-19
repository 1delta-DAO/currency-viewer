import { CHAIN_INFO } from "@1delta/asset-registry";
import React from "react";

const getChainLogoURI = (chainId: string) => CHAIN_INFO[chainId].icon

export default function Card({ assetGroup }: any) {
    return (
        <div className="border rounded p-4 shadow">
            <div className="flex items-center gap-4 mb-4">
                {assetGroup.logoURI && (
                    <img
                        src={assetGroup.logoURI}
                        alt={assetGroup.name}
                        className="w-10 h-10 rounded-full"
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
                        {/* Chain logo in top-right */}
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
                                    className="w-6 h-6 rounded"
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
                        <p className="text-sm text-gray-600 break-words">Address: {currency.address}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
