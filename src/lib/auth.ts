'use client';

import { SurrealInstance as surreal } from '@/lib/Surreal';
import { Admin } from '@/schema/admin';
import { User } from '@/schema/user';
import { create } from 'zustand';

type AnyUser = User | Admin;

export type AuthStore = {
    user?: AnyUser & { scope: string };
    loading: boolean;
    setUser: (user: AnyUser & { scope: string }) => void;
    refreshUser: () => void;
    signout: () => void;
};

export const useAuth = create<AuthStore>((set) => {
    function updateAuth() {
        surreal
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
                    set(() => ({ user, loading: false }));
                } else {
                    set(() => ({ loading: false }));
                }
            });
    }

    return {
        loading: true,
        setUser: (user) => set(() => ({ user, loading: false })),
        refreshUser: () => updateAuth(),
        signout: async () => {
            set(() => ({
                user: undefined,
                loading: true,
            }));

            await Promise.all([
                fetch('/api/auth/signout'),
                surreal.invalidate(),
            ]);

            set(() => ({
                user: undefined,
                loading: false,
            }));
        },
    };
});
