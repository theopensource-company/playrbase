'use client';

import { Profile } from '@/components/cards/profile';
import { EventTable } from '@/components/data/events/table';
import { OrganisationTable } from '@/components/data/organisations/table';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { RoleName } from '@/components/miscellaneous/Role';
import { buttonVariants } from '@/components/ui/button';
import { useSurreal } from '@/lib/Surreal';
import { sort_roles } from '@/lib/role';
import { role } from '@/lib/zod';
import { Link } from '@/locales/navigation';
import { Event } from '@/schema/resources/event';
import {
    Organisation,
    OrganisationSafeParse,
} from '@/schema/resources/organisation';
import { User } from '@/schema/resources/user';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React from 'react';
import { z } from 'zod';
import { PageTitle } from '../../components/PageTitle';

export default function Account() {
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;

    const t = useTranslations('pages.console.organisation.overview');
    const { isPending, data } = useData({
        slug,
    });

    if (isPending) return <LoaderOverlay />;
    if (!data?.organisation) return <NotFoundScreen text={t('not_found')} />;

    const {
        events,
        event_count,
        nested,
        nested_count,
        managers,
        manager_count,
        organisation,
        part_of,
    } = data;

    return (
        <div className="flex flex-grow flex-col gap-6 pt-6">
            <PageTitle organisation={organisation} title={t('title')} />
            <div className="grid grid-cols-1 gap-16 xl:grid-cols-3">
                <div className="space-y-12 xl:col-span-2">
                    <div className="space-y-6">
                        <div className="flex justify-between gap-8">
                            <h2 className="text-xl font-semibold">
                                {t('section.events.title')}
                            </h2>
                            <Link
                                href={`/organisation/${slug}/events`}
                                className={buttonVariants({
                                    variant: 'outline',
                                })}
                            >
                                {event_count >= 6
                                    ? t('section.events.view-all', {
                                          count: event_count,
                                      })
                                    : t('section.events.go-to')}
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
                    {nested.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex justify-between gap-8">
                                <h2 className="text-xl font-semibold">
                                    {t('section.nested.title')}
                                </h2>
                                <Link
                                    href={`/organisation/${slug}/nested`}
                                    className={buttonVariants({
                                        variant: 'outline',
                                    })}
                                >
                                    {nested_count >= 6
                                        ? t('section.nested.view-all', {
                                              count: nested_count,
                                          })
                                        : t('section.nested.go-to')}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </div>
                            <div className="overflow-x-auto rounded border">
                                <OrganisationTable organisations={nested} />
                            </div>
                        </div>
                    )}
                </div>
                <div className="space-y-12">
                    {part_of && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between gap-8">
                                <h2 className="text-xl font-semibold">
                                    {t('section.partof.title')}
                                </h2>
                                <Link
                                    href={`/organisation/${part_of.slug}/overview`}
                                    className={buttonVariants({
                                        variant: 'outline',
                                    })}
                                >
                                    {t('section.partof.visit', {
                                        org: part_of.name,
                                    })}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </div>
                            <div className="rounded border p-4">
                                <Profile profile={part_of} size="small" />
                            </div>
                        </div>
                    )}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between gap-8">
                            <h2 className="text-xl font-semibold">
                                {t('section.members.title')}
                            </h2>
                            <Link
                                href={`/organisation/${slug}/members`}
                                className={buttonVariants({
                                    variant: 'outline',
                                })}
                            >
                                {manager_count >= 6
                                    ? t('section.members.view-all', {
                                          count: manager_count,
                                      })
                                    : t('section.members.go-to')}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </div>
                        <div className="flex flex-col gap-4 rounded border p-4">
                            {managers.map((manager) => {
                                const role = sort_roles(manager.roles)[0];
                                const user = manager as unknown as User;
                                return (
                                    <Profile
                                        key={manager.id}
                                        profile={user}
                                        size="small"
                                        customSub={<RoleName role={role} />}
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

const OrgCanManage = Organisation.extend({
    role,
});

type OrgCanManage = z.infer<typeof OrgCanManage>;

const ListedManager = User.pick({
    id: true,
    name: true,
    profile_picture: true,
}).extend({
    roles: z.array(role),
});

type ListedManager = z.infer<typeof ListedManager>;

function useData({ slug }: { slug: Organisation['slug'] }) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['organisation', 'overview', slug],
        retry: false,
        throwOnError: true,
        queryFn: async () => {
            const result = await surreal.query<
                [
                    null,
                    null,
                    null,

                    Event[],
                    { count: number }[],

                    Organisation[],
                    { count: number }[],

                    ListedManager[],
                    { count: number }[],

                    OrgCanManage,
                    OrganisationSafeParse,
                ]
            >(
                /* surql */ `
                    LET $org = 
                        SELECT
                            *,
                            (managers[?user = $auth].role)[0] as role
                        FROM ONLY organisation 
                            WHERE slug = $slug
                            LIMIT 1;

                    LET $unique_managers = (SELECT user, array::group(role) as roles FROM $org.managers GROUP BY user LIMIT 5);
                    LET $listed_managers = (SELECT 
                                                user as id, 
                                                user.name as name, 
                                                user.profile_picture as profile_picture, 
                                                roles 
                                            FROM $unique_managers);

                    SELECT * FROM event 
                        WHERE organiser = $org.id
                        LIMIT 5;

                    SELECT count() FROM event 
                        WHERE organiser = $org.id
                        GROUP ALL;

                    SELECT * FROM organisation 
                        WHERE part_of = $org.id
                        LIMIT 5;

                    SELECT count() FROM organisation 
                        WHERE part_of = $org.id
                        GROUP ALL;

                    $listed_managers;
                    SELECT count() FROM $org.managers GROUP ALL;

                    $org;
                    SELECT * FROM ONLY $org.part_of;
                `,
                {
                    slug,
                }
            );

            if (
                !result?.[3] ||
                !result?.[4] ||
                !result?.[5] ||
                !result?.[6] ||
                !result?.[7] ||
                !result?.[8] ||
                !result?.[9]
            )
                return null;

            return {
                organisation: OrgCanManage.parse(result[9]),
                part_of: OrganisationSafeParse.optional().parse(
                    result[10] || undefined
                ),

                events: z.array(Event).parse(result[3]),
                event_count: z.number().parse(result[4][0]?.count ?? 0),

                nested: z.array(Organisation).parse(result[5]),
                nested_count: z.number().parse(result[6][0]?.count ?? 0),

                managers: z.array(ListedManager).parse(
                    result[7].map((u) => ({
                        ...u,
                        profile_picture: u.profile_picture || undefined,
                    }))
                ),
                manager_count: z.number().parse(result[8][0]?.count ?? 0),
            };
        },
    });
}
