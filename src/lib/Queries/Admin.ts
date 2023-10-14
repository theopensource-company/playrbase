import { Admin } from '@/schema/resources/admin';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { buildTableFilters, isNoneValue, surreal } from '../Surreal';

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
) =>
    useQuery({
        queryKey: ['admins', filters],
        queryFn: async (): Promise<Admin[]> => {
            const result = await surreal.query<[Admin[]]>(
                `SELECT * FROM admin ${await buildAdminFilters(
                    filters
                )} ORDER BY created ASC`,
                { filters }
            );

            if (result?.[0]?.detail) throw new Error(result[0].detail);
            if (!result?.[0]?.result) return [];
            return z.array(Admin).parse(result[0].result);
        },
    });

export const useAdmin = (filters: {
    id?: Admin['id'];
    email?: Admin['email'];
}) =>
    useQuery({
        queryKey: ['admin', filters],
        queryFn: async () => {
            const result = await surreal.query<[Admin[]]>(
                `SELECT * FROM admin ${await buildAdminFilters(filters)}`,
                { filters }
            );

            if (result?.[0]?.detail) throw new Error(result[0].detail);
            if (!result?.[0]?.result?.[0]) return null;
            return Admin.parse(result[0].result[0]);
        },
    });

export const useUpdateAdmin = (id: Admin['id']) =>
    useMutation({
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

export const useCreateAdmin = () =>
    useMutation({
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
