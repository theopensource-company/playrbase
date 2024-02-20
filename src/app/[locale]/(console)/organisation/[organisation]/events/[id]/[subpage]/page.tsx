'use client';

import Container from '@/components/layout/Container';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSurreal } from '@/lib/Surreal';
import { useScrolledState } from '@/lib/scrolled';
import { cn } from '@/lib/utils';
import { Link, useRouter } from '@/locales/navigation';
import { Event } from '@/schema/resources/event';
import { Organisation } from '@/schema/resources/organisation';
import { linkToProfile } from '@/schema/resources/profile';
import { useQuery } from '@tanstack/react-query';
import { HomeIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React from 'react';
import { z } from 'zod';
import { TinyOrgName } from '../../../components/TinyOrgName';
import EventAttendeesTab from './attendees';
import EventEventsTab from './events';
import { EventOverviewTab } from './overview';
import { EventSettingsTab } from './settings';

export default function Account() {
    const router = useRouter();
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;
    const event_id = Array.isArray(params.id) ? params.id[0] : params.id;
    const subpage = Array.isArray(params.subpage)
        ? params.subpage[0]
        : params.subpage;

    const scrolled = useScrolledState();
    const t = useTranslations('pages.console.organisation.events');
    const { isPending, data, refetch } = useData({
        slug,
        event_id,
    });

    if (isPending) return <LoaderOverlay />;
    if (!data?.organisation) return <NotFoundScreen text={t('not_found')} />;

    const { event, organisation } = data;

    function Tab({ className, ...args }: Parameters<typeof TabsTrigger>[0]) {
        const active = args.value == subpage;
        return (
            <div className="space-y-1">
                <TabsTrigger
                    className={cn(
                        'hover:bg-accent hover:text-foreground data-[state=active]:hover:bg-accent',
                        className
                    )}
                    {...args}
                />
                <div
                    className={cn(
                        'mx-2.5 border-b-2',
                        active ? 'border-white' : 'border-transparent'
                    )}
                />
            </div>
        );
    }

    return (
        <div className="z-10 flex flex-grow flex-col gap-6 pt-6">
            <Container>
                <TinyOrgName name={organisation.name} />
                <h1 className="text-3xl font-semibold">{event.name}</h1>
            </Container>
            <div className="w-full">
                <Tabs
                    value={subpage}
                    onValueChange={(v) =>
                        router.push(
                            `/organisation/${slug}/events/${event_id}/${v}`
                        )
                    }
                >
                    <TabsList
                        defaultValue="overview"
                        className={cn(
                            'sticky z-[2] h-12 w-full justify-start rounded-none border-b bg-background/50 px-0 pb-0 pt-2 backdrop-blur-lg',
                            scrolled ? 'top-[6.75rem]' : 'top-[8.25rem]'
                        )}
                    >
                        <Container className="flex overflow-x-auto px-4 sm:px-12">
                            <div className="flex items-center pb-1">
                                <Link
                                    href={linkToProfile(event, 'public') ?? ''}
                                    className={cn(
                                        buttonVariants({
                                            size: 'sm',
                                            variant: 'ghost',
                                        }),
                                        'h-8 px-2.5 py-2'
                                    )}
                                >
                                    <HomeIcon size={16} />
                                </Link>
                            </div>
                            <Tab value="overview">Overview</Tab>
                            <Tab value="attendees">Attendees</Tab>
                            <Tab value="events">Events</Tab>
                            {organisation.can_manage && (
                                <Tab
                                    value="settings"
                                    className="bg-transparent"
                                >
                                    Settings
                                </Tab>
                            )}
                        </Container>
                    </TabsList>
                    <Container>
                        <TabsContent value="overview">
                            <EventOverviewTab event={event} />
                        </TabsContent>
                        <TabsContent value="attendees">
                            <EventAttendeesTab event={event} />
                        </TabsContent>
                        <TabsContent value="events">
                            <EventEventsTab event={event} />
                        </TabsContent>
                        {organisation.can_manage && (
                            <TabsContent value="settings">
                                <EventSettingsTab
                                    event={event}
                                    refetch={refetch}
                                />
                            </TabsContent>
                        )}
                    </Container>
                </Tabs>
            </div>
        </div>
    );
}

const OrgCanManage = Organisation.extend({
    can_manage: z.boolean(),
});

type OrgCanManage = z.infer<typeof OrgCanManage>;

function useData({
    slug,
    event_id,
}: {
    slug: Organisation['slug'];
    event_id?: string;
}) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['organisation', 'event', { slug, event_id }],
        retry: false,
        queryFn: async () => {
            const result = await surreal.query<[null[], Event, OrgCanManage]>(
                /* surql */ `
                    LET $org = 
                        SELECT
                            *,
                            $auth.id IN managers[?role IN ["owner", "administrator", "event_manager"]].user as can_manage
                        FROM ONLY organisation 
                            WHERE slug = $slug
                            LIMIT 1;

                    SELECT * FROM ONLY type::thing('event', $event_id)
                        WHERE organiser = $org.id;

                    $org;
                `,
                {
                    slug,
                    event_id,
                }
            );

            if (!result?.[1] || !result?.[2]) return null;

            return {
                organisation: OrgCanManage.parse(result[2]),
                event: Event.parse(result[1]),
            };
        },
    });
}
