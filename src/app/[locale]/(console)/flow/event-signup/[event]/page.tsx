'use client';

import { Avatar } from '@/components/cards/avatar';
import { Banner } from '@/components/cards/banner';
import { Profile } from '@/components/cards/profile';
import { CreateTeamDialog } from '@/components/data/teams/create';
import Container from '@/components/layout/Container';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useSurreal } from '@/lib/Surreal';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Link, useRouter } from '@/locales/navigation';
import { RichAttends } from '@/schema/relations/attends';
import { Event } from '@/schema/resources/event';
import { linkToProfile } from '@/schema/resources/profile';
import { Team } from '@/schema/resources/team';
import { User, UserAsRelatedUser } from '@/schema/resources/user';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Baby, Clock, Plus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';
import React, {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { z } from 'zod';

export default function Page() {
    const params = useParams();
    const slug = Array.isArray(params.event) ? params.event[0] : params.event;
    const { isPending, data, refetch } = useData({ slug });
    const { user, loading: userLoading } = useAuth({ authRequired: true });
    const t = useTranslations('pages.console.flow.event-signup');

    return (
        <Container>
            {!user ? (
                <NotFoundScreen text={t('user-not-found')} />
            ) : !data ? (
                <NotFoundScreen text={t('event-not-found')} />
            ) : (
                <Render data={data} refetch={refetch} />
            )}
            <LoaderOverlay
                show={isPending || data?.event.is_tournament || userLoading}
            />
        </Container>
    );
}

function Render({
    data,
    refetch,
}: {
    data: Exclude<ReturnType<typeof useData>['data'], undefined>;
    refetch: () => unknown;
}) {
    const t = useTranslations('pages.console.flow.event-signup');
    const [createTeamOpen, setCreateTeamOpen] = useState(false);
    const { event, tournament_path, registration, self_eligable } = data;
    const router = useRouter();
    const { user } = useAuth({ authRequired: true });

    const eligable = useMemo(
        () =>
            [self_eligable && user, ...data.teams].filter(
                (a): a is Team | (User & { scope: 'user' }) => !!a
            ),
        [self_eligable, user, data.teams]
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
                const [_1, _2, _3, _4, result] = await surreal.query<
                    [null, null, null, null, RichAttends]
                >(
                    /* surql */ `
                        LET $event = <record<event>> $event;
                        LET $actor = <record<team | user>> $actor;
                        LET $players = <array<record<user>>> $players;
                        LET $confirmation = RELATE $actor->attends->$event SET players = $players;
                        SELECT * FROM ONLY $confirmation[0].id FETCH in, out, players.*;
                    `,
                    {
                        event: event.id,
                        actor,
                        players,
                    }
                );

                return RichAttends.parse(result);
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

    const showedConfirmation = registration ?? confirmation ?? false;

    return (
        <>
            <CreateTeamDialog
                refetch={refetch}
                open={createTeamOpen}
                setOpen={setCreateTeamOpen}
                trigger={false}
            />
            <div className="space-y-12">
                <div className="relative w-full">
                    <Banner
                        profile={event}
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
                    <div className="relative z-[1] w-full bg-gradient-to-t from-black to-transparent p-6 pb-8 pt-32">
                        <div className="flex flex-wrap items-end justify-between gap-8">
                            <div>
                                <h1 className="text-xl font-semibold drop-shadow-2xl md:truncate md:text-2xl">
                                    {t('banner.title', {
                                        event_name: event.name,
                                    })}
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
                                                <Clock
                                                    size={14}
                                                    className="mr-1"
                                                />
                                                <DateTooltip
                                                    date={event.start}
                                                />
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
                                                <Users
                                                    size={14}
                                                    className="mr-1"
                                                />
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
                                                ) : event.options
                                                      .min_pool_size ? (
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
                                                <Baby
                                                    size={14}
                                                    className="mr-1"
                                                />
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
                                className={cn(
                                    buttonVariants({
                                        size: 'sm',
                                        variant: 'ghost',
                                    }),
                                    'bg-white/10 backdrop-blur hover:bg-white/20'
                                )}
                            >
                                {t('banner.view-event')}
                            </Link>
                        </div>
                    </div>
                </div>
                {showedConfirmation ? (
                    <>
                        {showedConfirmation.confirmed ? (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-semibold">
                                    {t('confirmation.confirmed.title')}
                                </h2>
                                <p>{t('confirmation.confirmed.description')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-semibold">
                                    {t('confirmation.awaiting.title')}
                                </h2>
                                <p>{t('confirmation.awaiting.description')}</p>
                            </div>
                        )}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-1xl font-semibold">
                                    {t('confirmation.playing-as')}
                                </h2>
                                <Profile
                                    profile={showedConfirmation.in}
                                    size="small"
                                />
                            </div>
                            {!showedConfirmation.in.id.startsWith('user:') && (
                                <div className="space-y-4">
                                    <h2 className="text-1xl font-semibold">
                                        {t('confirmation.playing-with')}
                                    </h2>
                                    <div className="space-y-2">
                                        {showedConfirmation.players.map(
                                            (profile) => (
                                                <Profile
                                                    key={profile.id}
                                                    profile={profile}
                                                    size="small"
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <Link
                                className={buttonVariants()}
                                href={`/e/${event.id.slice(
                                    6
                                )}/registration/${showedConfirmation.id.slice(8)}`}
                            >
                                {t('confirmation.manage')}
                            </Link>
                        </div>
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
                                    {t('step1.title')}
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
                                    <div className="space-y-3">
                                        <p>
                                            {t(
                                                'step1.not-eligable.description'
                                            )}
                                        </p>
                                        <p>
                                            {t('step1.not-eligable.new-team')}
                                        </p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead />
                                                <TableHead>
                                                    {t(
                                                        'step1.table-eligable.column.name'
                                                    )}
                                                </TableHead>
                                                <TableHead>
                                                    {t(
                                                        'step1.table-eligable.column.kind'
                                                    )}
                                                </TableHead>
                                                <TableHead>
                                                    {t(
                                                        'step1.table-eligable.column.actions'
                                                    )}
                                                </TableHead>
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
                                                            ? t(
                                                                  'step1.table-eligable.kind.team'
                                                              )
                                                            : t(
                                                                  'step1.table-eligable.kind.your-account'
                                                              )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            size="sm"
                                                            disabled={
                                                                profile.id ==
                                                                actor
                                                            }
                                                            variant={
                                                                profile.id ==
                                                                actor
                                                                    ? 'secondary'
                                                                    : 'default'
                                                            }
                                                            onClick={() =>
                                                                setActor(
                                                                    profile.id
                                                                )
                                                            }
                                                        >
                                                            {profile.id == actor
                                                                ? t(
                                                                      'step1.table-eligable.actions.selected'
                                                                  )
                                                                : t(
                                                                      'step1.table-eligable.actions.continue'
                                                                  )}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                        <TableCaption>
                                            <p>
                                                {t(
                                                    'step1.table-eligable.caption'
                                                )}
                                            </p>
                                        </TableCaption>
                                    </Table>
                                )}
                                <div className="flex gap-4">
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
                                        {t('step1.continue')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setCreateTeamOpen(true)}
                                        variant="outline"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('step1.create-team')}
                                    </Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem
                            value="players"
                            disabled={!sectionsAvailable.players}
                        >
                            <AccordionTrigger>
                                <div className="flex select-none items-center gap-4">
                                    {t('step2.title')}
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
                                                                    profile?.id ??
                                                                    i
                                                                }
                                                                profile={
                                                                    profile
                                                                }
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
                                            <TableHead>
                                                {t('step2.table.column.name')}
                                            </TableHead>
                                            <TableHead>
                                                {t('step2.table.column.email')}
                                            </TableHead>
                                            <TableHead>
                                                {t(
                                                    'step2.table.column.actions'
                                                )}
                                            </TableHead>
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
                                                                  id !=
                                                                  profile.id
                                                          ) ?? []
                                                        : [
                                                              ...(players ??
                                                                  []),
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
                                                                ? t(
                                                                      'step2.table.actions.remove'
                                                                  )
                                                                : t(
                                                                      'step2.table.actions.add'
                                                                  )}
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
                                    {t('step2.continue')}
                                </Button>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem
                            value="confirm"
                            className="border-b-0"
                            disabled={!sectionsAvailable.confirm}
                        >
                            <AccordionTrigger>
                                {t('step3.title')}
                            </AccordionTrigger>
                            <AccordionContent className="space-y-6">
                                <p>{t('step3.description')}</p>
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h2 className="text-1xl font-semibold">
                                            {t('step3.playing-as')}
                                        </h2>
                                        <Profile
                                            profile={actorProfile}
                                            size="small"
                                        />
                                    </div>
                                    {!actor?.startsWith('user:') && (
                                        <div className="space-y-4">
                                            <h2 className="text-1xl font-semibold">
                                                {t('step3.playing-with')}
                                            </h2>
                                            <div className="space-y-2">
                                                {playerProfiles.map(
                                                    (profile, i) => (
                                                        <Profile
                                                            key={
                                                                profile?.id ?? i
                                                            }
                                                            profile={profile}
                                                            size="small"
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-4">
                                    <Button onClick={() => mutateAsync()}>
                                        {t('step3.confirm')}
                                    </Button>
                                    {confirmation === false
                                        ? t('step3.failed')
                                        : confirmation
                                          ? t('step3.confirmed')
                                          : null}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
            </div>
        </>
    );
}

const TournamentPath = z.array(Event);
type TournamentPath = z.infer<typeof TournamentPath>;

function useData({ slug }: { slug: string }) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['flow', 'register-event', slug],
        retry: false,
        throwOnError: true,
        queryFn: async () => {
            const result = await surreal.query<
                [
                    null,
                    null,
                    Event,
                    Team[],
                    RichAttends | null,
                    boolean,
                    TournamentPath,
                ]
            >(
                /* surql */ `
                    LET $event = SELECT * FROM ONLY type::thing('event', $slug);
                    LET $teams = SELECT * FROM $auth->plays_in->team WHERE fn::team::eligable_to_play(id, $event.id);
                
                    $event;
                    $teams;
                    SELECT * FROM ONLY fn::team::find_actor_registration($auth, $event.id) FETCH in, out, players.*;
                    fn::team::eligable_to_play($auth, $event.id);
                    SELECT * FROM $event.tournament_path ?? [];
                `,
                {
                    slug,
                }
            );

            return {
                event: Event.parse(result[2]),
                teams: z.array(Team).parse(result[3]),
                registration: RichAttends.optional().parse(
                    result[4] ?? undefined
                ),
                self_eligable: !!result[5],
                event_id: event,
                tournament_path: TournamentPath.parse(result[6]),
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
                    event_id: event,
                }
            );

            return z.array(UserAsRelatedUser).parse(result[2]);
        },
    });
}
