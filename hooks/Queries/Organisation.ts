import { useQuery } from '@tanstack/react-query';
import { TOrganisationRecord } from '../../constants/Types/Organisation.types';
import {
    buildTableFilters,
    isNoneValue,
    SurrealInstance as surreal,
} from '../../lib/Surreal';

export function processOrganisationRecord({
    created,
    updated,
    ...rest
}: TOrganisationRecord) {
    return {
        ...rest,
        created: new Date(created),
        updated: new Date(updated),
    };
}

export const buildOrganisationFilters = buildTableFilters<TOrganisationRecord>(
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
    filters: Partial<Pick<TOrganisationRecord, 'part_of'>> = {}
) =>
    useQuery({
        queryKey: ['events', filters],
        queryFn: async () => {
            const result = await surreal.query<[TOrganisationRecord[]]>(
                `SELECT * FROM organisation ${await buildOrganisationFilters(
                    filters
                )} ORDER BY created ASC`,
                { filters }
            );

            if (!result?.[0]?.result) return null;
            return result[0].result.map(processOrganisationRecord);
        },
    });

export const useOrganisation = (filters: {
    id?: TOrganisationRecord['id'];
    slug?: TOrganisationRecord['slug'];
}) =>
    useQuery({
        queryKey: ['events', filters],
        queryFn: async () => {
            const result = await surreal.query<[TOrganisationRecord[]]>(
                `SELECT * FROM organisation ${await buildOrganisationFilters(
                    filters
                )}`,
                { filters }
            );

            if (!result?.[0]?.result?.[0]) return null;
            return processOrganisationRecord(result[0].result[0]);
        },
    });
