import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';
import Container from '../../components/helper/Container';
import { EventModule } from '../../components/modules/EventModule';
import { TEventRecord } from '../../constants/Types/Events.types';
import { TPublicOrganisationRecord } from '../../constants/Types/PublicOrganisation.types';
import { SurrealInstance as surreal } from '../../lib/Surreal';

export default function Org() {
    const { query } = useRouter();
    const slug = query?.slug
        ? typeof query?.slug == 'object'
            ? query.slug[0]
            : query.slug
        : undefined;

    const { data, isLoading } = useData(slug);
    const organisation = data?.[0] ?? null;
    const events = data?.[1] ?? [];

    return (
        <Container className="flex flex-col gap-8">
            {!slug || (!isLoading && !organisation) ? (
                <h1 className="text-3xl">Organisation not found</h1>
            ) : isLoading ? (
                <h1 className="text-3xl">Events are loading</h1>
            ) : (
                <>
                    <h1 className="text-3xl">{organisation?.name}</h1>
                    <div className="grid w-full grid-rows-6 gap-4 xl:grid-cols-2">
                        {events?.map((event) => (
                            <EventModule key={event.id} event={event} />
                        ))}
                    </div>
                </>
            )}
        </Container>
    );
}

function useData(slug?: string) {
    return useQuery({
        queryKey: ['custom', 'org/[slug]', slug],
        queryFn: async () => {
            const result = await surreal.query<
                [[TPublicOrganisationRecord | null, TEventRecord[]]]
            >(
                /* surrealql */ `
                    BEGIN;
                    LET $org = (SELECT * FROM puborg WHERE slug = $slug)[0];
                    LET $events = SELECT * FROM event WHERE organiser = type::thing('organisation', meta::id($org.id)) AND root_for_org = true;
                    RETURN [$org, $events];
                    COMMIT;
                `,
                { slug }
            );

            return result[0]?.result;
        },
    });
}
