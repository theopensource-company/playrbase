import { useMutation } from '@tanstack/react-query';
import { TPlayerRecord } from '../../constants/Types/Player.types';
import { SurrealDatabase, SurrealInstance, SurrealNamespace } from '../Surreal';

export const useSignin = () =>
    useMutation({
        mutationFn: async (
            auth: Pick<TPlayerRecord, 'email'> & {
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
