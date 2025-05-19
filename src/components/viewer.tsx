const DEFAULT_URL = "https://raw.githubusercontent.com/1delta-DAO/asset-lists/main/omni-list.json";

import React, { useEffect, useState } from "react";
import Input from "./input";
import Button from "./button";
import Card from "./card";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

    const omniArray = Object.values(data).filter((item: any) => {
        const term = search?.toLowerCase();
        return (
            item?.name?.toLowerCase().includes(term) ||
            item?.symbol?.toLowerCase().includes(term)
        );
    });

    const pageCount = Math.ceil(omniArray.length / PAGE_SIZE);
    const pageData = omniArray.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="fixed top-0 left-0 right-0 bg-white z-10 shadow px-6 py-4">
                <div className="mb-4 flex items-center gap-2">
                    <Input
                        placeholder="Enter JSON URL"
                        value={url}
                        onChange={(e: any) => setUrl(e.target.value)}
                    />
                    <Button onClick={() => setFetchUrl(url)}>Fetch</Button>
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

                        <div className="flex justify-center gap-4 mt-6">
                            <Button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                            >
                                <ChevronLeft /> Prev
                            </Button>
                            <p className="self-center">Page {page + 1} of {pageCount}</p>
                            <Button
                                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                                disabled={page >= pageCount - 1}
                            >
                                Next <ChevronRight />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
