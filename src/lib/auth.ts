'use client';

import { TAdminRecord } from '@/constants/Types/Admin.types';
import { TManagerRecord } from '@/constants/Types/Manager.types';
import { TPlayerRecord } from '@/constants/Types/Player.types';
import { SurrealInstance as surreal } from '@/lib/Surreal';
import { create } from 'zustand';

type AnyUser = TAdminRecord | TManagerRecord | TPlayerRecord;

export type AuthStore = {
    user?: AnyUser;
    loading: boolean;
    setUser: (user: AnyUser) => void;
    refreshUser: () => void;
};

export const useAuth = create<AuthStore>((set) => {
    function updateAuth() {
        surreal
            .info<AnyUser>()
            .then((user) => set(() => ({ user, loading: false })));
    }

    setInterval(updateAuth, 60000);
    if (typeof window != 'undefined') {
        window.addEventListener('focus', updateAuth, false);
    }

    updateAuth();

    return {
        loading: true,
        setUser: (user) => set(() => ({ user, loading: false })),
        refreshUser: () => updateAuth(),
    };
});
