'use client';

import Container from '@/components/layout/Container';
import { Navbar } from '@/components/layout/navbar';
import { useScrolledState } from '@/lib/scrolled';
import { cn } from '@/lib/utils';
import React, { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
    const scrolled = useScrolledState();

    return (
        <>
            <Navbar />
            <Container className="flex min-h-screen flex-col pb-24">
                <div
                    className={cn(
                        'transition-height',
                        scrolled ? 'h-24' : 'h-36'
                    )}
                />
                {children}
            </Container>
        </>
    );
}
