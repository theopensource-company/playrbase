'use client';

import { Avatar } from '@/components/cards/avatar';
import { Banner } from '@/components/cards/banner';
import { Profile } from '@/components/cards/profile';
import Container from '@/components/layout/Container';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useSurreal } from '@/lib/Surreal';
import { useAuth } from '@/lib/auth';
import { Link, useRouter } from '@/locales/navigation';
import { Attends } from '@/schema/relations/attends';
import { Event } from '@/schema/resources/event';
import { linkToProfile } from '@/schema/resources/profile';
import { Team } from '@/schema/resources/team';
import { User, UserAsRelatedUser } from '@/schema/resources/user';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Baby, Clock, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

export default function Page() {
    const params = useParams();
    const slug = Array.isArray(params.event) ? params.event[0] : params.event;
    const { isPending, data } = useData({ slug });
    const { user, loading: userLoading } = useAuth({ authRequired: true });

    if (!data) return 'event not found';
    if (!user) return 'user not found';

    return (
        <Container>
            {!user ? (
                <p>User not found</p>
            ) : !data ? (
                <p>Event not found</p>
            ) : (
                <Render data={data} />
            )}
            <LoaderOverlay
                show={isPending || data.event.is_tournament || userLoading}
            />
        </Container>
    );
}

export function Render({
    data,
}: {
    data: Exclude<ReturnType<typeof useData>['data'], undefined>;
}) {
    const { event, tournament, self_eligable, teams } = data;
    const router = useRouter();
    const { user } = useAuth({ authRequired: true });

    const eligable = useMemo(
        () =>
            [self_eligable && user, ...teams].filter(
                (a): a is Team | (User & { scope: 'user' }) => !!a
            ),
        [teams, self_eligable, user]
    );

    const [actor, setActorInternal] = useQueryState('actor', parseAsString);
    const [players, setPlayers] = useQueryState(
        'players',
        parseAsArrayOf(parseAsString).withDefault([])
    );

    const { data: eligableTeamPlayers } = useEligablePlayers({
        event: event.id,
        actor: actor as User['id'] | Team['id'],
    });

    const setActor = useCallback(
        (actor: string) => {
            setActorInternal(actor);
            setPlayers([]);
            setSection(
                eligableTeamPlayers?.length == event.options.min_pool_size
                    ? 'confirm'
                    : 'players'
            );
        },
        [setActorInternal, setPlayers, eligableTeamPlayers, event]
    );

    const playersValid = useMemo(() => {
        if (!players) return false;
        if (players.length == 0) return false;

        const n = players.length;
        const min = event.options.min_pool_size;
        const max = event.options.max_pool_size;
        return (!min || n >= min) && (!max || n <= max);
    }, [players, event]);

    const sectionsDone = useMemo(
        () => ({
            actor: !!actor,
            players: playersValid,
            confirm: false,
        }),
        [actor, playersValid]
    );

    const sectionsAvailable = useMemo(
        () => ({
            actor: true,
            players:
                sectionsDone.actor &&
                !(eligableTeamPlayers?.length == event.options.min_pool_size),
            confirm: sectionsDone.players,
        }),
        [sectionsDone, eligableTeamPlayers, event]
    );

    const [section, setSection] = useState<keyof typeof sectionsDone>(
        Object.entries(sectionsDone).find(
            ([_, v]) => !v
        )?.[0] as keyof typeof sectionsDone
    );

    const attemptSection = useCallback(
        (section: string) => {
            if (sectionsAvailable[section as keyof typeof sectionsAvailable]) {
                setSection(section as keyof typeof sectionsDone);
            }
        },
        [sectionsAvailable, setSection]
    );

    useEffect(() => {
        if (event.is_tournament) {
            router.push(linkToProfile(event, 'public') ?? '/');
        }
    }, [event, router]);

    useEffect(() => {
        if (eligable.length == 1) {
            setActor(eligable[0].id);
        }
    }, [eligable, setActor]);

    useEffect(() => {
        if (!actor && eligable.length == 1) {
            setActor(eligable[0].id);
        }
    }, [actor, eligable, setActor]);

    useEffect(() => {
        if (players?.length == 0 && eligableTeamPlayers) {
            if (eligableTeamPlayers.length == 1) {
                setPlayers([eligableTeamPlayers[0].id]);
            } else if (
                eligableTeamPlayers.length == event.options.min_pool_size
            ) {
                setPlayers(eligableTeamPlayers.map(({ id }) => id));
            } else {
                return;
            }

            setSection('confirm');
        }
    }, [players, event, eligableTeamPlayers, setPlayers]);

    const actorProfile = eligable.find(({ id }) => id == actor) ?? undefined;
    const playerProfiles =
        players?.map(
            (p) => eligableTeamPlayers?.find(({ id }) => p == id) ?? undefined
        ) ?? [];

    const surreal = useSurreal();
    const { mutateAsync, data: confirmation } = useMutation({
        mutationKey: [
            'flow',
            'register-event',
            'signup',
            event.id,
            actor,
            players,
        ],
        async mutationFn() {
            try {
                const [_1, _2, _3, result] = await surreal.query<
                    [null, null, null, [Attends]]
                >(
                    /* surql */ `
                        LET $event = <record<event>> $event;
                        LET $actor = <record<team | user>> $actor;
                        LET $players = <array<record<user>>> $players;
                        RELATE $actor->attends->$event SET players = $players;
                    `,
                    {
                        event: event.id,
                        actor,
                        players,
                    }
                );

                return Attends.parse(result[0]);
            } catch (e) {
                console.log(e, {
                    event: event.id,
                    actor,
                    players,
                });
                return false;
            }
        },
    });

    const registration_overview = (
        <div className="space-y-8">
            <div className="space-y-4">
                <h2 className="text-1xl font-semibold">Playing as</h2>
                <Profile profile={actorProfile} size="small" />
            </div>
            {!actor?.startsWith('user:') && (
                <div className="space-y-4">
                    <h2 className="text-1xl font-semibold">Playing with</h2>
                    <div className="space-y-2">
                        {playerProfiles.map((profile, i) => (
                            <Profile
                                key={profile?.id ?? i}
                                profile={profile}
                                size="small"
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-12">
            <div className="relative w-full">
                <Banner
                    profile={event}
                    className="absolute z-0 aspect-auto h-full w-full rounded-xl"
                />
                {tournament && (
                    <div className="absolute left-0 top-0 z-[2] m-5 rounded-lg p-1 pl-2 backdrop-blur-lg">
                        <Profile
                            profile={tournament}
                            size="extra-tiny"
                            noSub
                            renderBadge={false}
                            clickable
                        />
                    </div>
                )}
                <div className="relative z-[1] w-full bg-gradient-to-t from-black to-transparent p-6 pb-8 pt-32">
                    <div className="flex flex-wrap items-end justify-between gap-8">
                        <div>
                            <h1 className="text-xl font-semibold drop-shadow-2xl md:truncate md:text-2xl">
                                Register for {event.name}
                            </h1>
                            {(event.start ||
                                event.end ||
                                event.options.min_pool_size ||
                                event.options.max_pool_size ||
                                event.options.min_age ||
                                event.options.max_age) && (
                                <div className="flex flex-col gap-1 pt-2 text-sm opacity-70">
                                    {event.start && (
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} className="mr-1" />
                                            <DateTooltip date={event.start} />
                                            {event.end && (
                                                <>
                                                    <span>-</span>
                                                    <DateTooltip
                                                        date={event.end}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {(event.options.min_pool_size ||
                                        event.options.max_pool_size) && (
                                        <div className="flex items-center gap-1">
                                            <Users size={14} className="mr-1" />
                                            {event.options.min_pool_size &&
                                            event.options.max_pool_size ? (
                                                <>
                                                    {
                                                        event.options
                                                            .min_pool_size
                                                    }
                                                    <span>-</span>
                                                    {
                                                        event.options
                                                            .max_pool_size
                                                    }
                                                </>
                                            ) : event.options.min_pool_size ? (
                                                <>
                                                    <span>&gt;</span>
                                                    {
                                                        event.options
                                                            .min_pool_size
                                                    }
                                                </>
                                            ) : (
                                                <>
                                                    <span>&lt;</span>
                                                    {
                                                        event.options
                                                            .max_pool_size
                                                    }
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {(event.options.min_age ||
                                        event.options.max_age) && (
                                        <div className="flex items-center gap-1">
                                            <Baby size={14} className="mr-1" />
                                            {event.options.min_age &&
                                            event.options.max_age ? (
                                                <>
                                                    {event.options.min_age}
                                                    <span>-</span>
                                                    {event.options.max_age}
                                                </>
                                            ) : event.options.min_age ? (
                                                <>
                                                    <span>&gt;</span>
                                                    {event.options.min_age}
                                                </>
                                            ) : (
                                                <>
                                                    <span>&lt;</span>
                                                    {event.options.max_age}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <Link
                            href={`/e/${event.id.slice(6)}`}
                            className={buttonVariants({ size: 'sm' })}
                        >
                            View event
                        </Link>
                    </div>
                </div>
            </div>
            {confirmation ? (
                <>
                    {confirmation.confirmed ? (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold">
                                You&apos;re in! 🎉
                            </h2>
                            <p>
                                Your registration is confirmed by the organiser.
                                Make sure to save the details down below
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold">
                                Awaiting confirmation
                            </h2>
                            <p>
                                We are waiting for the organiser to confirm your
                                registration. In the meantime, save the details
                                down below
                            </p>
                        </div>
                    )}
                    {registration_overview}
                </>
            ) : (
                <Accordion
                    type="single"
                    value={section}
                    onValueChange={attemptSection}
                    className="sm:px-6"
                >
                    <AccordionItem
                        value="actor"
                        disabled={!sectionsAvailable.actor}
                    >
                        <AccordionTrigger>
                            <div className="flex items-center gap-4">
                                1. Who is signin up?
                                {actor && (
                                    <div className="rounded-md p-1">
                                        <Profile
                                            size="extra-tiny"
                                            renderBadge={false}
                                            profile={actorProfile}
                                            noSub
                                        />
                                    </div>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6">
                            {eligable.length == 0 ? (
                                <p>
                                    You are not eligable to sign up for this
                                    event.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead />
                                            <TableHead>Name</TableHead>
                                            <TableHead>Kind</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {eligable.map((profile) => (
                                            <TableRow key={profile.id}>
                                                <TableCell>
                                                    <Avatar
                                                        profile={profile}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {profile.name}
                                                </TableCell>
                                                <TableCell>
                                                    {profile.type == 'team'
                                                        ? 'Team'
                                                        : 'Your account'}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        disabled={
                                                            profile.id == actor
                                                        }
                                                        variant={
                                                            profile.id == actor
                                                                ? 'secondary'
                                                                : 'default'
                                                        }
                                                        onClick={() =>
                                                            setActor(profile.id)
                                                        }
                                                    >
                                                        {profile.id == actor
                                                            ? 'Selected'
                                                            : 'Continue'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                            <Button
                                size="sm"
                                disabled={!actor}
                                onClick={() =>
                                    setSection(
                                        eligableTeamPlayers?.length ==
                                            event.options.min_pool_size
                                            ? 'confirm'
                                            : 'players'
                                    )
                                }
                            >
                                Continue
                            </Button>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                        value="players"
                        disabled={!sectionsAvailable.players}
                    >
                        <AccordionTrigger>
                            <div className="flex select-none items-center gap-4">
                                2. Who is playing
                                {(playerProfiles?.length ?? 0) > 0 && (
                                    <div className="rounded-md p-1">
                                        {playerProfiles?.length == 1 ? (
                                            <Profile
                                                size="extra-tiny"
                                                renderBadge={false}
                                                profile={playerProfiles[0]}
                                                noSub
                                            />
                                        ) : (
                                            <div className="flex -space-x-2">
                                                {playerProfiles?.map(
                                                    (profile, i) => (
                                                        <Avatar
                                                            key={
                                                                profile?.id ?? i
                                                            }
                                                            profile={profile}
                                                            className="inline-block"
                                                            size="extra-tiny"
                                                        />
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead />
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {eligableTeamPlayers?.map((profile) => {
                                        const selected = !!players?.find(
                                            (id) => id == profile.id
                                        );

                                        const onClick = () =>
                                            setPlayers(
                                                selected
                                                    ? players?.filter(
                                                          (id) =>
                                                              id != profile.id
                                                      ) ?? []
                                                    : [
                                                          ...(players ?? []),
                                                          profile.id,
                                                      ]
                                            );

                                        return (
                                            <TableRow key={profile.id}>
                                                <TableCell>
                                                    <Avatar
                                                        profile={profile}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {profile.name}
                                                </TableCell>
                                                <TableCell>
                                                    {profile.email}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        variant={
                                                            selected
                                                                ? 'destructive'
                                                                : 'default'
                                                        }
                                                        onClick={onClick}
                                                    >
                                                        {selected
                                                            ? 'Remove'
                                                            : 'Add'}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            <Button
                                size="sm"
                                disabled={!playersValid}
                                onClick={() => setSection('confirm')}
                            >
                                Continue
                            </Button>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem
                        value="confirm"
                        className="border-b-0"
                        disabled={!sectionsAvailable.confirm}
                    >
                        <AccordionTrigger>
                            3. Confirm registration
                        </AccordionTrigger>
                        <AccordionContent className="space-y-6">
                            <p>
                                Confirm that the details for your registration
                                are all correct to confirm your registration
                            </p>
                            {registration_overview}
                            <div className="pt-4">
                                <Button onClick={() => mutateAsync()}>
                                    Confirm registration
                                </Button>
                                {confirmation === false
                                    ? 'Failed to register'
                                    : confirmation
                                      ? 'Registration confirmed!'
                                      : null}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </div>
    );
}

function useData({ slug }: { slug: string }) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['flow', 'register-event', slug],
        retry: false,
        throwOnError: true,
        queryFn: async () => {
            const result = await surreal.query<
                [null, null, null, Event, Event | null, Team[], boolean]
            >(
                /* surql */ `
                    LET $event = SELECT * FROM ONLY type::thing('event', $slug);
                    LET $tournament = $event.tournament.*;
                    LET $teams = SELECT * FROM $auth->plays_in->team WHERE fn::team::eligable_to_play(id, $event.id);
                
                    $event;
                    $tournament;
                    $teams;
                    fn::team::eligable_to_play($auth, $event.id);
                `,
                {
                    slug,
                }
            );

            return {
                event: Event.parse(result[3]),
                tournament: Event.optional().parse(result[4]),
                teams: z.array(Team).parse(result[5]),
                self_eligable: z.boolean().parse(result[6]),
            };
        },
    });
}

function useEligablePlayers({
    actor,
    event,
}: {
    actor: Team['id'] | User['id'] | undefined;
    event: Event['id'] | undefined;
}) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['flow', 'register-event', 'eligable-players', event, actor],
        retry: false,
        throwOnError: true,
        queryFn: async () => {
            if (!actor || !event) return [];

            const result = await surreal.query<
                [null, null, UserAsRelatedUser[]]
            >(
                /* surql */ `
                    LET $actor = <record<team | user>> $actor;
                    LET $event = <record<event>> $event;
                    SELECT * FROM fn::team::compute_eligable_players($actor, $event);
                `,
                {
                    actor,
                    event,
                }
            );

            return z.array(UserAsRelatedUser).parse(result[2]);
        },
    });
}
