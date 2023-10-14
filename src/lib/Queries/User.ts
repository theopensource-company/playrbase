import { User } from '@/schema/resources/user';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { buildTableFilters, isNoneValue, surreal } from '../Surreal';

export const buildUserFilters = buildTableFilters<User>(
    async (property, filters) => {
        const computeValue = () =>
            isNoneValue(property, filters) ? 'NONE' : `$filters.${property}`;

        switch (property) {
            default:
                return `${property} = ${computeValue()}`;
        }
    }
);

export const useUsers = (filters: Partial<Pick<User, 'name' | 'email'>> = {}) =>
    useQuery({
        queryKey: ['events', filters],
        queryFn: async () => {
            const result = await surreal.query<[User[]]>(
                `SELECT * FROM user ${await buildUserFilters(
                    filters
                )} ORDER BY created ASC`,
                { filters }
            );

            if (!result?.[0]?.result) return null;
            return z.array(User).parse(result[0].result);
        },
    });

export const useUser = (filters: { id?: User['id']; email?: User['email'] }) =>
    useQuery({
        queryKey: ['events', filters],
        queryFn: async () => {
            const result = await surreal.query<[User[]]>(
                `SELECT * FROM user ${await buildUserFilters(filters)}`,
                { filters }
            );

            if (!result?.[0]?.result?.[0]) return null;
            return User.parse(result[0].result[0]);
        },
    });
