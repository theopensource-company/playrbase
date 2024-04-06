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
import { Button, buttonVariants } from '@/components/ui/button';
import { useSurreal } from '@/lib/Surreal';
import { cn } from '@/lib/utils';
import { Link } from '@/locales/navigation';
import { Attends, RichAttends } from '@/schema/relations/attends';
import { Event } from '@/schema/resources/event';
import { Organisation } from '@/schema/resources/organisation';
import { User } from '@/schema/resources/user';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useMemo } from 'react';

export default function Page() {
    const router = useRouter();
    const params = useParams();
    const slug = Array.isArray(params.event) ? params.event[0] : params.event;
    const regId = Array.isArray(params.id) ? params.id[0] : params.id;

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
            await surreal.delete(`attends:${slug}`);
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
    if (!data) return <NotFoundScreen text="Registration not found" />;

    const { registration, main_tournament, is_player, can_manage } = data;
    const { out: event, in: registrant, players } = registration;

    return (
        <div className="flex flex-grow flex-col gap-12">
            <div className="relative w-full">
                <Banner
                    profile={event}
                    loading={isPending}
                    className="absolute z-0 aspect-auto h-full w-full rounded-xl"
                />
                {main_tournament && (
                    <div className="absolute left-0 top-0 z-[2] m-5 rounded-lg p-1 pl-2 backdrop-blur-lg">
                        <Profile
                            profile={main_tournament}
                            size="extra-tiny"
                            noSub
                            renderBadge={false}
                            clickable
                        />
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
                            View event
                        </Link>
                        {(is_player || can_manage) && (
                            <DD>
                                <DDTrigger asChild>
                                    <Button variant="destructive">
                                        Unregister
                                    </Button>
                                </DDTrigger>
                                <DDContent>
                                    <DDTitle>Are you sure?</DDTitle>
                                    <DDDescription>
                                        If you decide you still want to play
                                        after unregistering, you might need to
                                        wait for approval by the organiser.
                                    </DDDescription>
                                    <DDFooter>
                                        <Button
                                            variant="destructive"
                                            onClick={() => deleteRegistration()}
                                            disabled={isDeletingRegistration}
                                        >
                                            I no longer want to participate
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
                        Registration
                    </h2>
                    <div className="space-y-1">
                        <h3 className="text-md font-semibold">Confirmed</h3>
                        <p className="text-sm text-foreground/75">
                            {registration.confirmed ? 'Yes' : 'No'}
                        </p>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-md font-semibold">Registered as</h3>
                        <Profile profile={registrant} size="tiny" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-md font-semibold">Players</h3>
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
                                                Remove
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
                                                Add
                                            </Button>
                                        ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <h2 className="pb-2 text-2xl font-semibold">
                        About the event
                    </h2>
                    {event.computed.description && (
                        <p className="text-foreground/75">
                            {event.computed.description}
                        </p>
                    )}
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
                </div>
            </div>
        </div>
    );
}

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
                [null, RichAttends | null, Event, boolean, boolean]
            >(
                /* surql */ `
                    LET $registration = SELECT * FROM ONLY type::thing('attends', $regId) 
                        WHERE out = type::thing('event', $slug)
                        FETCH in, out, players.*;

                    $registration;
                    $registration.out.computed.tournament.*;
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
                main_tournament: Event.optional().parse(result[2] ?? undefined),
                is_player: !!result[3],
                can_manage: !!result[4],
            };
        },
    });
}
