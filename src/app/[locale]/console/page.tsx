'use client';

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
        <>
            {loading && <Loader2 size={48} className="animate-spin" />}
            {user && <h1>{user.name}</h1>}
        </>
    );
}
