'use client';

import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { Navbar, NavbarHeightOffset } from '@/components/layout/navbar';
import { useAuth } from '@/lib/auth';
import React, { ReactNode } from 'react';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
    const { loading, user } = useAuth({ authRequired: true });

    return (
        <>
            <Navbar />
            <div className="flex flex-grow flex-col pb-24">
                <NavbarHeightOffset />
                {user && children}
                <LoaderOverlay show={loading || !user} />
            </div>
        </>
    );
}
