'use client';

import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';

export function Hydrate() {
    const { refreshUser } = useAuth();

    useEffect(() => {
        setInterval(refreshUser, 60000);
        window.addEventListener('focus', refreshUser, false);
        refreshUser();
    }, [refreshUser]);

    return null;
}
