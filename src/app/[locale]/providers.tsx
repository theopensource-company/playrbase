'use client';

import { NavbarProvider } from '@/components/layout/navbar';
import { SurrealProvider } from '@/lib/Surreal';
import { AuthProvider } from '@/lib/auth';
import { FeatureFlagsProvider } from '@/lib/featureFlags';
import { ScrolledStateProvider } from '@/lib/scrolled';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            throwOnError: true,
            refetchInterval: false,
            refetchOnWindowFocus: false,
        },
        mutations: {
            throwOnError: true,
        },
    },
});

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <SurrealProvider>
                <AuthProvider>
                    <FeatureFlagsProvider>
                        <ScrolledStateProvider>
                            <NavbarProvider>{children}</NavbarProvider>
                        </ScrolledStateProvider>
                    </FeatureFlagsProvider>
                </AuthProvider>
            </SurrealProvider>
        </QueryClientProvider>
    );
}
