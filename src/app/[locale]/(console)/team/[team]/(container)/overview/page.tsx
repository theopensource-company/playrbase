'use client';

import { Profile } from '@/components/cards/profile';
import { AttendsTable } from '@/components/data/attends/table';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { buttonVariants } from '@/components/ui/button';
import { useSurreal } from '@/lib/Surreal';
import { Link } from '@/locales/navigation';
import { RichAttends } from '@/schema/relations/attends';
import { Team } from '@/schema/resources/team';
import { User } from '@/schema/resources/user';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import React from 'react';
import { z } from 'zod';
import { PageTitle } from '../../components/PageTitle';
import { useTranslations } from 'next-intl';
import { title } from 'process';

export default function Account() {
    const t = useTranslations(
        'pages.console.team.overview'
    );
    const params = useParams();
    const slug = Array.isArray(params.team) ? params.team[0] : params.team;

    const { isPending, data } = useData({
        slug,
    });

    if (isPending) return <LoaderOverlay />;
    if (!data?.team) return <NotFoundScreen text={'Not found'} />;

    const { registrations, registration_count, players, player_count, team } =
        data;

    return (
        <div className="flex flex-grow flex-col gap-6 pt-6">
            <PageTitle team={team} title={t('title')} />
            <div className="grid grid-cols-1 gap-16 xl:grid-cols-3">
                <div className="space-y-12 xl:col-span-2">
                    <div className="space-y-6">
                        <div className="flex justify-between gap-8">
                            <h2 className="text-xl font-semibold">
                                {t('registrations')}
                            </h2>
                            <Link
                                href={`/team/${slug}/registrations`}
                                className={buttonVariants({
                                    variant: 'outline',
                                })}
                            >
                                {registration_count >= 6
                                    ? t("registration-count.multiple", {registration_count})
                                    : t("registration-count.single")}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto rounded border">
                            <AttendsTable
                                registrations={registrations}
                                columns={{
                                    in: false,
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="space-y-12">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between gap-8">
                            <h2 className="text-xl font-semibold">{t('members')}</h2>
                            <Link
                                href={`/team/${slug}/members`}
                                className={buttonVariants({
                                    variant: 'outline',
                                })}
                            >
                                {player_count >= 6
                                    ? t("member-count.multiple")
                                    : t("member-count.single")}
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

                    RichAttends[],
                    { count: number }[],

                    ListedMember[],
                    { count: number }[],

                    Team,
                ]
            >(
                /* surql */ `
                    LET $team = SELECT * FROM ONLY type::thing('team', $slug);

                    SELECT * FROM $team.id->attends LIMIT 5 FETCH in, out, players.*;
                    SELECT count() FROM $team.id->attends GROUP ALL;

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

                registrations: z.array(RichAttends).parse(result[1]),
                registration_count: z.number().parse(result[2][0]?.count ?? 0),

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
