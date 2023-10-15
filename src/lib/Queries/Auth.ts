import { User } from '@/schema/resources/user';
import { useMutation } from '@tanstack/react-query';
import { database, namespace, useSurreal } from '../../lib/Surreal';

export const useSignin = () => {
    const surreal = useSurreal();
    return useMutation({
        mutationFn: async (
            auth: Pick<User, 'email'> & {
                password: string;
            }
        ) => {
            const token = await surreal.signin({
                NS: namespace,
                DB: database,
                SC: 'user',
                ...auth,
            });

            if (token) localStorage.setItem('pusrsess', token);
            return !!token;
        },
    });
};

export const useSignout = () => {
    const surreal = useSurreal();
    return useMutation({
        mutationFn: async () => {
            await surreal.invalidate();
            // FIXME: Remove next line once updated to beta 9.
            location.reload();
            return true;
        },
    });
};
