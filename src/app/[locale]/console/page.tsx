'use client';

import Container from '@/components/layout/Container';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next-intl/client';
// import { useTranslations } from 'next-intl';
import React, { useEffect } from 'react';

export default function ConsolePage() {
    const router = useRouter();
    const { user, loading } = useAuth(({ user, loading }) => ({
        user,
        loading,
    }));

    useEffect(() => {
        if (!loading && !user) router.push('/account/signin');
    }, [user, loading, router]);

    // const t = useTranslations('pages.console.index');

    return (
        <Container className="flex flex-grow flex-col items-center justify-center">
            {loading && <Loader2 size={48} className="animate-spin" />}
            {user && <h1>{user.name}</h1>}
        </Container>
    );
}
