import { useQuery } from '@tanstack/react-query';
import { SurrealInstance, buildTableFilters } from '../../lib/Surreal';
import { TOrganisationRecord } from '../../constants/Types/Organisation.types';

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
    async (property) => {
        switch (property) {
            default:
                return `${property} = $${property}`;
        }
    }
);

export const useOrganisations = (
    filters: Partial<Pick<TOrganisationRecord, 'master_organisation'>> = {}
) =>
    useQuery({
        queryKey: ['events', filters],
        queryFn: async () => {
            const result =
                await SurrealInstance.opiniatedQuery<TOrganisationRecord>(
                    `SELECT * FROM organisation ${await buildOrganisationFilters(
                        filters
                    )} ORDER BY created ASC`,
                    filters
                );

            if (!result?.[0]?.result) return null;
            return result[0].result.map(processOrganisationRecord);
        },
    });

export const useOrganisation = (id: TOrganisationRecord['id']) =>
    useQuery({
        queryKey: ['events', id],
        queryFn: async () => {
            const result =
                await SurrealInstance.opiniatedQuery<TOrganisationRecord>(
                    `SELECT * FROM organisation WHERE id = $id`,
                    { id }
                );

            if (!result?.[0]?.result?.[0]) return null;
            return processOrganisationRecord(result[0].result[0]);
        },
    });
