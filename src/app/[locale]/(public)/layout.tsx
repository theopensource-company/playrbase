'use client';

import Container from '@/components/layout/Container';
import { Navbar } from '@/components/layout/navbar';
import { cn } from '@/lib/utils';
import React, { ReactNode, useEffect, useState } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => {
            setScrolled(
                (window.pageYOffset || document.documentElement.scrollTop) > 0
            );
        };

        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, [setScrolled]);

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
