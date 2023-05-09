import { useQuery } from '@tanstack/react-query';
import { TPublicOrganisationRecord } from '../../constants/Types/PublicOrganisation.types';
import {
    buildTableFilters,
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

export const buildOrganisationFilters =
    buildTableFilters<TPublicOrganisationRecord>(async (property) => {
        switch (property) {
            default:
                return `${property} = $${property}`;
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

export const usePublicOrganisation = (id: TPublicOrganisationRecord['id']) =>
    useQuery({
        queryKey: ['events', id],
        queryFn: async () => {
            const result = await surreal.query<[TPublicOrganisationRecord[]]>(
                `SELECT * FROM puborg WHERE id = $id`,
                { id }
            );

            if (!result?.[0]?.result?.[0]) return null;
            return processPublicOrganisationRecord(result[0].result[0]);
        },
    });
