import { Admin } from '@/schema/admin';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
    buildTableFilters,
    isNoneValue,
    SurrealInstance as surreal,
} from '../Surreal';

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
        queryKey: ['events', filters],
        queryFn: async () => {
            const result = await surreal.query<[Admin[]]>(
                `SELECT * FROM admin ${await buildAdminFilters(
                    filters
                )} ORDER BY created ASC`,
                { filters }
            );

            if (!result?.[0]?.result) return null;
            return z.array(Admin).parse(result[0].result);
        },
    });

export const useAdmin = (filters: {
    id?: Admin['id'];
    email?: Admin['email'];
}) =>
    useQuery({
        queryKey: ['events', filters],
        queryFn: async () => {
            const result = await surreal.query<[Admin[]]>(
                `SELECT * FROM admin ${await buildAdminFilters(filters)}`,
                { filters }
            );

            if (!result?.[0]?.result?.[0]) return null;
            return Admin.parse(result[0].result[0]);
        },
    });
