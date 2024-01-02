'use client';

import { Profile } from '@/components/cards/profile';
import { EventTable } from '@/components/data/events/table';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { buttonVariants } from '@/components/ui/button';
import { useSurreal } from '@/lib/Surreal';
import { Link } from '@/locales/navigation';
import { Event } from '@/schema/resources/event';
import { Team } from '@/schema/resources/team';
import { User } from '@/schema/resources/user';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import React from 'react';
import { z } from 'zod';
import { PageTitle } from '../../components/PageTitle';

export default function Account() {
    const params = useParams();
    const slug = Array.isArray(params.team) ? params.team[0] : params.team;

    const { isPending, data } = useData({
        slug,
    });

    if (isPending) return <LoaderOverlay />;
    if (!data?.team) return <NotFoundScreen text={'Not found'} />;

    const { events, event_count, players, player_count, team } = data;

    return (
        <div className="flex flex-grow flex-col gap-6 pt-6">
            <PageTitle team={team} title="Overview" />
            <div className="grid grid-cols-1 gap-16 xl:grid-cols-3">
                <div className="space-y-12 xl:col-span-2">
                    <div className="space-y-6">
                        <div className="flex justify-between gap-8">
                            <h2 className="text-xl font-semibold">Events</h2>
                            <Link
                                href={`/team/${slug}/events`}
                                className={buttonVariants({
                                    variant: 'outline',
                                })}
                            >
                                {event_count >= 6
                                    ? `View all ${event_count} events`
                                    : 'View all events'}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto rounded border">
                            <EventTable
                                organisation_slug={slug}
                                events={events}
                                columns={{
                                    published: false,
                                    discoverable: false,
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="space-y-12">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between gap-8">
                            <h2 className="text-xl font-semibold">Members</h2>
                            <Link
                                href={`/team/${slug}/members`}
                                className={buttonVariants({
                                    variant: 'outline',
                                })}
                            >
                                {player_count >= 6
                                    ? `View all ${player_count} members`
                                    : 'View all members'}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </div>
                        <div className="flex flex-col gap-4 rounded border p-4">
                            {players.map((player) => {
                                const user = player as unknown as User;
                                return (
                                    <Profile
                                        key={player.id}
                                        profile={user}
                                        size="small"
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ListedMember = User.pick({
    id: true,
    name: true,
    profile_picture: true,
});

type ListedMember = z.infer<typeof ListedMember>;

function useData({ slug }: { slug: Team['slug'] }) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['organisation', 'overview', slug],
        retry: false,
        throwOnError: true,
        queryFn: async () => {
            const result = await surreal.query<
                [
                    null,

                    Event[],
                    { count: number }[],

                    ListedMember[],
                    { count: number }[],

                    Team,
                ]
            >(
                /* surql */ `
                    LET $team = SELECT * FROM ONLY type::thing('team', $slug);

                    SELECT * FROM $team.id->attends->event LIMIT 5;
                    SELECT count() FROM $team.id->attends->event GROUP ALL;

                    SELECT id, name, profile_picture FROM $team.players;
                    SELECT count() FROM $team.players GROUP ALL;

                    $team;
                `,
                {
                    slug,
                }
            );

            if (
                !result?.[1] ||
                !result?.[2] ||
                !result?.[3] ||
                !result?.[4] ||
                !result?.[5]
            )
                return null;

            return {
                team: Team.parse(result[5]),

                events: z.array(Event).parse(result[1]),
                event_count: z.number().parse(result[2][0]?.count ?? 0),

                players: z.array(ListedMember).parse(
                    result[3].map((u) => ({
                        ...u,
                        profile_picture: u.profile_picture || undefined,
                    }))
                ),
                player_count: z.number().parse(result[4][0]?.count ?? 0),
            };
        },
    });
}
