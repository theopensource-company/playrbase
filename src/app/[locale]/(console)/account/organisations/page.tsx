'use client';

import { Avatar } from '@/components/cards/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
    Organisation,
    OrganisationSafeParse,
} from '@/schema/resources/organisation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, LogOut, Settings2, X } from 'lucide-react';
import Link from 'next-intl/link';
import React from 'react';
import { z } from 'zod';

export default function Account() {
    const { data: organisations, isLoading, refetch } = useData();

    return (
        <div className="flex flex-grow flex-col gap-12 pt-6">
            <h1 className="text-3xl font-bold">Organisations</h1>
            <Table>
                {organisations && (
                    <TableCaption>
                        <b>Count:</b>{' '}
                        {organisations.confirmed.length +
                            organisations.unconfirmed.length}
                    </TableCaption>
                )}
                <TableHeader>
                    <TableRow>
                        <TableHead />
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && (
                        <TableRow>
                            <TableCell>
                                <Skeleton className="h-10 w-10 rounded-full" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-24" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-36" />
                            </TableCell>
                        </TableRow>
                    )}

                    {organisations && organisations.unconfirmed.length > 0 && (
                        <>
                            {organisations.confirmed.length > 0 && (
                                <h2 className="mb-4 mt-6 text-2xl">
                                    Invitations
                                </h2>
                            )}
                            {organisations.unconfirmed.map((data) => (
                                <RenderUnconfirmed
                                    data={data}
                                    refetch={refetch}
                                    key={data.edge}
                                />
                            ))}
                        </>
                    )}

                    {organisations && organisations.confirmed.length > 0 && (
                        <>
                            {organisations.unconfirmed.length > 0 && (
                                <h2 className="mb-4 mt-12 text-2xl">
                                    Confirmed
                                </h2>
                            )}
                            {organisations.confirmed.map((data) => (
                                <RenderConfirmed
                                    data={data}
                                    refetch={refetch}
                                    key={data.edge}
                                />
                            ))}
                        </>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

function RenderUnconfirmed({
    data: { organisation, edge },
    refetch,
}: {
    data: Data;
    refetch: () => unknown;
}) {
    const { mutate: accept } = useMutation({
        mutationKey: ['manages', 'accept-invite', edge],
        async mutationFn() {
            await surreal.merge(edge, { confirmed: true });
            refetch();
        },
    });

    const { mutate: deny } = useMutation({
        mutationKey: ['manages', 'deny-invite', edge],
        async mutationFn() {
            await surreal.delete(edge);
            refetch();
        },
    });

    return (
        <TableRow>
            <TableCell>
                <Avatar
                    size="small"
                    profile={organisation as unknown as Organisation}
                />
            </TableCell>
            <TableCell>{organisation.name}</TableCell>
            <TableCell>{organisation.email}</TableCell>
            <TableCell className="space-x-3">
                <Button size="sm" onClick={() => accept()}>
                    <Check />
                </Button>
                <Button size="sm" onClick={() => deny()} variant="destructive">
                    <X />
                </Button>
            </TableCell>
        </TableRow>
    );
}

function RenderConfirmed({
    data: { organisation, edge },
    refetch,
}: {
    data: Data;
    refetch: () => unknown;
}) {
    const { mutate: leave } = useMutation({
        mutationKey: ['manages', 'leave', edge],
        async mutationFn() {
            await surreal.delete(edge);
            refetch();
        },
    });

    return (
        <TableRow>
            <TableCell>
                <Avatar
                    size="small"
                    profile={organisation as unknown as Organisation}
                />
            </TableCell>
            <TableCell>{organisation.name}</TableCell>
            <TableCell>{organisation.email}</TableCell>
            <TableCell className="space-x-3">
                <Link
                    className={buttonVariants({
                        size: 'sm',
                    })}
                    href={`/organisation/${organisation.slug}/settings`}
                >
                    <Settings2 />
                </Link>
                <Button size="sm" onClick={() => leave()} variant="destructive">
                    <LogOut />
                </Button>
            </TableCell>
        </TableRow>
    );
}

const Data = z.object({
    edge: record('manages'),
    organisation: OrganisationSafeParse.extend({
        part_of: OrganisationSafeParse.optional(),
    }),
});

type Data = z.infer<typeof Data>;

function useData() {
    return useQuery({
        queryKey: ['organisations'],
        queryFn: async () => {
            const result = await surreal.query<[Data[], Data[]]>(/* surql */ `
                SELECT out.* as organisation, id as edge
                    FROM $auth->manages[?confirmed] 
                    FETCH organisation.part_of.*;

                SELECT out.* as organisation, id as edge
                    FROM $auth->manages[?!confirmed] 
                    FETCH organisation.part_of.*;          
            `);

            if (!result?.[0]?.result || !result?.[1]?.result) return null;
            return {
                confirmed: z.array(Data).parse(result[0].result),
                unconfirmed: z.array(Data).parse(result[1].result),
            };
        },
    });
}
