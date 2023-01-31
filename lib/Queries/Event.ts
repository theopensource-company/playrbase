import { useQuery } from '@tanstack/react-query';
import { SurrealInstance, buildTableFilters } from '../Surreal';
import { TEventRecord } from '../../constants/Types/Events.types';

export function processEventRecord({
    created,
    updated,
    start,
    end,
    ...rest
}: TEventRecord) {
    return {
        ...rest,
        created: new Date(created),
        updated: new Date(updated),
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
    };
}

export const buildEventFilters = buildTableFilters<TEventRecord>(
    async (property) => {
        switch (property) {
            default:
                return `${property} = $${property}`;
        }
    }
);

export const useEvents = (
    filters: Partial<Pick<TEventRecord, 'organiser' | 'tournament'>> = {}
) =>
    useQuery({
        queryKey: ['events', filters],
        queryFn: async () => {
            const result = await SurrealInstance.opiniatedQuery<TEventRecord>(
                `SELECT * FROM event ${await buildEventFilters(
                    filters
                )} ORDER BY created ASC`,
                filters
            );

            if (!result?.[0]?.result) return null;
            return result[0].result.map(processEventRecord);
        },
    });
