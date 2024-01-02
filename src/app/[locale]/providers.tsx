'use client';

import { NavbarProvider } from '@/components/layout/navbar';
import { Deployed, Environment } from '@/config/Environment';
import { SurrealProvider } from '@/lib/Surreal';
import { AuthProvider } from '@/lib/auth';
import { FeatureFlagsProvider } from '@/lib/featureFlags';
import { ScrolledStateProvider } from '@/lib/scrolled';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

const throwOnError = Environment == 'prod' && !Deployed;
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            throwOnError,
            refetchInterval: false,
        },
        mutations: {
            throwOnError,
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
