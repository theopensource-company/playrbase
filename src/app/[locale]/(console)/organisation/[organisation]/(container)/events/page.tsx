'use client';

import { EventGrid } from '@/components/data/events/cards';
import { CreateEvent } from '@/components/data/events/create';
import {
    EventFilters,
    useEventFilters,
} from '@/components/data/events/filters';
import { EventTable } from '@/components/data/events/table';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { Pagination, usePagination } from '@/components/logic/Pagination';
import { Button } from '@/components/ui/button';
import { useSurreal } from '@/lib/Surreal';
import { cn } from '@/lib/utils';
import { Event } from '@/schema/resources/event';
import { Organisation } from '@/schema/resources/organisation';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, List, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { z } from 'zod';
import { PageTitle } from '../../components/PageTitle';

export default function Account() {
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;

    const [view, setView] = useState<'table' | 'cards'>('table');
    const eventFilters = useEventFilters();
    const pagination = usePagination();

    const t = useTranslations('pages.console.organisation.events');
    const { isPending, data, refetch } = useData({
        slug,
        pagination,
        ...eventFilters,
    });

    if (isPending) return <LoaderOverlay />;
    if (!data?.organisation) return <NotFoundScreen text={t('not_found')} />;

    const { events, count, organisation } = data;

    return (
        <div className="flex flex-grow flex-col gap-6 pt-6">
            <PageTitle organisation={organisation} title={t('title')}>
                <CreateEvent onSuccess={refetch} organiser={organisation} />
            </PageTitle>
            <div className="flex justify-start gap-4 pb-2">
                <EventFilters filters={eventFilters} />
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                    <RefreshCw size={20} />
                </Button>
                <div className="flex h-10 items-center gap-1 rounded-md border px-1">
                    <Button
                        onClick={() => setView('table')}
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'h-8 w-8 rounded-sm',
                            view == 'table' &&
                                'bg-accent text-accent-foreground'
                        )}
                    >
                        <List size={18} />
                    </Button>
                    <Button
                        onClick={() => setView('cards')}
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'h-8 w-8 rounded-sm',
                            view == 'cards' &&
                                'bg-accent text-accent-foreground'
                        )}
                    >
                        <LayoutGrid size={18} />
                    </Button>
                </div>
            </div>
            <div>
                {view == 'table' ? (
                    <div className="rounded-md border">
                        <EventTable
                            organisation_slug={slug}
                            events={events ?? []}
                        />
                    </div>
                ) : (
                    <EventGrid
                        organisationSlug={slug}
                        manageButton
                        viewButton
                        events={events ?? []}
                    />
                )}
            </div>
            <div className="flex items-center justify-end gap-10 pt-2">
                <Pagination pagination={pagination} count={count} />
            </div>
        </div>
    );
}

const OrgCanManage = Organisation.extend({
    can_manage: z.boolean(),
});

type OrgCanManage = z.infer<typeof OrgCanManage>;

function useData({
    slug,
    rootForOrg,
    published,
    discoverable,
    pagination: { start, limit },
}: {
    slug: Organisation['slug'];
    rootForOrg?: Event['root_for_org'];
    published?: boolean;
    discoverable?: boolean;
    pagination: {
        start: number;
        limit: number;
    };
}) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: [
            'organisation',
            'events',
            slug,
            { rootForOrg, published, discoverable },
            { start, limit },
        ],
        retry: false,
        queryFn: async () => {
            const result = await surreal.query<
                [null[], Event[], { count: number }[], OrgCanManage]
            >(
                /* surql */ `
                    LET $org = 
                        SELECT
                            *,
                            $auth.id IN managers[?role IN ["owner", "administrator", "event_manager"]].user as can_manage
                        FROM ONLY organisation 
                            WHERE slug = $slug
                            LIMIT 1;

                    SELECT * FROM event 
                        WHERE organiser = $org.id
                            AND $root_for_org IN [root_for_org, NONE]
                            AND $published IN [published, NONE]
                            AND $discoverable IN [discoverable, NONE]
                        START $start
                        LIMIT $limit;

                    SELECT count() FROM event 
                        WHERE organiser = $org.id
                            AND $root_for_org IN [root_for_org, NONE]
                            AND $published IN [published, NONE]
                            AND $discoverable IN [discoverable, NONE]
                        GROUP ALL;

                    $org;
                `,
                {
                    slug,
                    root_for_org: rootForOrg,
                    published,
                    discoverable,
                    start,
                    limit,
                }
            );

            if (!result?.[1] || !result?.[2] || !result?.[3]) return null;

            return {
                organisation: OrgCanManage.parse(result[3]),
                count: z.number().parse(result[2][0]?.count ?? 0),
                events: z.array(Event).parse(result[1]),
            };
        },
    });
}
