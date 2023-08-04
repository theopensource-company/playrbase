import { Organisation } from '@/schema/organisation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
    buildTableFilters,
    isNoneValue,
    SurrealInstance as surreal,
} from '../../lib/Surreal';

export const buildOrganisationFilters = buildTableFilters<Organisation>(
    async (property, filters) => {
        const computeValue = () =>
            isNoneValue(property, filters) ? 'NONE' : `$filters.${property}`;

        switch (property) {
            default:
                return `${property} = ${computeValue()}`;
        }
    }
);

export const useOrganisations = (
    filters: Partial<Pick<Organisation, 'part_of'>> = {}
) =>
    useQuery({
        queryKey: ['organisations', filters],
        queryFn: async () => {
            const result = await surreal.query<[Organisation[]]>(
                `SELECT * FROM organisation ${await buildOrganisationFilters(
                    filters
                )} ORDER BY created ASC`,
                { filters }
            );

            if (!result?.[0]?.result) return null;
            return z.array(Organisation).parse(result[0].result);
        },
    });

export const useOrganisation = (filters: {
    id?: Organisation['id'];
    slug?: Organisation['slug'];
}) =>
    useQuery({
        queryKey: ['organisation', filters],
        queryFn: async () => {
            const result = await surreal.query<[Organisation[]]>(
                `SELECT * FROM organisation ${await buildOrganisationFilters(
                    filters
                )}`,
                { filters }
            );

            if (!result?.[0]?.result?.[0]) return null;
            return Organisation.parse(result[0].result[0]);
        },
    });

export const useUpdateOrganisation = (id: Organisation['id']) =>
    useMutation({
        mutationKey: ['organisation', id],
        mutationFn: async (
            changes: Partial<
                Pick<
                    Organisation,
                    | 'name'
                    | 'description'
                    | 'website'
                    | 'email'
                    | 'logo'
                    | 'banner'
                    | 'slug'
                    | 'tier'
                    | 'manager_roles'
                    | 'part_of'
                >
            >
        ) => {
            const result = await surreal.merge<Organisation, typeof changes>(
                id,
                changes
            );

            if (!result?.[0]) return null;
            return Organisation.parse(result[0]);
        },
    });
