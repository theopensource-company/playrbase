'use client';

import Container from '@/components/layout/Container';
import {
    Navbar,
    NavbarSubLink,
    NavbarSubLinks,
} from '@/components/layout/navbar';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next-intl/client';
import React, { ReactNode, useEffect, useState } from 'react';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const { loading, user } = useAuth(({ loading, user }) => ({
        loading,
        user,
    }));

    useEffect(() => {
        if (!loading && !user) router.push('/account/signin');
    }, [user, loading, router]);

    useEffect(() => {
        const handler = () => {
            setScrolled(
                (window.pageYOffset || document.documentElement.scrollTop) > 0
            );
        };

        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, [setScrolled]);

    return loading ? (
        <Container className="flex w-full flex-grow items-center justify-center">
            <Loader2 size={50} className="animate-spin" />
        </Container>
    ) : (
        <>
            <Navbar>
                <NavbarSubLinks baseUrl={`/account`}>
                    <NavbarSubLink>Account</NavbarSubLink>
                    <NavbarSubLink link="organisations">
                        Organisations
                    </NavbarSubLink>
                </NavbarSubLinks>
            </Navbar>
            <Container className="pb-24 pt-8">
                <div
                    className={cn(
                        'transition-height',
                        scrolled ? 'h-24' : 'h-36'
                    )}
                />
                {children}
            </Container>{' '}
        </>
    );
}
