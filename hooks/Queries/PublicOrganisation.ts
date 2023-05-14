import { useQuery } from '@tanstack/react-query';
import { TPublicOrganisationRecord } from '../../constants/Types/PublicOrganisation.types';
import {
    buildTableFilters,
    isNoneValue,
    SurrealInstance as surreal,
} from '../../lib/Surreal';

export function processPublicOrganisationRecord({
    created,
    ...rest
}: TPublicOrganisationRecord) {
    return {
        ...rest,
        created: new Date(created),
    };
}

export const buildPublicOrganisationFilters =
    buildTableFilters<TPublicOrganisationRecord>(async (property, filters) => {
        const computeValue = () =>
            isNoneValue(property, filters) ? 'NONE' : `$filters.${property}`;

        switch (property) {
            default:
                return `${property} = ${computeValue()}`;
        }
    });

export const usePublicOrganisations = () =>
    useQuery({
        queryKey: ['events'],
        queryFn: async () => {
            const result = await surreal.query<[TPublicOrganisationRecord[]]>(
                `SELECT * FROM puborg ORDER BY created ASC`
            );

            if (!result?.[0]?.result) return null;
            return result[0].result.map(processPublicOrganisationRecord);
        },
    });

export const usePublicOrganisation = (filters: {
    id?: TPublicOrganisationRecord['id'];
    slug?: TPublicOrganisationRecord['slug'];
}) =>
    useQuery({
        queryKey: ['events', filters],
        queryFn: async () => {
            const result = await surreal.query<[TPublicOrganisationRecord[]]>(
                `SELECT * FROM puborg ${await buildPublicOrganisationFilters(
                    filters
                )}`,
                { filters }
            );

            if (!result?.[0]?.result?.[0]) return null;
            return processPublicOrganisationRecord(result[0].result[0]);
        },
    });
