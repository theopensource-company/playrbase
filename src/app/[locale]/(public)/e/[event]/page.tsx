'use client';

import { Avatar } from '@/components/cards/avatar';
import { Banner } from '@/components/cards/banner';
import { Profile, ProfileName } from '@/components/cards/profile';
import { EventGrid } from '@/components/data/events/cards';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { Pagination, usePagination } from '@/components/logic/Pagination';
import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import { Markdown } from '@/components/miscellaneous/Markdown';
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
import { brand_name } from '@/lib/branding';
import { useShare } from '@/lib/share';
import { cn } from '@/lib/utils';
import { Link } from '@/locales/navigation';
import { Attends } from '@/schema/relations/attends';
import { Event } from '@/schema/resources/event';
import {
    Organisation,
    OrganisationSafeParse,
} from '@/schema/resources/organisation';
import { linkToProfile } from '@/schema/resources/profile';
import { useQuery } from '@tanstack/react-query';
import { Share } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React, { Fragment, useMemo, useState } from 'react';
import { z } from 'zod';

export default function Page() {
    const params = useParams();
    const slug = Array.isArray(params.event) ? params.event[0] : params.event;
    const share = useShare();
    const t = useTranslations('pages.e.index');

    const locale = useLocale();
    const order = useState<'desc' | 'asc'>('asc');
    const pagination = usePagination({ defaultPageSize: 10 });
    const { isPending, data } = useData({
        slug,
        order: order[0],
        pagination,
    });

    const location = useMemo(() => {
        console.log(data?.event.computed.location);
        if (!data?.event.computed.location) return;

        const search = new URLSearchParams({
            width: '100%',
            height: '600',
            hl: locale,
            q: data?.event.computed.location.coordinates.join(','),
            z: '16',
            ie: 'UTF8',
            iwloc: 'B',
            output: 'embed',
        });

        return `https://maps.google.com/maps?${search.toString()}`;
    }, [data?.event.computed.location, locale]);

    if (isPending) return <LoaderOverlay />;

    if (!data || !data.event) return <NotFoundScreen text={t('not-found')} />;

    const {
        event,
        organiser,
        count,
        events,
        tournament,
        registration,
        tournament_path,
    } = data;

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
                    <div className="flex flex-wrap gap-4">
                        <Button
                            variant="ghost"
                            className="bg-white/10 backdrop-blur hover:bg-white/20"
                            onClick={() =>
                                share({
                                    text: `Checkout ${event.name} by ${organiser.name} on ${brand_name}`,
                                })
                            }
                        >
                            <Share size={16} />
                        </Button>
                        {event.can_manage && (
                            <Link
                                href={linkToProfile(event, 'manage') ?? ''}
                                className={cn(
                                    buttonVariants({
                                        variant: 'ghost',
                                    }),
                                    'bg-white/10 backdrop-blur hover:bg-white/20'
                                )}
                            >
                                {t('banner.manage')}
                            </Link>
                        )}
                        {!event.is_tournament && (
                            <Link
                                href={
                                    registration
                                        ? `/e/${slug}/registration/${registration.id.slice(
                                              8
                                          )}`
                                        : `/flow/event-signup/${event.id.slice(
                                              6
                                          )}`
                                }
                                className={buttonVariants()}
                            >
                                {registration
                                    ? t('banner.registration.manage')
                                    : t('banner.registration.register')}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid gap-16 md:grid-cols-4 xl:grid-cols-5">
                {events.length > 0 && (
                    <div className="space-y-6 md:col-span-2 xl:col-span-3">
                        <div className="flex items-center justify-between pb-2">
                            <h2 className="text-2xl font-semibold">
                                {t('details.title')}
                            </h2>
                            <Pagination
                                count={count}
                                pagination={pagination}
                                pageSizeAdjustable={false}
                            />
                        </div>
                        <EventGrid events={events} viewButton narrow />
                    </div>
                )}
                <div className="space-y-6 md:col-span-2">
                    <div className="space-y-2">
                        <h2 className="pb-2 text-2xl font-semibold">
                            {t(
                                event.is_tournament
                                    ? 'details.about.title-tournament'
                                    : 'details.about.title-event'
                            )}
                        </h2>
                        {event.computed.description && (
                            <div className="pb-2 text-foreground/75">
                                <Markdown>
                                    {event.computed.description}
                                </Markdown>
                            </div>
                        )}
                    </div>
                    {event.start && (
                        <div className="space-y-1">
                            <h3 className="text-md font-semibold">
                                {t('details.about.start')}
                            </h3>
                            <p className="text-sm text-foreground/75">
                                <DateTooltip date={event.start} forceTime />
                            </p>
                        </div>
                    )}
                    {event.end && (
                        <div className="space-y-1">
                            <h3 className="text-md font-semibold">
                                {t('details.about.end')}
                            </h3>
                            <p className="text-sm text-foreground/75">
                                <DateTooltip date={event.end} forceTime />
                            </p>
                        </div>
                    )}
                    {tournament && (
                        <div className="space-y-3">
                            <h3 className="text-md font-semibold">
                                {t('details.about.tournament')}
                            </h3>
                            <div className="flex flex-col gap-3">
                                <Profile
                                    key={tournament.id}
                                    profile={tournament}
                                    size="extra-tiny"
                                    noSub
                                    renderBadge={false}
                                    clickable
                                />
                            </div>
                        </div>
                    )}
                    {location && (
                        <div className="space-y-3">
                            <h3 className="text-md font-semibold">
                                {t('details.about.location')}
                            </h3>
                            <div className="w-full rounded-lg border p-2">
                                <iframe
                                    width="100%"
                                    height="400"
                                    src={location}
                                    className="rounded-md"
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div className="space-y-6 md:col-span-2">
                    <h2 className="pb-2 text-2xl font-semibold">
                        {t('details.organiser.title')}
                    </h2>
                    <Profile
                        profile={organiser}
                        noSub
                        renderBadge={false}
                        size="small"
                        clickable
                        className="mt-3"
                    />
                    {organiser.description && (
                        <p className="w-full text-foreground/75">
                            {organiser.description}
                        </p>
                    )}
                    <div className="space-y-1">
                        <h3 className="text-md font-semibold">
                            {t('details.organiser.email')}
                        </h3>
                        <p className="text-sm text-foreground/75">
                            {organiser.email}
                        </p>
                    </div>
                    {organiser.website && (
                        <div className="space-y-1">
                            <h3 className="text-md font-semibold">
                                {t('details.organiser.website')}
                            </h3>
                            <p className="text-sm text-foreground/75 hover:underline">
                                <Link href={organiser.website} target="_blank">
                                    {organiser.website}
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {event.computed.outcome && (
                <div className="space-y-1">
                    <h2 className="pb-2 text-2xl font-semibold">Outcome</h2>
                    <div className="pb-2 text-foreground/75">
                        <Markdown>{event.computed.outcome}</Markdown>
                    </div>
                </div>
            )}
        </div>
    );
}

const EventCanManage = Event.extend({
    can_manage: z.boolean(),
});

type EventCanManage = z.infer<typeof EventCanManage>;

const TournamentPath = z.array(Event);
type TournamentPath = z.infer<typeof TournamentPath>;

function useData({
    slug,
    order,
    pagination: { start, limit },
}: {
    slug: Organisation['slug'];
    order: 'desc' | 'asc';
    pagination: {
        start: number;
        limit: number;
    };
}) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['organisation', 'events', slug, { order, start, limit }],
        retry: false,
        throwOnError: true,
        queryFn: async () => {
            const result = await surreal.query<
                [
                    null,
                    Event[],
                    { count: number }[],
                    EventCanManage,
                    OrganisationSafeParse,
                    Event,
                    Attends | null,
                    TournamentPath,
                ]
            >(
                /* surql */ `
                    LET $event = 
                        SELECT
                            *,
                            $auth.id IN organiser.managers[?role IN ["owner", "administrator", "event_manager"]].user as can_manage
                        FROM ONLY type::thing('event', $slug);

                    SELECT * FROM event 
                        WHERE tournament = $event.id
                        ORDER BY start, name ${order == 'asc' ? 'ASC' : 'DESC'}
                        START $start
                        LIMIT $limit;

                    SELECT count() FROM event 
                        WHERE tournament = $event.id
                        GROUP ALL;

                    $event;
                    SELECT * FROM ONLY $event.organiser;
                    SELECT * FROM ONLY $event.tournament;
                    IF $event && $auth THEN fn::team::find_actor_registration($auth, $event.id) ELSE none END;
                    SELECT * FROM $event.tournament_path ?? [];
                `,
                {
                    slug,
                    order,
                    start,
                    limit,
                    event_id: `event:${slug}`,
                }
            );

            if (!result?.[1] || !result?.[2] || !result?.[3]) return null;

            return {
                event: EventCanManage.parse(result[3]),
                organiser: OrganisationSafeParse.parse(result[4]),
                tournament: Event.optional().parse(result[5] ?? undefined),
                count: z.number().parse(result[2][0]?.count ?? 0),
                events: z.array(Event).parse(result[1]),
                registration: Attends.optional().parse(result[6] ?? undefined),
                tournament_path: TournamentPath.parse(result[7]),
            };
        },
    });
}
