'use client';

import { Avatar } from '@/components/cards/avatar';
import Container from '@/components/layout/Container';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { SurrealInstance as surreal } from '@/lib/Surreal';
import { record } from '@/lib/zod';
import { Organisation } from '@/schema/resources/organisation';
import { User } from '@/schema/resources/user';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import React from 'react';
import { z } from 'zod';

export default function Account() {
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;
    const {
        isLoading,
        data: organisation,
        // refetch,
    } = useData(slug);

    // Split the managers out per organisation,
    // store managers for the current org under the '__' key
    const perOrg = _.groupBy(
        organisation?.managers,
        ({ org }) => org?.id ?? '__'
    );

    return isLoading ? (
        <Container className="flex w-full flex-grow items-center justify-center">
            <Loader2 size={50} className="animate-spin" />
        </Container>
    ) : organisation ? (
        <div className="flex flex-grow flex-col pt-6">
            <h1 className="pb-2 text-3xl font-semibold">Members</h1>
            <div className="space-y-20">
                {Object.entries(perOrg).map(([key, managers]) => (
                    <ListManagers
                        key={key}
                        managers={managers}
                        organisation={managers.find(({ org }) => org)?.org}
                    />
                ))}
            </div>
        </div>
    ) : (
        <p>org not found</p>
    );
}

function ListManagers({
    organisation,
    managers,
}: {
    organisation?: Organisation;
    managers: OrganisationFetchedManagers['managers'];
}) {
    return (
        <div>
            {organisation && (
                <h2 className="pb-2 text-2xl font-semibold">
                    From {organisation.name}
                </h2>
            )}
            <Table>
                <TableCaption>
                    <b>Count:</b> {managers.length}
                </TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead />
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {managers.map((manager) => (
                        <ListManager key={manager.edge} manager={manager} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function ListManager({
    manager: {
        user: { id, name, email, profile_picture },
        role,
        // org,
    },
}: {
    manager: OrganisationFetchedManagers['managers'][number];
}) {
    return (
        <TableRow>
            <TableCell>
                <Avatar
                    profile={
                        {
                            id,
                            name,
                            profile_picture,
                        } as User
                    }
                />
            </TableCell>
            <TableCell>{name}</TableCell>
            <TableCell>{email}</TableCell>
            <TableCell>{role}</TableCell>
        </TableRow>
    );
}

const OrganisationFetchedManagers = Organisation.extend({
    managers: z.array(
        z.object({
            user: User.pick({
                id: true,
                name: true,
                email: true,
                profile_picture: true,
            }),
            role: z.union([
                z.literal('owner'),
                z.literal('administrator'),
                z.literal('event_manager'),
                z.literal('event_viewer'),
            ]),
            edge: record('manages'),
            org: Organisation.optional(),
        })
    ),
});

type OrganisationFetchedManagers = z.infer<typeof OrganisationFetchedManagers>;

function useData(slug: Organisation['slug']) {
    return useQuery({
        queryKey: ['organisation', 'members', slug],
        queryFn: async () => {
            const result = await surreal.query<[OrganisationFetchedManagers[]]>(
                /* surql */ `
                    SELECT * FROM organisation 
                        WHERE slug = $slug 
                        FETCH 
                            managers.*.user.*, 
                            managers.*.org.name;
                `,
                { slug }
            );

            if (!result?.[0]?.result?.[0]) return null;
            return OrganisationFetchedManagers.parse(result[0].result[0]);
        },
    });
}
