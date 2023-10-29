'use client';

import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { useAuth } from '@/lib/auth';
import React, { ReactNode } from 'react';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
    const { loading, user } = useAuth({ authRequired: true });

    return (
        <>
            {children}
            <LoaderOverlay show={loading || !user} />
        </>
    );
}
