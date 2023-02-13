import { useRouter } from 'next/router';
import React from 'react';
import Container from '../../components/helper/Container';
import { useEvents } from '../../hooks/Queries/Event';
import { usePublicOrganisation } from '../../hooks/Queries/PublicOrganisation';

export default function Org() {
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
        tournament: undefined,
    });

    const { data: organisation, isLoading: isOrganisationLoading } =
        usePublicOrganisation(`puborg:${orgRawID}`);

    return (
        <Container>
            {!orgRawID || (!isOrganisationLoading && !organisation) ? (
                <h1>Organisation not found</h1>
            ) : areEventsLoading || isOrganisationLoading ? (
                <h1>Events are loading</h1>
            ) : (
                <>
                    <h1>Events hosted by {organisation?.name}</h1>
                    {events?.map((event) => (
                        <p key={event.id}>{event.name}</p>
                    ))}
                </>
            )}
        </Container>
    );
}
