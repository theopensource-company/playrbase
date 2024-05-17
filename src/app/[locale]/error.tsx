'use client';

import React from 'react';
import { useCopyToClipboard } from 'usehooks-ts';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [_, copy] = useCopyToClipboard();

    return (
        <div className="p-8">
            <div className="space-y-4 p-6">
                <h2 className="text-4xl font-bold">Something went wrong!</h2>
                <p>
                    Please click the copy button and share the copied report
                    with the platform authors
                </p>
                <div className="space-x-2">
                    <button
                        className="rounded-md bg-white px-3 py-1 text-black"
                        onClick={() => copy(JSON.stringify(error))}
                    >
                        Copy report
                    </button>
                    <button className="px-3 py-1" onClick={() => reset()}>
                        Try again
                    </button>
                </div>
                <h2 className="text-2xl font-bold">More details</h2>
                <pre className="text-xs">{JSON.stringify(error, null, 2)}</pre>
            </div>
        </div>
    );
}
