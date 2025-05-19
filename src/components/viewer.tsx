const DEFAULT_URL = "https://raw.githubusercontent.com/1delta-DAO/asset-lists/main/omni-list.json";

import React, { useEffect, useState } from "react";
import Input from "./input";
import Button from "./button";
import Card from "./card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image1D from "../assets/images/1delta_dark.svg";

const PAGE_SIZE = 5;

export default function OmniCurrencyViewer() {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [url, setUrl] = useState("");
    const [fetchUrl, setFetchUrl] = useState(DEFAULT_URL);
    const [search, setSearch] = useState("");

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
            return (
                item?.name?.toLowerCase().includes(term) ||
                item?.symbol?.toLowerCase().includes(term)
            );
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
        <div className="p-6 max-w-5xl mx-auto">
            <div className="fixed top-0 left-0 right-0 bg-white z-10 shadow px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <img src={Image1D} style={{ height: "2rem", width: "2rem" }} />
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Enter other JSON URL"
                                value={url}
                                onChange={(e: any) => setUrl(e.target.value)}
                            />
                            <Button onClick={() => setFetchUrl(url)}>Fetch</Button>
                        </div>
                    </div>
                    {!loading && !error && (
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                <ChevronLeft />
                            </Button>
                            <span className="text-sm">Page {page + 1} of {pageCount}</span>
                            <Button
                                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                                disabled={page >= pageCount - 1}
                            >
                                <ChevronRight />
                            </Button>
                        </div>
                    )}
                </div>
                {!loading && !error && (
                    <Input
                        placeholder="Search by name or symbol"
                        value={search}
                        onChange={(e: any) => {
                            setSearch(e.target.value);
                            setPage(0);
                        }}
                    />
                )}
            </div>

            <div className="mt-40">
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}

                {!loading && !error && (
                    <div className="space-y-6">
                        {pageData.map((assetGroup, idx) => (
                            <Card key={idx} assetGroup={assetGroup} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
