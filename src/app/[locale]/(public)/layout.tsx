'use client';

import Container from '@/components/layout/Container';
import { Navbar, NavbarHeightOffset } from '@/components/layout/navbar';
import React, { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <Navbar />
            <Container className="flex min-h-screen flex-col pb-24">
                <NavbarHeightOffset />
                {children}
            </Container>
        </>
    );
}
