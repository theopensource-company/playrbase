'use client';

import { Profile } from '@/components/cards/profile';
import { AttendsTable } from '@/components/data/attends/table';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { Pagination, usePagination } from '@/components/logic/Pagination';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSurreal } from '@/lib/Surreal';
import { Link } from '@/locales/navigation';
import { RichAttends } from '@/schema/relations/attends';
import { linkToProfile } from '@/schema/resources/profile';
import { Team } from '@/schema/resources/team';
import { User } from '@/schema/resources/user';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';
import { z } from 'zod';

export default function AccountRegistrations() {
    const pagination = usePagination();

    const t = useTranslations('pages.console.organisation.events');
    const { isPending, data, refetch, error } = useData({
        pagination,
    });
    console.log(error);

    if (isPending) return <LoaderOverlay />;
    if (!data) return <NotFoundScreen text={t('not_found')} />;

    const { registrations, count, actors } = data;
    const currentActor = actors.find(({ type }) => type == 'user');

    return (
        <div className="flex flex-grow flex-col gap-6 pt-6">
            <div className="flex justify-start gap-4 pb-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="space-x-2">
                            <Profile
                                profile={currentActor}
                                noSub
                                size="extra-tiny"
                                renderBadge={false}
                            />
                            <ChevronsUpDown size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {actors.map((actor) => {
                            const isCurrent = actor.type == 'user';
                            return (
                                <Link
                                    key={actor.id}
                                    href={
                                        linkToProfile(actor, 'registrations') ??
                                        ''
                                    }
                                >
                                    <DropdownMenuItem className="flex justify-between gap-4">
                                        <Profile
                                            profile={actor}
                                            noSub
                                            size="extra-tiny"
                                            renderBadge={false}
                                        />
                                        <div className="w-4">
                                            {isCurrent && <Check size={16} />}
                                        </div>
                                    </DropdownMenuItem>
                                </Link>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                    <RefreshCw size={20} />
                </Button>
            </div>
            <div className="rounded-md border">
                <AttendsTable
                    registrations={registrations ?? []}
                    columns={{
                        in: false,
                        players: false,
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
    published,
    discoverable,
    pagination: { start, limit },
}: {
    published?: boolean;
    discoverable?: boolean;
    pagination: {
        start: number;
        limit: number;
    };
}) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['account', 'registrations', { start, limit }],
        retry: false,
        queryFn: async () => {
            const result = await surreal.query<
                [RichAttends[], { count: number }[], (User | Team)[]]
            >(
                /* surql */ `
                    SELECT *, out.*, out.start, in.*, players.* FROM $auth->attends
                        ORDER BY out.start
                        START $start
                        LIMIT $limit;

                    SELECT count() FROM $auth->attends 
                        GROUP ALL;

                    SELECT * FROM $auth, $auth->plays_in->team;
                `,
                {
                    published,
                    discoverable,
                    start,
                    limit,
                }
            );

            if (!result?.[0] || !result?.[1] || !result?.[2]) return null;

            return {
                count: z.number().parse(result[1][0]?.count ?? 0),
                registrations: z.array(RichAttends).parse(result[0]),
                actors: z.array(z.union([User, Team])).parse(result[2]),
            };
        },
    });
}
