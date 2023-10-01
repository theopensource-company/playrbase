'use client';

import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next-intl/client';
import React, { ReactNode, useEffect } from 'react';

export default function AdminBoundry({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { loading, user } = useAuth(({ loading, user }) => ({
        loading,
        user,
    }));

    useEffect(() => {
        if (!loading && user?.scope !== 'admin')
            router.push('/console/account');
    });

    return loading || user?.scope !== 'admin' ? (
        <div className="flex w-full items-center justify-center">
            <Loader2 size={50} className="animate-spin" />
        </div>
    ) : (
        children
    );
}
