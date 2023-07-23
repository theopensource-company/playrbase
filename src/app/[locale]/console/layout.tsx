'use client';

import { Profile } from '@/components/cards/profile';
import Container from '@/components/layout/Container';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import React, { ReactNode, useEffect, useState } from 'react';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
    const [scrolled, setScrolled] = useState(false);
    const { loading, user } = useAuth(({ loading, user }) => ({
        loading,
        user,
    }));

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
        <Container
            className={cn(
                'flex flex-grow gap-16',
                scrolled ? 'py-24' : 'py-36'
            )}
        >
            <nav className="rounded-xl border">
                <div className="p-8">
                    <Profile loading={loading} profile={user} size="big" />
                </div>
                <Separator />
            </nav>
            {children}
        </Container>
    );
}
