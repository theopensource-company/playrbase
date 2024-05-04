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
import { Invite } from '@/schema/resources/invite';
import { linkToProfile } from '@/schema/resources/profile';
import { Team } from '@/schema/resources/team';
import { User, UserAsRelatedUser } from '@/schema/resources/user';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Baby, Check, Clock, Plus, Users, X } from 'lucide-react';
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
    const { event, tournament_path, registration } = data;
    const eligabilityReport = useEligabilityReportGenerator(event);
    const router = useRouter();

    const eligableActors = useMemo(
        () => data.actors.filter(({ eligable }) => eligable),
        [data.actors]
    );

    const [actorId, setActorInternal] = useQueryState('actor', parseAsString);
    const [players, setPlayers] = useQueryState(
        'players',
        parseAsArrayOf(parseAsString).withDefault([])
    );

    const eligableTeamPlayers = useMemo(
        () =>
            data.actors.find(({ actor: { id } }) => id == actorId)
                ?.eligable_players,
        [actorId, data.actors]
    );

    const setActor = useCallback(
        (actor: string | null) => {
            setActorInternal(actor);
            setPlayers(!actor ? null : []);
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
            actor: !!actorId,
            players: playersValid,
            confirm: false,
        }),
        [actorId, playersValid]
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
        }
    }, [players, event, eligableTeamPlayers, setPlayers]);

    const actorProfile = eligableActors.find(
        ({ actor: { id } }) => id == actorId
    )?.actor;

    const playerProfiles =
        players?.map(
            (p) => eligableTeamPlayers?.find(({ id }) => p == id) ?? undefined
        ) ?? [];

    useEffect(() => {
        if (
            actorId &&
            !eligableActors.find(({ actor: { id } }) => id == actorId)
        ) {
            setActor(null);
        }
    }, [actorId, eligableActors, setActor]);

    const surreal = useSurreal();
    const { mutateAsync, data: confirmation } = useMutation({
        mutationKey: [
            'flow',
            'register-event',
            'signup',
            event.id,
            actorId,
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
                        actor: actorId,
                        players,
                    }
                );

                return RichAttends.parse(result);
            } catch (e) {
                console.log(e, {
                    event: event.id,
                    actor: actorId,
                    players,
                });
                return false;
            }
        },
    });

    const showedConfirmation = registration ?? confirmation ?? false;

    const min_team_size = event.options.min_team_size;
    const max_team_size = event.options.max_team_size;
    const min_pool_size = event.options.min_pool_size;
    const max_pool_size = event.options.max_pool_size;

    const computed_min_players =
        [min_team_size, min_pool_size]
            .filter((a): a is number => !!a)
            .sort((a, b) => a - b)
            .at(-1) ?? 0;

    const renderActorEntry = ({
        actor,
        eligable,
        eligable_players,
        players,
        invites,
    }: RegistrationActor) => (
        <Fragment key={actor.id}>
            <TableRow
                className={cn(
                    'hover:bg-transparent',
                    !eligable && 'border-b-0'
                )}
            >
                <TableCell>
                    <Avatar profile={actor} size="small" />
                </TableCell>
                <TableCell>{actor.name}</TableCell>
                <TableCell>
                    {actor.type == 'team'
                        ? t('step1.table-eligable.kind.team')
                        : t('step1.table-eligable.kind.your-account')}
                </TableCell>
                <TableCell>
                    {eligable ? (
                        <Check className="w-4" />
                    ) : (
                        <X className="w-4" />
                    )}
                </TableCell>
                <TableCell>
                    {eligable ? (
                        <Button
                            size="sm"
                            disabled={!eligable || actor.id == actorId}
                            variant={
                                actor.id == actorId ? 'secondary' : 'default'
                            }
                            onClick={() => setActor(actor.id)}
                        >
                            {actor.id == actorId
                                ? t('step1.table-eligable.actions.selected')
                                : t('step1.table-eligable.actions.continue')}
                        </Button>
                    ) : actor.type == 'team' ? (
                        <Link
                            className={buttonVariants({
                                variant: 'outline',
                            })}
                            href={linkToProfile(actor, 'manage') ?? ''}
                        >
                            {t('step1.table-eligable.actions.manage-team')}
                        </Link>
                    ) : null}
                </TableCell>
            </TableRow>
            {!eligable && (
                <TableRow className="hover:bg-transparent">
                    <TableCell className="pb-8 pt-2" colSpan={5}>
                        <div className="rounded-md bg-muted/75 px-7 py-3">
                            <h4 className="mb-1 font-semibold">
                                {actor.id.startsWith('team:')
                                    ? t(
                                          'step1.table-eligable.explanation.why-team'
                                      )
                                    : t(
                                          'step1.table-eligable.explanation.why-user'
                                      )}
                            </h4>
                            <ol className="list-decimal">
                                {eligabilityReport({
                                    actor,
                                    eligable,
                                    eligable_players,
                                    players,
                                    invites,
                                }).map((reason, i) => (
                                    <li
                                        key={i}
                                        className="text-muted-foreground"
                                    >
                                        {reason}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </Fragment>
    );

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
                    <>
                        {computed_min_players > 1 ? (
                            <div className="space-y-3 rounded-md bg-muted/75 px-7 py-4">
                                <h3 className="text-xl font-semibold text-white">
                                    {t('team-guide.title')}
                                </h3>
                                <ol className="list-decimal space-y-2">
                                    <li className="text-sm">
                                        <h4 className="font-semibold">
                                            {t('team-guide.step1.title')}
                                        </h4>
                                        <span className="text-muted-foreground">
                                            {t('team-guide.step1.description', {
                                                uncomputed:
                                                    computed_min_players == 0 &&
                                                    max_team_size == undefined
                                                        ? 'true'
                                                        : 'false',
                                                min_others:
                                                    computed_min_players <= 1
                                                        ? 0
                                                        : computed_min_players -
                                                          1,
                                                max_others:
                                                    max_team_size == undefined
                                                        ? -1
                                                        : max_team_size - 1,
                                            })}
                                        </span>
                                    </li>
                                    <li className="text-sm">
                                        <h4 className="font-semibold">
                                            {t('team-guide.step2.title')}
                                        </h4>
                                        <span className="text-muted-foreground">
                                            {!min_pool_size && !max_pool_size
                                                ? t(
                                                      'team-guide.step2.description-none'
                                                  )
                                                : max_team_size
                                                  ? t(
                                                        'team-guide.step2.description-team-max',
                                                        {
                                                            team_max:
                                                                max_team_size,
                                                            both:
                                                                min_pool_size &&
                                                                max_pool_size,
                                                            min:
                                                                min_pool_size ??
                                                                0,
                                                            max:
                                                                max_pool_size ==
                                                                undefined
                                                                    ? -1
                                                                    : max_pool_size,
                                                        }
                                                    )
                                                  : t(
                                                        'team-guide.step2.description-no-team-max',
                                                        {
                                                            both:
                                                                min_pool_size &&
                                                                max_pool_size,
                                                            min:
                                                                min_pool_size ??
                                                                0,
                                                            max:
                                                                max_pool_size ==
                                                                undefined
                                                                    ? -1
                                                                    : max_pool_size,
                                                        }
                                                    )}
                                        </span>
                                    </li>
                                    <li className="text-sm">
                                        <h4 className="font-semibold">
                                            {t('team-guide.step3.title')}
                                        </h4>
                                        <span className="text-muted-foreground">
                                            {t('team-guide.step3.description')}
                                        </span>
                                    </li>
                                </ol>
                            </div>
                        ) : null}
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
                                        {actorId && (
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
                                                        'step1.table-eligable.column.eligable'
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
                                            {data.actors
                                                .filter(
                                                    ({ eligable }) => eligable
                                                )
                                                .map(renderActorEntry)}
                                            {data.actors
                                                .filter(
                                                    ({ eligable }) => !eligable
                                                )
                                                .map(renderActorEntry)}
                                        </TableBody>
                                    </Table>
                                    <div className="flex gap-4">
                                        <Button
                                            size="sm"
                                            disabled={!actorId}
                                            onClick={() =>
                                                setSection(
                                                    eligableTeamPlayers?.length ==
                                                        event.options
                                                            .min_pool_size
                                                        ? 'confirm'
                                                        : 'players'
                                                )
                                            }
                                        >
                                            {t('step1.continue')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setCreateTeamOpen(true)
                                            }
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
                                                        profile={
                                                            playerProfiles[0]
                                                        }
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
                                                    {t(
                                                        'step2.table.column.name'
                                                    )}
                                                </TableHead>
                                                <TableHead>
                                                    {t(
                                                        'step2.table.column.email'
                                                    )}
                                                </TableHead>
                                                <TableHead>
                                                    {t(
                                                        'step2.table.column.actions'
                                                    )}
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {eligableTeamPlayers?.map(
                                                (profile) => {
                                                    const selected =
                                                        !!players?.find(
                                                            (id) =>
                                                                id == profile.id
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
                                                        <TableRow
                                                            key={profile.id}
                                                        >
                                                            <TableCell>
                                                                <Avatar
                                                                    profile={
                                                                        profile
                                                                    }
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
                                                                    onClick={
                                                                        onClick
                                                                    }
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
                                                }
                                            )}
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
                                        {!actorId?.startsWith('user:') && (
                                            <div className="space-y-4">
                                                <h2 className="text-1xl font-semibold">
                                                    {t('step3.playing-with')}
                                                </h2>
                                                <div className="space-y-2">
                                                    {playerProfiles.map(
                                                        (profile, i) => (
                                                            <Profile
                                                                key={
                                                                    profile?.id ??
                                                                    i
                                                                }
                                                                profile={
                                                                    profile
                                                                }
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
                    </>
                )}
            </div>
        </>
    );
}

const TournamentPath = z.array(Event);
type TournamentPath = z.infer<typeof TournamentPath>;

const RegistrationActor = z.object({
    actor: z.union([User, Team]),
    eligable: z.boolean(),
    eligable_players: z.array(UserAsRelatedUser),
    players: z.array(UserAsRelatedUser),
    invites: z.array(Invite),
});
type RegistrationActor = z.infer<typeof RegistrationActor>;

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
                    RegistrationActor[],
                    RichAttends | null,
                    TournamentPath,
                ]
            >(
                /* surql */ `
                    LET $event = SELECT * FROM ONLY type::thing('event', $slug);
                    LET $actors = SELECT VALUE {
                        actor: $this,
                        eligable: fn::team::eligable_to_play(id, $event.id),
                        eligable_players: (SELECT * FROM fn::team::compute_eligable_players(id, $event.id)),
                        players: (SELECT * FROM fn::team::compute_players(id)),
                        invites: (SELECT * FROM invite WHERE target = $parent.id)
                    } FROM $auth, $auth->plays_in->team;
                
                    $event;
                    $actors;
                    SELECT * FROM ONLY fn::team::find_actor_registration($auth, $event.id) FETCH in, out, players.*;
                    SELECT * FROM $event.tournament_path ?? [];
                `,
                {
                    slug,
                }
            );

            console.log(result[3]);

            return {
                event: Event.parse(result[2]),
                actors: z.array(RegistrationActor).parse(result[3]),
                registration: RichAttends.optional().parse(
                    result[4] ?? undefined
                ),
                event_id: event,
                tournament_path: TournamentPath.parse(result[5]),
            };
        },
    });
}

function useEligabilityReportGenerator(event: Event) {
    const t = useTranslations(
        'pages.console.flow.event-signup.eligability-report'
    );

    const min_pool_size = event.options.min_pool_size;
    const min_team_size = event.options.min_team_size;
    const max_team_size = event.options.max_team_size;
    const min_age = event.options.min_age;
    const max_age = event.options.max_age;

    return function ({
        actor,
        eligable_players,
        players,
        invites,
    }: RegistrationActor) {
        const playerAges = players.map(({ birthdate }) =>
            dayjs().diff(birthdate, 'years')
        );

        const num_under_age =
            min_age && playerAges.filter((age) => age < min_age).length;
        const num_over_age =
            max_age && playerAges.filter((age) => age > max_age).length;

        const pendingInvites =
            invites.length > 0
                ? t('pending-invites', { invites: invites.length })
                : '';

        const isTeam = actor.id.startsWith('team:');

        return [
            // min_pool_size (team)
            isTeam &&
                min_pool_size &&
                eligable_players.length < min_pool_size &&
                (players.length < min_pool_size
                    ? t('eligable-and-players-lacking', {
                          num_missing:
                              (min_pool_size ?? 0) - eligable_players.length,
                          invites: invites.length,
                      }) + pendingInvites
                    : t('eligable-lacking', {
                          num_eligable: eligable_players.length,
                          num_players: players.length,
                          num_missing:
                              (min_pool_size ?? 0) - eligable_players.length,
                          invites: invites.length,
                      }) + pendingInvites),

            // min_team_size (team)
            isTeam &&
                min_team_size &&
                players.length < min_team_size &&
                t('players-lacking', {
                    num_lacking: players.length - (min_team_size ?? 0),
                    invites: invites.length,
                }) + pendingInvites,

            // min_pool_size (personal account)
            !isTeam &&
                min_pool_size &&
                min_pool_size > 1 &&
                t('min-pool-personal', { min_pool_size }),

            // min_pool_size (personal account)
            !isTeam &&
                min_team_size &&
                min_team_size > 1 &&
                t('min-team-personal', { min_team_size }),

            // max_team_size
            max_team_size &&
                players.length > max_team_size &&
                t('player-overflow', {
                    num_overflow: (max_team_size ?? 0) - players.length,
                }),

            // min_age
            num_under_age && t('num-under-age', { num_under_age }),

            // max_age
            num_over_age && t('num-over-age', { num_over_age }),
        ].filter((a): a is string => !!a);
    };
}
