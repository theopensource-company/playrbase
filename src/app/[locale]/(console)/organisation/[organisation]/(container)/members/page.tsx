'use client';

import { Avatar } from '@/components/cards/avatar';
import { Profile, ProfileName } from '@/components/cards/profile';
import Container from '@/components/layout/Container';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import {
    UserEmailSelector,
    useUserEmailSelector,
} from '@/components/logic/UserEmailSelector';
import { RoleName, SelectRole } from '@/components/miscellaneous/Role';
import { DD, DDContent, DDFooter, DDTrigger } from '@/components/ui-custom/dd';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { useSurreal } from '@/lib/Surreal';
import { Role } from '@/lib/role';
import { record, role } from '@/lib/zod';
import { Link } from '@/locales/navigation';
import { Invite } from '@/schema/resources/invite';
import { Organisation } from '@/schema/resources/organisation';
import { Profile as TProfile } from '@/schema/resources/profile';
import { User, UserAnonymous } from '@/schema/resources/user';
import { useMutation, useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { ArrowRight, Loader2, Mail, MailX, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { PageTitle } from '../../components/PageTitle';

export default function Account() {
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;
    const { isPending, data, refetch } = useData(slug);
    const t = useTranslations('pages.console.organisation.members');

    if (!data?.organisation) return <NotFoundScreen text={t('not_found')} />;
    const organisation = data.organisation;
    const invited_members = data.invited_members;

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

    return isPending ? (
        <Container className="flex w-full flex-grow items-center justify-center">
            <Loader2 size={50} className="animate-spin" />
        </Container>
    ) : organisation ? (
        <div className="flex flex-grow flex-col pt-6">
            <PageTitle
                organisation={organisation as unknown as Organisation}
                title={t('title')}
            >
                {organisation.can_manage && (
                    <AddMember
                        organisation={organisation.id}
                        refresh={refetch}
                    />
                )}
            </PageTitle>
            <div className="space-y-20">
                {Object.entries(perOrg).map(([key, managers]) => (
                    <ListManagers
                        key={key}
                        managers={managers}
                        invites={key == '__' ? invited_members : []}
                        organisation={managers.find(({ org }) => org)?.org}
                        canManage={organisation.can_manage}
                        canDeleteOwner={canDeleteOwner}
                        refresh={refetch}
                    />
                ))}
            </div>
        </div>
    ) : (
        <NotFoundScreen text={t('not_found')} />
    );
}

function ListManagers({
    organisation,
    managers,
    invites,
    canManage,
    canDeleteOwner,
    refresh,
}: {
    organisation?: Organisation;
    managers: Data['managers'];
    invites?: Invited[];
    canManage: boolean;
    canDeleteOwner?: boolean;
    refresh: () => unknown;
}) {
    const t = useTranslations(
        'pages.console.organisation.members.list_managers'
    );

    return (
        <div>
            {organisation && (
                <h2 className="pb-6 text-2xl font-semibold">
                    {t('title', {
                        org: organisation.name,
                    })}
                </h2>
            )}
            <div className="rounded border">
                <Table>
                    <TableCaption className="mb-4">
                        <b>{t('table.caption.count')}:</b>{' '}
                        {managers.length + (invites?.length ?? 0)}
                    </TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead />
                            <TableHead>{t('table.columns.name')}</TableHead>
                            <TableHead>{t('table.columns.email')}</TableHead>
                            <TableHead>{t('table.columns.role')}</TableHead>
                            <TableHead align="right" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invites?.map((invite) => (
                            <InvitedManager
                                key={invite.id}
                                invite={invite}
                                canManage={canManage}
                                refresh={refresh}
                            />
                        ))}
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
    const surreal = useSurreal();
    const t = useTranslations(
        'pages.console.organisation.members.list_manager'
    );

    const { mutate: updateRole, isPending: isUpdatingRole } = useMutation({
        mutationKey: ['organisation', 'update-role', edge],
        mutationFn: async (role: Organisation['managers'][number]['role']) =>
            toast.promise(
                async () => {
                    await surreal.merge(edge, {
                        role,
                    });

                    await refresh();
                },
                {
                    loading: t('toast.updating-role'),
                    success: t('toast.updated-role'),
                    error: (e) =>
                        t('errors.failed-update-role', { error: e.message }),
                }
            ),
    });

    const { mutate: deleteManager, isPending: isDeletingManager } = useMutation(
        {
            mutationKey: ['organisation', 'delete-manager', edge],
            mutationFn: async () =>
                toast.promise(
                    async () => {
                        await surreal.delete(edge);
                        await refresh();
                    },
                    {
                        loading: t('toast.removing-member'),
                        success: t('toast.removed-member'),
                        error: (e) =>
                            t('errors.failed-remove-member', {
                                error: e.message,
                            }),
                    }
                ),
        }
    );

    return (
        <TableRow>
            <TableCell>
                <Avatar
                    size="small"
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
                    <RoleName role={role} />
                ) : isUpdatingRole ? (
                    <Skeleton className="h-10 w-24" />
                ) : (
                    <SelectRole
                        onRoleUpdate={updateRole}
                        role={role}
                        disabled={!canDeleteOwner && role == 'owner'}
                        className="w-[200px]"
                    />
                )}
            </TableCell>
            <TableCell align="right">
                {!canManage ? null : org ? (
                    <Link
                        className={buttonVariants({ variant: 'outline' })}
                        href={`/organisation/${org.slug}/members`}
                    >
                        {t('actions.via', {
                            org: org.name,
                        })}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                ) : isDeletingManager ? (
                    <Skeleton className="h-10 w-14" />
                ) : (
                    <DD>
                        <DDTrigger asChild>
                            <Button
                                variant="destructive"
                                disabled={!canDeleteOwner && role == 'owner'}
                            >
                                <Trash2 />
                            </Button>
                        </DDTrigger>
                        <DDContent>
                            <h3 className="text-2xl font-bold">
                                {t('actions.remove-dialog.title', {
                                    name,
                                })}
                            </h3>
                            <p>{t('actions.remove-dialog.description')}</p>
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
                            <DDFooter closeDisabled={isDeletingManager}>
                                <Button
                                    variant="destructive"
                                    onClick={() => deleteManager()}
                                    disabled={isDeletingManager}
                                >
                                    {isDeletingManager && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {t('actions.remove-dialog.submit')}
                                </Button>
                            </DDFooter>
                        </DDContent>
                    </DD>
                )}
            </TableCell>
        </TableRow>
    );
}

function InvitedManager({
    invite: { origin, role, id },
    canManage,
    refresh,
}: {
    invite: Invited;
    canManage: boolean;
    refresh: () => unknown;
}) {
    const surreal = useSurreal();
    const t = useTranslations(
        'pages.console.organisation.members.invited_manager'
    );

    const { mutate: updateRole, isPending: isUpdatingRole } = useMutation({
        mutationKey: ['organisation', 'update-role', id],
        mutationFn: async (role: Organisation['managers'][number]['role']) =>
            toast.promise(
                async () => {
                    await surreal.query(
                        /* surrealql */ `
                        UPDATE type::thing('invite', $id) SET role = $role;
                    `,
                        {
                            id,
                            role,
                        }
                    );

                    await refresh();
                },
                {
                    loading: t('toast.updating-role'),
                    success: t('toast.updated-role'),
                    error: (e) =>
                        t('errors.failed-update-role', { error: e.message }),
                }
            ),
    });

    const { mutate: revokeInvite, isPending: isRevokingInvite } = useMutation({
        mutationKey: ['organisation', 'revoke-invite', id],
        mutationFn: async () =>
            toast.promise(
                async () => {
                    await surreal.delete(id);
                    await refresh();
                },
                {
                    loading: t('toast.revoking-invite'),
                    success: t('toast.revoked-invite'),
                    error: (e) =>
                        t('errors.failed-revoke-invite', { error: e.message }),
                }
            ),
    });

    const profile: TProfile =
        typeof origin == 'string' ? { email: origin, type: 'email' } : origin;

    return (
        <TableRow>
            <TableCell>
                <Avatar profile={profile} size="small" />
            </TableCell>
            <TableCell>
                <ProfileName profile={profile} />
                <Badge className="ml-3 whitespace-nowrap">
                    {t('pending-invite')}
                </Badge>
            </TableCell>
            <TableCell />
            <TableCell>
                {!canManage ? (
                    role
                ) : isUpdatingRole ? (
                    <Skeleton className="h-10 w-24" />
                ) : (
                    <SelectRole
                        onRoleUpdate={updateRole}
                        role={role}
                        className="w-[200px]"
                    />
                )}
            </TableCell>
            <TableCell align="right">
                <Button
                    variant="destructive"
                    onClick={() => revokeInvite()}
                    disabled={isRevokingInvite}
                >
                    <MailX />
                </Button>
            </TableCell>
        </TableRow>
    );
}

function AddMember({
    organisation,
    refresh,
}: {
    organisation: Organisation['id'];
    refresh: () => unknown;
}) {
    const [user, setUser] = useUserEmailSelector();
    const [role, setRole] = useState<Role>('event_viewer');
    const [open, setOpen] = useState(false);
    const t = useTranslations('pages.console.organisation.members.add_member');

    const { mutateAsync, error } = useMutation({
        mutationKey: ['manages', 'invite'],
        async mutationFn() {
            toast.promise(
                async () => {
                    await fetch('/api/invite', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            origin: user?.toLowerCase(),
                            target: organisation,
                            role,
                        }),
                    });
                    await refresh();
                },
                {
                    loading: t('toast.adding-member'),
                    success: t('toast.added-member'),
                    error: (e) =>
                        t('errors.failed-add-member', { error: e.message }),
                }
            );
        },
    });

    return (
        <DD open={open} onOpenChange={setOpen}>
            <DDTrigger asChild>
                <Button>
                    {t('trigger')}
                    <Plus className="ml-2 h-6 w-6" />
                </Button>
            </DDTrigger>
            <DDContent>
                <h3 className="mb-4 text-2xl font-bold"> {t('title')}</h3>
                <div className="space-y-6">
                    <UserEmailSelector
                        user={user}
                        setUser={setUser}
                        autoFocus
                        autoComplete="off"
                    />

                    <div className="space-y-3">
                        <Label htmlFor="role"> {t('role.label')}</Label>
                        <SelectRole
                            onRoleUpdate={setRole}
                            role={role}
                            className="w-[200px]"
                        />
                    </div>
                </div>
                <DDFooter>
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
                        {t('submit')}
                    </Button>
                    {!!error && <p>{(error as Error).message}</p>}
                </DDFooter>
            </DDContent>
        </DD>
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
            role,
            edge: record('manages'),
            org: Organisation.optional(),
        })
    ),
});

type Data = z.infer<typeof Data>;

const Invited = Invite.extend({
    origin: z.union([UserAnonymous, z.string().email()]),
    role,
});

type Invited = z.infer<typeof Invited>;

function useData(slug: Organisation['slug']) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['organisation', 'members', slug],
        retry: false,
        throwOnError: true,
        queryFn: async () => {
            const result = await surreal.query<[null[], Invited[], Data]>(
                /* surql */ `
                    LET $org = SELECT 
                        *,
                        $auth.id IN managers[WHERE role = "owner" OR (role = "administrator" AND org != NONE)].user AS can_manage
                    FROM ONLY organisation 
                        WHERE slug = $slug 
                        LIMIT 1
                        FETCH 
                            managers.*.user.*, 
                            managers.*.org.name;

                    SELECT 
                        *,
                        (origin.* ?? origin) as origin
                    FROM invite WHERE target = $org.id;

                    $org;  
                `,
                { slug }
            );

            if (!result?.[1] || !result?.[2]) return null;

            return {
                organisation: Data.parse(result[2]),
                invited_members: z.array(Invited).parse(result[1]),
            };
        },
    });
}
