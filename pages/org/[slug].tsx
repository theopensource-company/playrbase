import { useRouter } from 'next/router';
import React from 'react';
import Container from '../../components/helper/Container';
import { EventModule } from '../../components/modules/EventModule';
import { TOrganisationID } from '../../constants/Types/Organisation.types';
import { useEvents } from '../../hooks/Queries/Event';
import { usePublicOrganisation } from '../../hooks/Queries/PublicOrganisation';

export default function Org() {
    const { query } = useRouter();
    const slug = query?.slug
        ? typeof query?.slug == 'object'
            ? query.slug[0]
            : query.slug
        : undefined;

    const { data: organisation, isLoading: isOrganisationLoading } =
        usePublicOrganisation({ slug });

    const { data: events, isLoading: areEventsLoading } = useEvents({
        organiser: organisation
            ? (['organisation', ...organisation.id.split(':').slice(1)].join(
                  ':'
              ) as TOrganisationID)
            : undefined,
        root_for_org: true,
    });

    return (
        <Container className="flex flex-col gap-8">
            {!slug || (!isOrganisationLoading && !organisation) ? (
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
                </>
            )}
        </Container>
    );
}
