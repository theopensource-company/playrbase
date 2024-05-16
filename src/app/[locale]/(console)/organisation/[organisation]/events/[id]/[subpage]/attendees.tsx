'use client';

import { AttendsTable } from '@/components/data/attends/table';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { Pagination, usePagination } from '@/components/logic/Pagination';
import { Button } from '@/components/ui/button';
import { useSurreal } from '@/lib/Surreal';
import { RichAttends } from '@/schema/relations/attends';
import { Event } from '@/schema/resources/event';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';
import { z } from 'zod';

export default function EventAttendeesTab({ event }: { event: Event }) {
    const pagination = usePagination();

    const t = useTranslations('pages.console.organisation.events');
    const { isPending, data, refetch, error } = useData({
        event: event.id,
        pagination,
    });
    console.log(error);

    if (isPending) return <LoaderOverlay />;
    if (!data) return <NotFoundScreen text={t('not_found')} />;

    const { attendees, count } = data;

    return (
        <div className="flex flex-grow flex-col gap-6 pt-6">
            <div className="flex justify-start gap-4 pb-2">
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                    <RefreshCw size={20} />
                </Button>
            </div>
            <div className="rounded-md border">
                <AttendsTable
                    registrations={attendees ?? []}
                    columns={{
                        out: event.is_tournament,
                        end: false,
                        updated: false,
                    }}
                />
            </div>
            <div className="flex items-center justify-end gap-10 pt-2">
                <Pagination pagination={pagination} count={count} />
            </div>
        </div>
    );
}

function useData({
    event,
    published,
    discoverable,
    pagination: { start, limit },
}: {
    event: Event['id'];
    published?: boolean;
    discoverable?: boolean;
    pagination: {
        start: number;
        limit: number;
    };
}) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['organisation', 'event-attendees', event, { start, limit }],
        retry: false,
        queryFn: async () => {
            console.log(0);
            const result = await surreal.query<
                [null[], RichAttends[], { count: number }[]]
            >(
                /* surql */ `
                    LET $event = <record<event>> $event;

                    SELECT *, out.start, in.name FROM attends
                        WHERE $event IN tournament_path
                        ORDER BY out.start, in.name
                        START $start
                        LIMIT $limit
                        FETCH in, out, players.*;

                    SELECT count() FROM attends 
                        WHERE $event IN tournament_path
                        GROUP ALL;
                `,
                {
                    event,
                    published,
                    discoverable,
                    start,
                    limit,
                }
            );

            console.log(1, result);
            if (!result?.[1] || !result?.[2]) return null;

            return {
                count: z.number().parse(result[2][0]?.count ?? 0),
                attendees: z.array(RichAttends).parse(result[1]),
            };
        },
    });
}
