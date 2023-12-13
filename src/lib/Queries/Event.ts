import { Event } from '@/schema/resources/event';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    buildTableFilters,
    displayAsSurrealQL,
    isNoneValue,
    useSurreal,
} from '../../lib/Surreal';

export function processEventRecord({
    created,
    updated,
    start,
    end,
    ...rest
}: Event) {
    return {
        ...rest,
        created: new Date(created),
        updated: new Date(updated),
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
    };
}

export const buildEventFilters = buildTableFilters<Event>(
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
        Pick<Event, 'organiser' | 'tournament' | 'root_for_org'>
    > = {}
) => {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['events', filters],
        queryFn: async () => {
            const result = await surreal.query<[Event[]]>(
                `SELECT * FROM event ${await buildEventFilters(
                    filters
                )} ORDER BY created ASC`,
                { filters }
            );

            if (!result?.[0]) return null;
            return result[0].map(processEventRecord);
        },
    });
};

export const useUpdateEvent = (id: Event['id']) => {
    const surreal = useSurreal();
    return useMutation({
        mutationKey: ['event', id],
        mutationFn: async (
            changes: Partial<
                Pick<
                    Event,
                    | 'name'
                    | 'description'
                    | 'banner'
                    | 'start'
                    | 'end'
                    | 'discoverable'
                    | 'published'
                    | 'tournament'
                    | 'options'
                >
            >
        ) => {
            const result = await surreal.query<[Event[]]>(/* surql */ `
                UPDATE type::thing('event', ${JSON.stringify(
                    id
                )}) MERGE ${displayAsSurrealQL(changes)}
            `);

            if (!result?.[0]?.[0]) return null;
            return Event.parse(result[0][0]);
        },
    });
};
