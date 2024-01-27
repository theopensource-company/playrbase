'use client';

import { Avatar } from '@/components/cards/avatar';
import { Profile, ProfileName } from '@/components/cards/profile';
import { EventGrid } from '@/components/data/events/cards';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { Pagination, usePagination } from '@/components/logic/Pagination';
import { buttonVariants } from '@/components/ui/button';
import { useSurreal } from '@/lib/Surreal';
import { role } from '@/lib/zod';
import { Link } from '@/locales/navigation';
import { Event } from '@/schema/resources/event';
import {
    Organisation,
    OrganisationSafeParse,
} from '@/schema/resources/organisation';
import { linkToProfile } from '@/schema/resources/profile';
import { User } from '@/schema/resources/user';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { z } from 'zod';

export default function Page() {
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;

    const order = useState<'desc' | 'asc'>('desc');
    const pagination = usePagination({ defaultPageSize: 4 });
    const { isPending, data } = useData({
        slug,
        order: order[0],
        pagination,
    });

    if (isPending) return <LoaderOverlay />;

    if (!data || !data.organisation)
        return <NotFoundScreen text="Organisation not found" />;

    const { organisation, count, events, managers, part_of } = data;

    return (
        <div className="flex flex-grow flex-col gap-6">
            <div className="flex justify-between pb-4">
                <div className="flex items-center gap-4">
                    <Avatar
                        profile={organisation}
                        renderBadge={false}
                        size="big"
                    />
                    <h1 className="text-2xl font-semibold">
                        <ProfileName profile={organisation} />
                    </h1>
                </div>
                {organisation.can_manage && (
                    <Link
                        href={linkToProfile(organisation, 'manage') ?? ''}
                        className={buttonVariants()}
                    >
                        Manage
                    </Link>
                )}
            </div>
            <div className="flex flex-col-reverse gap-12 md:flex-row md:gap-16">
                <div className="flex-[3] space-y-6">
                    <div className="flex items-center justify-between pb-2">
                        <h2 className="text-2xl font-semibold">Events</h2>
                        {events.length > 0 && (
                            <Pagination
                                count={count}
                                pagination={pagination}
                                pageSizeAdjustable={false}
                            />
                        )}
                    </div>
                    {events.length > 0 ? (
                        <EventGrid events={events} viewButton narrow />
                    ) : (
                        <p className="text-foreground/75">No events found</p>
                    )}
                </div>
                <div className="flex-[2] space-y-6">
                    <h2 className="pb-2 text-2xl font-semibold">About</h2>
                    <div className="space-y-1">
                        <h3 className="text-md font-semibold">Email</h3>
                        <p className="text-sm text-foreground/75">
                            {organisation.email}
                        </p>
                    </div>
                    {organisation.website && (
                        <div className="space-y-1">
                            <h3 className="text-md font-semibold">Website</h3>
                            <Link
                                href={organisation.website}
                                className="text-sm text-foreground/75"
                            >
                                {organisation.website}
                            </Link>
                        </div>
                    )}
                    {organisation.description && (
                        <div className="space-y-1">
                            <h3 className="text-md font-semibold">
                                Description
                            </h3>
                            <p className="text-sm text-foreground/75">
                                {organisation.description}
                            </p>
                        </div>
                    )}
                    {part_of && (
                        <div className="space-y-3">
                            <h3 className="text-md font-semibold">Part of</h3>
                            <div className="flex flex-col gap-3">
                                <Profile
                                    key={part_of.id}
                                    profile={part_of}
                                    size="extra-tiny"
                                    noSub
                                    renderBadge={false}
                                    clickable
                                />
                            </div>
                        </div>
                    )}
                    {managers.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-md font-semibold">Members</h3>
                            <div className="flex flex-col gap-3">
                                {managers.map((manager) => {
                                    const user = manager as unknown as User;
                                    return (
                                        <Profile
                                            key={manager.id}
                                            profile={user}
                                            size="extra-tiny"
                                            noSub
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const OrgCanManage = OrganisationSafeParse.extend({
    can_manage: z.boolean(),
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
                    null,
                    null,
                    Event[],
                    { count: number }[],
                    OrgCanManage,
                    OrganisationSafeParse,
                    ListedManager[],
                ]
            >(
                /* surql */ `
                    LET $org = 
                        SELECT
                            *,
                            $auth.id IN managers.user as can_manage
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
                          AND root_for_org
                        ORDER BY start ${order == 'asc' ? 'ASC' : 'DESC'}
                        START $start
                        LIMIT $limit;

                    SELECT count() FROM event 
                        WHERE organiser = $org.id
                        GROUP ALL;

                    $org;
                    SELECT * FROM ONLY $org.part_of;
                    $listed_managers;
                `,
                {
                    slug,
                    order,
                    start,
                    limit,
                }
            );

            if (!result?.[3] || !result?.[4] || !result?.[5]) return null;

            return {
                organisation: OrgCanManage.parse(result[5]),
                part_of: OrganisationSafeParse.optional().parse(
                    result[6] || undefined
                ),
                count: z.number().parse(result[4][0]?.count ?? 0),
                events: z.array(Event).parse(result[3]),
                managers: z.array(ListedManager).parse(
                    result[7].map((u) => ({
                        ...u,
                        profile_picture: u.profile_picture || undefined,
                    }))
                ),
            };
        },
    });
}
