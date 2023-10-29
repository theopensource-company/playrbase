'use client';

import { SurrealProvider } from '@/lib/Surreal';
import { AuthProvider } from '@/lib/auth';
import { FeatureFlagsProvider } from '@/lib/featureFlags';
import { ScrolledStateProvider } from '@/lib/scrolled';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <SurrealProvider>
                <AuthProvider>
                    <FeatureFlagsProvider>
                        <ScrolledStateProvider>
                            {children}
                        </ScrolledStateProvider>
                    </FeatureFlagsProvider>
                </AuthProvider>
            </SurrealProvider>
        </QueryClientProvider>
    );
}
