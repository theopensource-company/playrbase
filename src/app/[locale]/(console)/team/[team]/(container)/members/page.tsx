'use client';

import { Avatar } from '@/components/cards/avatar';
import { Profile } from '@/components/cards/profile';
import Container from '@/components/layout/Container';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { UserSelector, useUserSelector } from '@/components/logic/UserSelector';
import { DD, DDContent, DDFooter, DDTrigger } from '@/components/ui-custom/dd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { record } from '@/lib/zod';
import { Team } from '@/schema/resources/team';
import {
    User,
    UserAnonymous,
    UserAsRelatedUser,
} from '@/schema/resources/user';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Mail, MailX, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { z } from 'zod';
import { PageTitle } from '../../components/PageTitle';

export default function Account() {
    const params = useParams();
    const slug = Array.isArray(params.team) ? params.team[0] : params.team;
    const { isPending, data, refetch } = useData(slug);
    const t = useTranslations('pages.console.organisation.members');

    if (!data?.team) return <NotFoundScreen text={t('not_found')} />;
    const team = data.team;
    const invited_members = data.invited_members;

    return isPending ? (
        <Container className="flex w-full flex-grow items-center justify-center">
            <Loader2 size={50} className="animate-spin" />
        </Container>
    ) : team ? (
        <div className="flex flex-grow flex-col gap-6 pt-6">
            <PageTitle team={team as unknown as Team} title={t('title')}>
                <AddMember team={team.id} refresh={refetch} />
            </PageTitle>
            <div className="space-y-20">
                <ListPlayers
                    team={team}
                    invites={invited_members}
                    refresh={refetch}
                />
            </div>
        </div>
    ) : (
        <NotFoundScreen text={t('not_found')} />
    );
}

function ListPlayers({
    team,
    invites,
    refresh,
}: {
    team: Data;
    invites?: Invited[];
    refresh: () => unknown;
}) {
    const t = useTranslations(
        'pages.console.organisation.members.list_managers'
    );

    return (
        <div>
            <div className="rounded border">
                <Table>
                    <TableCaption className="mb-4">
                        <b>{t('table.caption.count')}:</b>{' '}
                        {team.players.length + (invites?.length ?? 0)}
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
                            <InvitedPlayer
                                key={invite.edge}
                                invite={invite}
                                refresh={refresh}
                            />
                        ))}
                        {team.players.map((player) => (
                            <ListPlayer
                                key={player.id}
                                player={player}
                                team={team}
                                refresh={refresh}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function ListPlayer({
    refresh,
    player,
    team,
}: {
    refresh: () => unknown;
    player: UserAsRelatedUser;
    team: Data;
}) {
    const surreal = useSurreal();
    const t = useTranslations(
        'pages.console.organisation.members.list_manager'
    );

    const { mutate: deletePlayer, isPending: isDeletingPlayer } = useMutation({
        mutationKey: ['team', 'delete-player', player.id],
        mutationFn: async () => {
            await surreal.query(
                /* surql */ `
                        DELETE $player->plays_in WHERE out = $team;
                    `,
                {
                    player: player.id,
                    team: team.id,
                }
            );
            await refresh();
        },
    });

    return (
        <TableRow>
            <TableCell>
                <Avatar size="small" profile={player} />
            </TableCell>
            <TableCell>{player.name}</TableCell>
            <TableCell>{player.email}</TableCell>
            <TableCell align="right">
                {isDeletingPlayer ? (
                    <Skeleton className="h-10 w-14" />
                ) : (
                    <DD>
                        <DDTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 />
                            </Button>
                        </DDTrigger>
                        <DDContent>
                            <h3 className="text-2xl font-bold">
                                {t('actions.remove-dialog.title', {
                                    name: player.name,
                                })}
                            </h3>
                            <p>{t('actions.remove-dialog.description')}</p>
                            <div className="my-4 rounded-md border p-4">
                                <Profile profile={player} />
                            </div>
                            <DDFooter closeDisabled={isDeletingPlayer}>
                                <Button
                                    variant="destructive"
                                    onClick={() => deletePlayer()}
                                    disabled={isDeletingPlayer}
                                >
                                    {isDeletingPlayer && (
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

function InvitedPlayer({
    invite: { user, edge },
    refresh,
}: {
    invite: Invited;
    refresh: () => unknown;
}) {
    const surreal = useSurreal();
    const t = useTranslations(
        'pages.console.organisation.members.invited_manager'
    );

    const { mutate: revokeInvite, isPending: isRevokingInvite } = useMutation({
        mutationKey: ['team', 'revoke-invite', edge],
        mutationFn: async () => {
            await surreal.delete(edge);
            await refresh();
        },
    });

    return (
        <TableRow>
            <TableCell>
                <Avatar profile={user as User} size="small" />
            </TableCell>
            <TableCell>
                {user.name}
                <Badge className="ml-3 whitespace-nowrap">
                    {t('pending-invite')}
                </Badge>
            </TableCell>
            <TableCell />
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
    team,
    refresh,
}: {
    team: Team['id'];
    refresh: () => unknown;
}) {
    const surreal = useSurreal();
    const [user, setUser] = useUserSelector();
    const [open, setOpen] = useState(false);
    const t = useTranslations('pages.console.organisation.members.add_member');

    const { mutateAsync, error } = useMutation({
        mutationKey: ['plays_in', 'invite'],
        async mutationFn() {
            // TODO set to correct type, not important for the moment
            await surreal.query<[string[]]>(
                /* surql */ `
                RELATE $user->plays_in->$team
            `,
                { user, team }
            );
            refresh();
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
                    <UserSelector
                        user={user}
                        setUser={setUser}
                        autoFocus
                        autoComplete="off"
                    />
                </div>
                <DDFooter>
                    <Button
                        disabled={!user}
                        onClick={() => {
                            mutateAsync().then(() => {
                                setUser(undefined);
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

const Data = Team.extend({
    players: z.array(UserAsRelatedUser),
});

type Data = z.infer<typeof Data>;

const Invited = z.object({
    user: UserAnonymous,
    edge: record('plays_in'),
});

type Invited = z.infer<typeof Invited>;

function useData(slug: Team['slug']) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['team', 'members', slug],
        retry: false,
        throwOnError: true,
        queryFn: async () => {
            const result = await surreal.query<[null[], Invited[], Data]>(
                /* surql */ `
                    LET $team = SELECT * FROM ONLY team 
                        WHERE slug = $slug 
                        LIMIT 1
                        FETCH 
                            players.*;

                    SELECT in.* as user, id as edge
                        FROM $team.id<-plays_in[?!confirmed];

                    $team;  
                `,
                { slug }
            );

            if (!result?.[1] || !result?.[2]) return null;

            return {
                team: Data.parse(result[2]),
                invited_members: z.array(Invited).parse(result[1]),
            };
        },
    });
}
