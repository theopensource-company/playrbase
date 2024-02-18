'use client';

import { usePathname, useRouter } from '@/locales/navigation';
import { Admin } from '@/schema/resources/admin';
import { User } from '@/schema/resources/user';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { ReactNode, createContext, useContext, useEffect } from 'react';
import { useSurreal } from './Surreal';

type AnyUser = User | Admin;

export type AuthStore = {
    user?: (AnyUser & { scope: string }) | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    signout: () => Promise<void>;
};

export const AuthContext = createContext<AuthStore>({
    loading: true,
    async refreshUser() {},
    async signout() {},
});

export function useCreateAuthState() {
    const surreal = useSurreal();
    const queryClient = useQueryClient();

    const {
        data: user,
        isLoading: isFetchingUser,
        refetch: refreshUser,
    } = useQuery({
        queryKey: ['state', 'auth'],
        refetchInterval: 60000,
        refetchIntervalInBackground: false,
        async queryFn() {
            const [res] = await surreal.query<
                [AnyUser & { scope: string }]
            >(/* surrealql */ `
                IF $auth THEN 
                    SELECT *, meta::tb(id) AS scope FROM ONLY $auth
                ELSE
                    RETURN NONE
                END;
            `);

            return res;
        },
    });

    const { mutate: signout, isPending: isSigningOut } = useMutation({
        mutationKey: ['state', 'auth'],
        async mutationFn() {
            await Promise.allSettled([
                fetch('/api/auth/token', { method: 'DELETE' }),
                surreal.invalidate(),
            ]);

            queryClient.setQueryData(['state', 'auth'], null);
        },
    });

    const loading = isFetchingUser || isSigningOut;

    return {
        loading,
        user,
        refreshUser: async () => {
            await refreshUser();
        },
        signout: async () => {
            await signout();
        },
    } satisfies AuthStore;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const state = useCreateAuthState();

    return (
        <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
    );
}

export function useAuth({ authRequired }: { authRequired?: boolean } = {}) {
    const router = useRouter();
    const pathname = usePathname();
    const state = useContext(AuthContext);

    useEffect(() => {
        if (authRequired && !state.loading && !state.user)
            router.push(
                '/account/signin?' +
                    new URLSearchParams({
                        followup: pathname,
                    })
            );
    }, [authRequired, state, router, pathname]);

    return state;
}
