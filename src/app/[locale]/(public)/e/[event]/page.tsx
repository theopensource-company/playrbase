'use client';

import { Avatar } from '@/components/cards/avatar';
import { Profile, ProfileName } from '@/components/cards/profile';
import { EventGrid } from '@/components/data/events/cards';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { Pagination, usePagination } from '@/components/logic/Pagination';
import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import { buttonVariants } from '@/components/ui/button';
import { useSurreal } from '@/lib/Surreal';
import { Link } from '@/locales/navigation';
import { Event } from '@/schema/resources/event';
import {
    Organisation,
    OrganisationSafeParse,
} from '@/schema/resources/organisation';
import { linkToProfile } from '@/schema/resources/profile';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { z } from 'zod';

export default function Page() {
    const params = useParams();
    const slug = Array.isArray(params.event) ? params.event[0] : params.event;

    const order = useState<'desc' | 'asc'>('desc');
    const pagination = usePagination({ defaultPageSize: 4 });
    const { isPending, data } = useData({
        slug,
        order: order[0],
        pagination,
    });

    if (isPending) return <LoaderOverlay />;

    if (!data || !data.event) return <NotFoundScreen text="Event not found" />;

    const { event, organiser, count, events, tournament } = data;

    return (
        <div className="flex flex-grow flex-col gap-6">
            <div className="flex justify-between pb-4">
                <div className="flex items-center gap-4">
                    <Avatar profile={event} renderBadge={false} size="big" />
                    <h1 className="text-2xl font-semibold">
                        <ProfileName profile={event} />
                    </h1>
                </div>
                <div className="flex gap-4">
                    {event.can_manage && (
                        <Link
                            href={linkToProfile(event, 'manage') ?? ''}
                            className={buttonVariants({ variant: 'outline' })}
                        >
                            Manage
                        </Link>
                    )}
                    {event.can_manage && (
                        <Link
                            href={`/flow/event-signup/${event.id.slice(6)}`}
                            className={buttonVariants()}
                        >
                            Register
                        </Link>
                    )}
                </div>
            </div>
            <div className="flex flex-col-reverse gap-12 md:flex-row md:gap-16">
                {events.length > 0 && (
                    <div className="flex-[3] space-y-6">
                        <div className="flex items-center justify-between pb-2">
                            <h2 className="text-2xl font-semibold">Events</h2>
                            <Pagination
                                count={count}
                                pagination={pagination}
                                pageSizeAdjustable={false}
                            />
                        </div>
                        <EventGrid events={events} viewButton narrow />
                    </div>
                )}
                <div className="max-w-2xl flex-[2] space-y-6">
                    <h2 className="pb-2 text-2xl font-semibold">About</h2>
                    {event.start && (
                        <div className="space-y-1">
                            <h3 className="text-md font-semibold">
                                Start of event
                            </h3>
                            <p className="text-sm text-foreground/75">
                                <DateTooltip date={event.start} />
                            </p>
                        </div>
                    )}
                    {event.end && (
                        <div className="space-y-1">
                            <h3 className="text-md font-semibold">
                                End of event
                            </h3>
                            <p className="text-sm text-foreground/75">
                                <DateTooltip date={event.end} />
                            </p>
                        </div>
                    )}
                    {event.description && (
                        <div className="space-y-1">
                            <h3 className="text-md font-semibold">
                                Description
                            </h3>
                            <p className="text-sm text-foreground/75">
                                {event.description}
                            </p>
                        </div>
                    )}
                    {tournament && (
                        <div className="space-y-3">
                            <h3 className="text-md font-semibold">Part of</h3>
                            <div className="flex flex-col gap-3">
                                <Profile
                                    key={tournament.id}
                                    profile={tournament}
                                    size="extra-tiny"
                                    noSub
                                    renderBadge={false}
                                    clickable
                                />
                            </div>
                        </div>
                    )}
                    <div className="space-y-3">
                        <h3 className="text-md font-semibold">Organiser</h3>
                        <div className="flex flex-col gap-3">
                            <Profile
                                key={organiser.id}
                                profile={organiser}
                                size="extra-tiny"
                                noSub
                                renderBadge={false}
                                clickable
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const EventCanManage = Event.extend({
    can_manage: z.boolean(),
});

type EventCanManage = z.infer<typeof EventCanManage>;

function useData({
    slug,
    order,
    pagination: { start, limit },
}: {
    slug: Organisation['slug'];
    order: 'desc' | 'asc';
    pagination: {
        start: number;
        limit: number;
    };
}) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['organisation', 'events', slug, { order, start, limit }],
        retry: false,
        throwOnError: true,
        queryFn: async () => {
            const result = await surreal.query<
                [
                    null,
                    Event[],
                    { count: number }[],
                    EventCanManage,
                    OrganisationSafeParse,
                    Event,
                ]
            >(
                /* surql */ `
                    LET $event = 
                        SELECT
                            *,
                            $auth.id IN organiser.managers[?role IN ["owner", "administrator", "event_manager"]].user as can_manage
                        FROM ONLY type::thing('event', $slug);

                    SELECT * FROM event 
                        WHERE tournament = $event.id
                        ORDER BY start ${order == 'asc' ? 'ASC' : 'DESC'}
                        START $start
                        LIMIT $limit;

                    SELECT count() FROM event 
                        WHERE tournament = $event.id
                        GROUP ALL;

                    $event;
                    SELECT * FROM ONLY $event.organiser;
                    SELECT * FROM ONLY $event.tournament;
                `,
                {
                    slug,
                    order,
                    start,
                    limit,
                }
            );

            if (!result?.[1] || !result?.[2] || !result?.[3]) return null;

            return {
                event: EventCanManage.parse(result[3]),
                organiser: OrganisationSafeParse.parse(result[4]),
                tournament: Event.optional().parse(result[5] ?? undefined),
                count: z.number().parse(result[2][0]?.count ?? 0),
                events: z.array(Event).parse(result[1]),
            };
        },
    });
}
