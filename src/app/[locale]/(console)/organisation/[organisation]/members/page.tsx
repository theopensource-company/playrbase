'use client';

import { Avatar } from '@/components/cards/avatar';
import { Profile } from '@/components/cards/profile';
import Container from '@/components/layout/Container';
import { UserSelector, useUserSelector } from '@/components/logic/UserSelector';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Organisation } from '@/schema/resources/organisation';
import { User } from '@/schema/resources/user';
import { DialogClose } from '@radix-ui/react-dialog';
import { useMutation, useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { ArrowRight, Loader2, Mail, Plus, Trash2 } from 'lucide-react';
import Link from 'next-intl/link';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { z } from 'zod';

export default function Account() {
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;
    const { isLoading, data: organisation, refetch } = useData(slug);

    // Split the managers out per organisation,
    // store managers for the current org under the '__' key
    const perOrg = _.groupBy(
        organisation?.managers,
        ({ org }) => org?.id ?? '__'
    );

    const canDeleteOwner =
        !!organisation &&
        !!(
            organisation.managers.filter(({ role }) => role == 'owner').length >
            1
        );

    return isLoading ? (
        <Container className="flex w-full flex-grow items-center justify-center">
            <Loader2 size={50} className="animate-spin" />
        </Container>
    ) : organisation ? (
        <div className="flex flex-grow flex-col pt-6">
            <div className="flex items-center justify-between pb-6">
                <h1 className="text-3xl font-semibold">Members</h1>
                {organisation.can_manage && (
                    <AddMember organisation={organisation.id} />
                )}
            </div>
            <div className="space-y-20">
                {Object.entries(perOrg).map(([key, managers]) => (
                    <ListManagers
                        key={key}
                        managers={managers}
                        organisation={managers.find(({ org }) => org)?.org}
                        canManage={organisation.can_manage}
                        canDeleteOwner={canDeleteOwner}
                        refresh={refetch}
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
    canManage,
    canDeleteOwner,
    refresh,
}: {
    organisation?: Organisation;
    managers: Data['managers'];
    canManage: boolean;
    canDeleteOwner?: boolean;
    refresh: () => unknown;
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
                        <TableHead align="right" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {managers.map((manager) => (
                        <ListManager
                            key={manager.edge}
                            manager={manager}
                            canManage={canManage}
                            canDeleteOwner={canDeleteOwner}
                            refresh={refresh}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function ListManager({
    refresh,
    canManage,
    canDeleteOwner,
    manager: {
        user: { id, name, email, profile_picture },
        role,
        org,
        edge,
    },
}: {
    refresh: () => unknown;
    canManage: boolean;
    canDeleteOwner?: boolean;
    manager: Data['managers'][number];
}) {
    const { mutate: updateRole, isLoading: isUpdatingRole } = useMutation({
        mutationKey: ['organisation', 'update-role', edge],
        mutationFn: async (role: Organisation['managers'][number]['role']) => {
            await surreal.merge(edge, {
                role,
            });

            await refresh();
        },
    });

    const { mutate: deleteManager, isLoading: isDeletingManager } = useMutation(
        {
            mutationKey: ['organisation', 'delete-manager', edge],
            mutationFn: async () => {
                await surreal.delete(edge);
                await refresh();
            },
        }
    );

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
            <TableCell>
                {!canManage || org ? (
                    role
                ) : isUpdatingRole ? (
                    <Skeleton className="h-10 w-24" />
                ) : (
                    <Select
                        onValueChange={updateRole}
                        defaultValue={role}
                        disabled={!canDeleteOwner && role == 'owner'}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="administrator">
                                Administrator
                            </SelectItem>
                            <SelectItem value="event_manager">
                                Event Manager
                            </SelectItem>
                            <SelectItem value="event_viewer">
                                Event Viewer
                            </SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </TableCell>
            <TableCell align="right">
                {!canManage ? null : org ? (
                    <Link
                        className={buttonVariants({ variant: 'outline' })}
                        href={`/organisation/${org.slug}/members`}
                    >
                        Via {org.name}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                ) : isDeletingManager ? (
                    <Skeleton className="h-10 w-14" />
                ) : (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                variant="destructive"
                                disabled={!canDeleteOwner && role == 'owner'}
                            >
                                <Trash2 />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <h3 className="text-2xl font-bold">
                                Remove {name}
                            </h3>
                            <p>
                                Are you sure that you want to remove this
                                manager?
                            </p>
                            <div className="my-4 rounded-md border p-4">
                                <Profile
                                    profile={
                                        {
                                            id,
                                            name,
                                            profile_picture,
                                            email,
                                        } as User
                                    }
                                />
                            </div>
                            <div className="flex justify-end gap-4">
                                <DialogClose>
                                    <Button
                                        variant="outline"
                                        disabled={isDeletingManager}
                                    >
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    variant="destructive"
                                    onClick={() => deleteManager()}
                                    disabled={isDeletingManager}
                                >
                                    {isDeletingManager && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Remove
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </TableCell>
        </TableRow>
    );
}

function AddMember({ organisation }: { organisation: Organisation['id'] }) {
    const [user, setUser] = useUserSelector();
    const [role, setRole] = useState('event_viewer');
    const [open, setOpen] = useState(false);

    const { mutateAsync, error } = useMutation({
        mutationKey: ['manages', 'invite'],
        async mutationFn() {
            // TODO set to correct type, not important for the moment
            const [res] = await surreal.query<[string[]]>(
                /* surql */ `
                RELATE $user->manages->$organisation SET role = $role
            `,
                { user, role, organisation }
            );

            if (res.detail) throw new Error(res.detail);
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    Add member
                    <Plus className="ml-2 h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <h3 className="mb-4 text-2xl font-bold">Invite user</h3>
                <div className="space-y-6">
                    <UserSelector user={user} setUser={setUser} autoFocus />

                    <div className="space-y-3">
                        <Label htmlFor="role">Role</Label>
                        <Select onValueChange={setRole} value={role}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent id="role">
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="administrator">
                                    Administrator
                                </SelectItem>
                                <SelectItem value="event_manager">
                                    Event Manager
                                </SelectItem>
                                <SelectItem value="event_viewer">
                                    Event Viewer
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="mt-3">
                    <Button
                        disabled={!user || !role}
                        onClick={() => {
                            mutateAsync().then(() => {
                                setUser(undefined);
                                setRole('event_viewer');
                                setOpen(false);
                            });
                        }}
                    >
                        <Mail className="mr-2 h-4 w-4" />
                        Send invite
                    </Button>
                </div>
                {!!error && <p>{(error as Error).message}</p>}
            </DialogContent>
        </Dialog>
    );
}

const Data = Organisation.extend({
    can_manage: z.boolean(),
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

type Data = z.infer<typeof Data>;

function useData(slug: Organisation['slug']) {
    return useQuery({
        queryKey: ['organisation', 'members', slug],
        queryFn: async () => {
            const result = await surreal.query<[Data[]]>(
                /* surql */ `
                    SELECT 
                        *,
                        $auth.id IN managers[WHERE role = "owner" OR (role = "administrator" AND org != NONE)].user AS can_manage
                    FROM organisation 
                        WHERE slug = $slug 
                        FETCH 
                            managers.*.user.*, 
                            managers.*.org.name;
                `,
                { slug }
            );

            if (!result?.[0]?.result?.[0]) return null;
            return Data.parse(result[0].result[0]);
        },
    });
}
