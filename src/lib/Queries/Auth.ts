import { User } from '@/schema/resources/user';
import { useMutation } from '@tanstack/react-query';
import {
    SurrealDatabase,
    SurrealInstance,
    SurrealNamespace,
} from '../../lib/Surreal';

export const useSignin = () =>
    useMutation({
        mutationFn: async (
            auth: Pick<User, 'email'> & {
                password: string;
            }
        ) => {
            const token = await SurrealInstance.signin({
                NS: SurrealNamespace,
                DB: SurrealDatabase,
                SC: 'user',
                ...auth,
            });

            if (token) localStorage.setItem('pusrsess', token);
            return !!token;
        },
    });

export const useSignout = () =>
    useMutation({
        mutationFn: async () => {
            await SurrealInstance.invalidate();
            // FIXME: Remove next line once updated to beta 9.
            location.reload();
            return true;
        },
    });
