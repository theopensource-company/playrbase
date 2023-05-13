import { useRouter } from 'next/router';
import React from 'react';
import Container from '../../components/helper/Container';
import { EventModule } from '../../components/modules/EventModule';
import { useEvents } from '../../hooks/Queries/Event';
import { usePublicOrganisation } from '../../hooks/Queries/PublicOrganisation';

export async function getServerSideProps() {
    return {
        props: {
            something: 123,
        },
    };
}

export default function Org({ something }: { something: number }) {
    const { query } = useRouter();
    const orgRawID = (
        query?.id
            ? typeof query?.id == 'object'
                ? query.id[0]
                : query.id
            : undefined
    )
        ?.split(':')
        ?.pop();

    const { data: events, isLoading: areEventsLoading } = useEvents({
        organiser: `organisation:${orgRawID}`,
        root_for_org: true,
    });

    const { data: organisation, isLoading: isOrganisationLoading } =
        usePublicOrganisation(`puborg:${orgRawID}`);

    return (
        <Container className="flex flex-col gap-8">
            {!orgRawID || (!isOrganisationLoading && !organisation) ? (
                <h1 className="text-3xl">Organisation not found</h1>
            ) : areEventsLoading || isOrganisationLoading ? (
                <h1 className="text-3xl">Events are loading</h1>
            ) : (
                <>
                    <h1 className="text-3xl">{organisation?.name}</h1>
                    <div className="grid w-full grid-rows-6 gap-4 xl:grid-cols-2">
                        {events?.map((event) => (
                            <EventModule key={event.id} event={event} />
                        ))}
                    </div>
                    <p>{something}</p>
                </>
            )}
        </Container>
    );
}
