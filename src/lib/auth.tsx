'use client';

import { signout as actionSignout } from '@/actions/auth';
import { Admin } from '@/schema/resources/admin';
import { User } from '@/schema/resources/user';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { ReactNode, createContext, useContext } from 'react';
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

            if (res.status == 'OK') {
                return res.result;
            } else {
                throw new Error(res.detail);
            }
        },
    });

    const { mutate: signout, isPending: isSigningOut } = useMutation({
        mutationKey: ['state', 'auth'],
        async mutationFn() {
            await Promise.all([actionSignout(), surreal.invalidate()]);
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

export function useAuth() {
    return useContext(AuthContext);
}
