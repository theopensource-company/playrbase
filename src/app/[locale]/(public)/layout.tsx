'use client';

import { Navbar } from '@/components/layout/navbar';
import React, { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <Navbar />
            {children}
        </>
    );
}
