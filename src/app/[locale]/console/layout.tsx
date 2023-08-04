'use client';

import { Profile } from '@/components/cards/profile';
import Container from '@/components/layout/Container';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Building, Loader2, UserCog, Users } from 'lucide-react';
import { useRouter } from 'next-intl/client';
import Link from 'next-intl/link';
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
                <div className="mx-4 my-5 flex flex-col gap-2">
                    {user?.scope === 'admin' && (
                        <>
                            <Link href="/console/users">
                                <div className="flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-muted">
                                    <Users size={20} />
                                    <h4 className="text-md">Users</h4>
                                </div>
                            </Link>
                            <Link href="/console/admins">
                                <div className="flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-muted">
                                    <UserCog size={20} />
                                    <h4 className="text-md">Admins</h4>
                                </div>
                            </Link>
                            <Link href="/console/organisations">
                                <div className="flex items-center gap-2 rounded-lg px-4 py-3 hover:bg-muted">
                                    <Building size={20} />
                                    <h4 className="text-md">Organisations</h4>
                                </div>
                            </Link>
                        </>
                    )}
                </div>
            </nav>
            {children}
        </Container>
    );
}
