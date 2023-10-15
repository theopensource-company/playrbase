'use client';

import { Admin } from '@/schema/resources/admin';
import { User } from '@/schema/resources/user';
import React, { ReactNode, createContext, useContext, useState } from 'react';
import { useSurreal } from './Surreal';

type AnyUser = User | Admin;

export type AuthStore = {
    user?: AnyUser & { scope: string };
    loading: boolean;
    setUser: (user: AnyUser & { scope: string }) => void;
    refreshUser: () => Promise<void>;
    signout: () => Promise<void>;
};

export const AuthContext = createContext<AuthStore>({
    loading: true,
    setUser() {},
    async refreshUser() {},
    async signout() {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const surreal = useSurreal();
    const [state, setState] = useState<AuthStore>({
        loading: true,
        setUser(user: AnyUser & { scope: string }) {
            setState({ ...state, loading: false, user });
        },
        async refreshUser() {
            await surreal
                .query<[(AnyUser & { scope: string })[]]>(
                    /* surrealql */ `
            IF $auth THEN 
                SELECT *, meta::tb(id) AS scope FROM $auth
            ELSE
                RETURN []
            END;
        `
                )
                .then((res) => {
                    const user = res?.[0]?.result?.[0];
                    if (res?.[0]?.status === 'OK' && user) {
                        setState({ ...state, user, loading: false });
                    } else {
                        setState({ ...state, loading: false });
                    }
                });
        },
        async signout() {
            setState({
                ...state,
                user: undefined,
                loading: true,
            });

            await Promise.all([
                fetch('/api/auth/token', { method: 'DELETE' }),
                surreal.invalidate(),
            ]);

            setState({
                ...state,
                user: undefined,
                loading: false,
            });
        },
    });

    return (
        <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
