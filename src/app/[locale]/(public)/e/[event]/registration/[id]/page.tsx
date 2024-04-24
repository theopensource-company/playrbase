'use client';

import { Avatar } from '@/components/cards/avatar';
import { Banner } from '@/components/cards/banner';
import { Profile, ProfileName } from '@/components/cards/profile';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import {
    DD,
    DDContent,
    DDDescription,
    DDFooter,
    DDTitle,
    DDTrigger,
} from '@/components/ui-custom/dd';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button, buttonVariants } from '@/components/ui/button';
import { useSurreal } from '@/lib/Surreal';
import { cn } from '@/lib/utils';
import { Link } from '@/locales/navigation';
import { Attends, RichAttends } from '@/schema/relations/attends';
import { Event } from '@/schema/resources/event';
import { Organisation } from '@/schema/resources/organisation';
import { linkToProfile } from '@/schema/resources/profile';
import { User } from '@/schema/resources/user';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import React, { Fragment, useCallback, useMemo } from 'react';
import { z } from 'zod';

export default function Page() {
    const router = useRouter();
    const params = useParams();
    const slug = Array.isArray(params.event) ? params.event[0] : params.event;
    const regId = Array.isArray(params.id) ? params.id[0] : params.id;
    const t = useTranslations('pages.e.registration');

    const { isPending, isLoading, data, refetch } = useData({
        slug,
        regId,
    });

    const cannotRemovePlayer = useMemo(
        () =>
            !data ||
            !data.registration.out.options.min_pool_size ||
            data.registration.players.length - 1 <= 0 ||
            data.registration.players.length - 1 <
                data.registration.out.options.min_pool_size,
        [data]
    );

    const cannotAddPlayer = useMemo(
        () =>
            !data ||
            !data.registration.out.options.max_pool_size ||
            data.registration.players.length + 1 >
                data.registration.out.options.max_pool_size,
        [data]
    );

    const surreal = useSurreal();
    const {
        mutateAsync: deleteRegistration,
        isPending: isDeletingRegistration,
    } = useMutation({
        mutationKey: ['registration', 'delete-registration', slug, regId],
        async mutationFn() {
            await surreal.query(
                /* surql */ `delete type::thing("attends", $regId)`,
                {
                    regId,
                }
            );
            router.push(`/e/${slug}`);
        },
    });

    const { mutateAsync: updatePlayers, isPending: isUpdatingPlayers } =
        useMutation({
            mutationKey: ['registration', 'update-player', slug, regId],
            async mutationFn(players: Attends['players']) {
                await surreal.merge(`attends:${slug}`, { players });
                await refetch();
            },
        });

    const addPlayer = useCallback(
        (player: User['id']) => {
            if (!data) return false;
            updatePlayers([
                ...data.registration.players.map(({ id }) => id),
                player,
            ]);
        },
        [data, updatePlayers]
    );

    const removePlayer = useCallback(
        (player: User['id']) => {
            if (!data) return false;
            updatePlayers(
                data.registration.players
                    .map(({ id }) => id)
                    .filter((id) => id !== player)
            );
        },
        [data, updatePlayers]
    );

    if (isPending) return <LoaderOverlay />;
    if (!data) return <NotFoundScreen text={t('not-found')} />;

    const { registration, tournament_path, is_player, can_manage } = data;
    const { out: event, in: registrant, players } = registration;

    return (
        <div className="flex flex-grow flex-col gap-12">
            <div className="relative w-full">
                <Banner
                    profile={event}
                    loading={isPending}
                    className="absolute z-0 aspect-auto h-full w-full rounded-xl"
                />
                {tournament_path.length > 1 && (
                    <div className="absolute left-0 top-0 z-[2] m-5 rounded-lg bg-white/5 px-2 py-1 backdrop-blur">
                        <Breadcrumb>
                            <BreadcrumbList>
                                {tournament_path.map((item, i) =>
                                    item.id == event.id ? (
                                        <BreadcrumbItem key={item.id}>
                                            <BreadcrumbPage className="text-white">
                                                {item.name}
                                            </BreadcrumbPage>
                                        </BreadcrumbItem>
                                    ) : (
                                        <Fragment key={item.id}>
                                            <BreadcrumbItem>
                                                <BreadcrumbLink
                                                    className="flex items-center gap-2 text-white/60 hover:text-white"
                                                    href={
                                                        linkToProfile(
                                                            item,
                                                            'public'
                                                        ) ?? ''
                                                    }
                                                >
                                                    {i == 0 && (
                                                        <Avatar
                                                            profile={item}
                                                            size="extra-tiny"
                                                        />
                                                    )}
                                                    {item.name}
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator />
                                        </Fragment>
                                    )
                                )}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                )}
                <div className="relative z-[1] flex w-full flex-wrap items-center justify-between gap-8 bg-gradient-to-t from-black to-transparent p-6 pb-8 pt-36">
                    <div className="flex flex-wrap items-center gap-4">
                        <Avatar
                            profile={event}
                            renderBadge={false}
                            className="h-10 w-10 md:h-14 md:w-14"
                        />
                        <h1 className="text-xl font-semibold md:text-2xl">
                            <ProfileName profile={event} />
                        </h1>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href={`/e/${slug}`}
                            className={cn(
                                buttonVariants({ variant: 'ghost' }),
                                'bg-white/10 backdrop-blur hover:bg-white/20'
                            )}
                        >
                            {t('banner.view')}
                        </Link>
                        {(is_player || can_manage) && (
                            <DD>
                                <DDTrigger asChild>
                                    <Button variant="destructive">
                                        {t('banner.unregister.trigger')}
                                    </Button>
                                </DDTrigger>
                                <DDContent>
                                    <DDTitle>
                                        {t('banner.unregister.dialog.title')}
                                    </DDTitle>
                                    <DDDescription>
                                        {t(
                                            'banner.unregister.dialog.description'
                                        )}
                                    </DDDescription>
                                    <DDFooter>
                                        <Button
                                            variant="destructive"
                                            onClick={() => deleteRegistration()}
                                            disabled={isDeletingRegistration}
                                        >
                                            {t(
                                                'banner.unregister.dialog.submit'
                                            )}
                                        </Button>
                                    </DDFooter>
                                </DDContent>
                            </DD>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid gap-16 md:grid-cols-2">
                <div className="space-y-8">
                    <h2 className="pb-2 text-2xl font-semibold">
                        {t('title')}
                    </h2>
                    <div className="space-y-1">
                        <h3 className="text-md font-semibold">
                            {t('details.confirmed.label')}
                        </h3>
                        <p className="text-sm text-foreground/75">
                            {registration.confirmed
                                ? t('details.confirmed.yes')
                                : t('details.confirmed.no')}
                        </p>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-md font-semibold">
                            {t('details.registered-as')}
                        </h3>
                        <Profile profile={registrant} size="tiny" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-md font-semibold">
                            {t('details.players.label')}
                        </h3>
                        <div className="flex flex-col gap-2">
                            {players.map((player) => (
                                <div
                                    key={player.id}
                                    className="flex items-center justify-between gap-4"
                                >
                                    <Profile profile={player} size="tiny" />
                                    {is_player &&
                                        (players.find(
                                            ({ id }) => id == player.id
                                        ) ? (
                                            <Button
                                                onClick={() =>
                                                    removePlayer(player.id)
                                                }
                                                disabled={
                                                    isUpdatingPlayers ||
                                                    isLoading ||
                                                    cannotRemovePlayer
                                                }
                                                variant="destructive"
                                                size="sm"
                                            >
                                                {t('details.players.remove')}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() =>
                                                    addPlayer(player.id)
                                                }
                                                disabled={
                                                    isUpdatingPlayers ||
                                                    isLoading ||
                                                    cannotAddPlayer
                                                }
                                                size="sm"
                                            >
                                                {t('details.players.add')}
                                            </Button>
                                        ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <h2 className="pb-2 text-2xl font-semibold">
                        {t('details.about.label')}
                    </h2>
                    {event.computed.description && (
                        <p className="text-foreground/75">
                            {event.computed.description}
                        </p>
                    )}
                    {event.start && (
                        <div className="space-y-1">
                            <h3 className="text-md font-semibold">
                                {t('details.about.start')}
                            </h3>
                            <p className="text-sm text-foreground/75">
                                <DateTooltip date={event.start} />
                            </p>
                        </div>
                    )}
                    {event.end && (
                        <div className="space-y-1">
                            <h3 className="text-md font-semibold">
                                {t('details.about.end')}
                            </h3>
                            <p className="text-sm text-foreground/75">
                                <DateTooltip date={event.end} />
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const TournamentPath = z.array(Event);
type TournamentPath = z.infer<typeof TournamentPath>;

function useData({
    slug,
    regId,
}: {
    slug: Organisation['slug'];
    regId: string;
}) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['organisation', 'event-registration', slug, regId],
        retry: false,
        throwOnError: true,
        queryFn: async () => {
            const result = await surreal.query<
                [null, RichAttends | null, TournamentPath, boolean, boolean]
            >(
                /* surql */ `
                    LET $registration = SELECT * FROM ONLY type::thing('attends', $regId) 
                        WHERE out = type::thing('event', $slug)
                        FETCH in, out, players.*;

                    $registration;
                    SELECT * FROM $registration.out.tournament_path ?? [];
                    $auth IN $registration.players.id;
                    $auth IN $registration.out.organiser.managers[?role IN ['owner', 'administrator', 'event_manager']].user;
                `,
                {
                    slug,
                    regId,
                }
            );

            if (!result?.[1]) return null;
            console.log(result[2]);

            return {
                registration: RichAttends.parse(result[1]),
                tournament_path: TournamentPath.parse(result[2]),
                is_player: !!result[3],
                can_manage: !!result[4],
            };
        },
    });
}
