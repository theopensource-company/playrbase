'use client';

import { EventTable } from '@/components/data/events/table';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { Pagination, usePagination } from '@/components/logic/Pagination';
import { useSurreal } from '@/lib/Surreal';
import { Event } from '@/schema/resources/event';
import { Organisation } from '@/schema/resources/organisation';
import { Team } from '@/schema/resources/team';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React from 'react';
import { z } from 'zod';
import { PageTitle } from '../../components/PageTitle';

export default function Account() {
    const params = useParams();
    const slug = Array.isArray(params.team) ? params.team[0] : params.team;
    const pagination = usePagination();

    const t = useTranslations('pages.console.organisation.events');
    const { isPending, data } = useData({
        slug,
        pagination,
    });

    if (isPending) return <LoaderOverlay />;
    if (!data?.team) return <NotFoundScreen text={t('not_found')} />;

    const { events, count, team } = data;

    return (
        <div className="flex flex-grow flex-col gap-6 pt-6">
            <PageTitle team={team} title={t('title')} />
            <div className="rounded-md border">
                <EventTable organisation_slug={slug} events={events ?? []} />
            </div>
            <div className="flex items-center justify-end gap-10 pt-2">
                <Pagination pagination={pagination} count={count} />
            </div>
        </div>
    );
}

function useData({
    slug,
    pagination: { start, limit },
}: {
    slug: Organisation['slug'];
    pagination: {
        start: number;
        limit: number;
    };
}) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['team', 'events', slug, { start, limit }],
        retry: false,
        queryFn: async () => {
            const result = await surreal.query<
                [null[], Event[], { count: number }[], Team]
            >(
                /* surql */ `
                    LET $team = 
                        SELECT * FROM ONLY team 
                            WHERE slug = $slug
                            LIMIT 1;

                    SELECT * FROM $team.id->attends->event
                        START $start
                        LIMIT $limit;
                        
                    SELECT count() FROM $team.id->attends->event
                        GROUP ALL;

                    $team;
                `,
                {
                    slug,
                    start,
                    limit,
                }
            );

            if (!result?.[1] || !result?.[2] || !result?.[3]) return null;

            return {
                team: Team.parse(result[3]),
                count: z.number().parse(result[2][0]?.count ?? 0),
                events: z.array(Event).parse(result[1]),
            };
        },
    });
}
