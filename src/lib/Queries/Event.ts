import { useQuery } from '@tanstack/react-query';
import { TEventRecord } from '../../constants/Types/Events.types';
import {
    buildTableFilters,
    isNoneValue,
    SurrealInstance as surreal,
} from '../../lib/Surreal';

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
    async (property, filters) => {
        const computeValue = () =>
            isNoneValue(property, filters) ? 'NONE' : `$filters.${property}`;

        switch (property) {
            default:
                return `${property} = ${computeValue()}`;
        }
    }
);

export const useEvents = (
    filters: Partial<
        Pick<TEventRecord, 'organiser' | 'tournament' | 'root_for_org'>
    > = {}
) =>
    useQuery({
        queryKey: ['events', filters],
        queryFn: async () => {
            const result = await surreal.query<[TEventRecord[]]>(
                `SELECT * FROM event ${await buildEventFilters(
                    filters
                )} ORDER BY created ASC`,
                { filters }
            );

            if (!result?.[0]?.result) return null;
            return result[0].result.map(processEventRecord);
        },
    });
