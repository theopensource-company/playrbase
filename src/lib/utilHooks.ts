'use client';

import { useEffect, useState } from 'react';

export function useReadyAfter(timeout: number, bypass?: boolean) {
    const [ready, setReady] = useState(!!bypass);
    useEffect(() => {
        if (!ready) setTimeout(() => setReady(true), timeout);
    });

    return ready;
}
