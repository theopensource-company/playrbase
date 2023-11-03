import { Admin } from '@/schema/resources/admin';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { buildTableFilters, isNoneValue, useSurreal } from '../Surreal';

export const buildAdminFilters = buildTableFilters<Admin>(
    async (property, filters) => {
        const computeValue = () =>
            isNoneValue(property, filters) ? 'NONE' : `$filters.${property}`;

        switch (property) {
            default:
                return `${property} = ${computeValue()}`;
        }
    }
);

export const useAdmins = (
    filters: Partial<Pick<Admin, 'name' | 'email'>> = {}
) => {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['admins', filters],
        queryFn: async (): Promise<Admin[]> => {
            const result = await surreal.query<[Admin[]]>(
                `SELECT * FROM admin ${await buildAdminFilters(
                    filters
                )} ORDER BY created ASC`,
                { filters }
            );

            if (!result?.[0]) return [];
            return z.array(Admin).parse(result[0]);
        },
    });
};

export const useAdmin = (filters: {
    id?: Admin['id'];
    email?: Admin['email'];
}) => {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['admin', filters],
        queryFn: async () => {
            const result = await surreal.query<[Admin[]]>(
                `SELECT * FROM admin ${await buildAdminFilters(filters)}`,
                { filters }
            );

            if (!result?.[0]?.[0]) return null;
            return Admin.parse(result[0][0]);
        },
    });
};

export const useUpdateAdmin = (id: Admin['id']) => {
    const surreal = useSurreal();
    return useMutation({
        mutationKey: ['admin', id],
        mutationFn: async (
            changes: Partial<Pick<Admin, 'name' | 'email' | 'profile_picture'>>
        ) => {
            const result = await surreal.merge<Admin, typeof changes>(
                id,
                changes
            );

            if (!result?.[0]) throw new Error('Could not update admin');
            return Admin.parse(result[0]);
        },
    });
};

export const useCreateAdmin = () => {
    const surreal = useSurreal();
    return useMutation({
        mutationKey: ['admin'],
        mutationFn: async (
            changes: Pick<Admin, 'name' | 'email'> &
                Partial<Pick<Admin, 'profile_picture'>>
        ) => {
            const result = await surreal.create<Admin, typeof changes>(
                'admin',
                changes
            );

            if (!result?.[0]) throw new Error('Could not create admin');
            return Admin.parse(result[0]);
        },
    });
};
