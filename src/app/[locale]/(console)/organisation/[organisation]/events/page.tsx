'use client';

import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useSurreal } from '@/lib/Surreal';
import { Event } from '@/schema/resources/event';
import { Organisation } from '@/schema/resources/organisation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React from 'react';
import { z } from 'zod';

export default function Account() {
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;
    const t = useTranslations('pages.console.organisation.events');
    const {
        isPending,
        data,
        // refetch,
    } = useData(slug);

    const organisation = data?.organisation;
    const events = data?.events;

    return isPending ? (
        <LoaderOverlay />
    ) : organisation ? (
        <div className="flex max-w-2xl flex-grow flex-col gap-6 pt-6">
            <h1 className="pb-6 text-3xl font-semibold">{t('title')}</h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {events?.map((event) => (
                        <TableRow key={event.id}>
                            <TableCell>{event.name}</TableCell>
                            <TableCell>{event.category}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    ) : (
        <NotFoundScreen text={t('not_found')} />
    );
}

const OrgCanManage = Organisation.extend({
    can_manage: z.boolean(),
});

type OrgCanManage = z.infer<typeof OrgCanManage>;

function useData(slug: Organisation['slug']) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['organisation', 'events', slug],
        queryFn: async () => {
            const result = await surreal.query<[null[], Event[], OrgCanManage]>(
                /* surql */ `
                    LET $org = 
                        SELECT
                            *,
                            $auth.id IN managers[?role IN ["owner", "administrator", "event_manager"]].user as can_manage
                        FROM ONLY organisation 
                            WHERE slug = $slug
                            LIMIT 1;

                    SELECT * FROM event WHERE organiser = $org.id;

                    $org;
                `,
                { slug }
            );

            if (!result?.[1] || !result?.[2]) return null;

            return {
                organisation: OrgCanManage.parse(result[2]),
                events: z.array(Event).parse(result[1]),
            };
        },
    });
}
