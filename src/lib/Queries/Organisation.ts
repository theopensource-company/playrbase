import {
    Organisation,
    OrganisationSafeParse,
} from '@/schema/resources/organisation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { buildTableFilters, isNoneValue, useSurreal } from '../../lib/Surreal';

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
) => {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['organisations', filters],
        queryFn: async () => {
            const result = await surreal.query<[Organisation[]]>(
                `SELECT * FROM organisation ${await buildOrganisationFilters(
                    filters
                )} ORDER BY created ASC`,
                { filters }
            );

            if (!result?.[0]) return null;
            return z.array(Organisation).parse(result[0]);
        },
    });
};

export const useOrganisation = <
    T extends OrganisationSafeParse = OrganisationSafeParse,
>(filters: {
    id?: Organisation['id'];
    slug?: Organisation['slug'];
}) => {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['organisation', filters],
        queryFn: async () => {
            const result = await surreal.query<[T[]]>(
                `SELECT * FROM organisation ${await buildOrganisationFilters(
                    filters
                )}`,
                { filters }
            );

            if (!result?.[0]?.[0]) return null;
            return OrganisationSafeParse.parse(result[0][0]) as T;
        },
    });
};

export const useUpdateOrganisation = (id: Organisation['id']) => {
    const surreal = useSurreal();
    return useMutation({
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
                    | 'part_of'
                >
            >
        ) => {
            if (changes.email) changes.email = changes.email.toLowerCase();
            const result = await surreal.merge<Organisation, typeof changes>(
                id,
                changes
            );

            if (!result?.[0]) return null;
            return Organisation.parse(result[0]);
        },
    });
};
