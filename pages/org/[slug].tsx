import { GetServerSideProps } from 'next';
import React from 'react';
import Container from '../../components/helper/Container';
import { EventModule } from '../../components/modules/EventModule';
import { TEventRecord } from '../../constants/Types/Events.types';
import { TPublicOrganisationRecord } from '../../constants/Types/PublicOrganisation.types';
import { SurrealInstance as surreal } from '../../lib/Surreal';

type Props = {
    organisation: TPublicOrganisationRecord | null;
    events: TEventRecord[];
};

export default function Org({ organisation, events }: Props) {
    return (
        <Container className="flex flex-col gap-8">
            {!organisation ? (
                <h1 className="text-3xl">Organisation not found</h1>
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

export const getServerSideProps: GetServerSideProps<Props> = async (
    context
) => {
    const slug = context.query.slug
        ? typeof context.query.slug == 'object'
            ? context.query.slug[0]
            : context.query.slug
        : undefined;

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

    const organisation = result[0]?.result?.[0] ?? null;
    const events = result[0]?.result?.[1] ?? [];

    return {
        props: {
            organisation,
            events,
        },
    };
};
