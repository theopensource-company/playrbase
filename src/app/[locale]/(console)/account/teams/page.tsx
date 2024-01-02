'use client';

import { Profile } from '@/components/cards/profile';
import { TeamTable } from '@/components/data/teams/table';
import {
    DD,
    DDContent,
    DDDescription,
    DDFooter,
    DDHeader,
    DDTitle,
    DDTrigger,
} from '@/components/ui-custom/dd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSurreal } from '@/lib/Surreal';
import { useRouter } from '@/locales/navigation';
import { Team, TeamAnonymous } from '@/schema/resources/team';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export default function Teams() {
    const { data: teams, isPending, refetch } = useData();
    const t = useTranslations('pages.console.account.teams');
    const searchParams = useSearchParams();
    const invite_id = searchParams.get('invite_id');
    const invite_popup =
        (!!invite_id && teams?.unconfirmed?.[`invite:${invite_id}`]) ||
        undefined;

    function findInvite(id: Team['id']) {
        const obj = teams?.unconfirmed ?? {};
        return Object.keys(obj).find((k) => obj[k].id === id);
    }

    const surreal = useSurreal();
    const { mutateAsync: acceptInvitation } = useMutation({
        mutationKey: ['plays_in', 'accept-invite'],
        async mutationFn(team: Team['id']) {
            await toast.promise(
                async () => {
                    await surreal.query(
                        /* surrealql */ `
                            RELATE $auth->plays_in->$team;
                        `,
                        { team }
                    );
                    await refetch();
                },
                {
                    loading: t('toast.accepting-invite'),
                    success: t('toast.accepted-invite'),
                    error: (e) =>
                        t('errors.accept-failed', { error: e.message }),
                }
            );
        },
    });

    const { mutateAsync: denyInvitation } = useMutation({
        mutationKey: ['plays_in', 'deny-invite'],
        async mutationFn(id: Team['id']) {
            await toast.promise(
                async () => {
                    const invite = findInvite(id);
                    if (!invite)
                        throw new Error(t('errors.no-unconfirmed-edge'));
                    await surreal.delete(invite);
                    await refetch();
                },
                {
                    loading: t('toast.denying-invite'),
                    success: t('toast.denied-invite'),
                    error: (e) => t('errors.deny-failed', { error: e.message }),
                }
            );
        },
    });

    return (
        <div className="flex flex-grow flex-col gap-12 pt-6">
            <div className="flex items-center justify-between pb-6">
                <h1 className="text-3xl font-bold">{t('title')}</h1>
                <CreateTeam refetch={refetch} />
            </div>
            <TeamTable
                isLoading={isPending}
                teams={teams?.confirmed ?? {}}
                unconfirmed={teams?.unconfirmed ?? {}}
                acceptInvitation={acceptInvitation}
                denyInvitation={denyInvitation}
                caption={
                    teams ? (
                        <>
                            <b>{t('table.caption.count')}:</b>{' '}
                            {Object.values(teams.confirmed).length +
                                Object.values(teams.unconfirmed).length}
                        </>
                    ) : undefined
                }
            />
            {invite_popup && (
                <InvitePopup
                    team={invite_popup}
                    acceptInvitation={acceptInvitation}
                    denyInvitation={denyInvitation}
                />
            )}
        </div>
    );
}

function InvitePopup({
    team,
    acceptInvitation,
    denyInvitation,
}: {
    team: TeamAnonymous;
    acceptInvitation: (id: Team['id']) => Promise<unknown>;
    denyInvitation: (id: Team['id']) => Promise<unknown>;
}) {
    const [open, setOpen] = useState(true);
    const t = useTranslations('pages.console.account.teams.invite-popup');
    return (
        <DD open={open} onOpenChange={setOpen}>
            <DDContent>
                <DDHeader>
                    <DDTitle>{t('title')}</DDTitle>
                    <DDDescription>{t('description')}</DDDescription>
                </DDHeader>
                <div className="mt-4 rounded-lg border p-3">
                    <Profile profile={team} />
                </div>
                <DDFooter closeText={t('close')}>
                    <Button onClick={() => acceptInvitation(team.id)}>
                        {t('accept')}
                    </Button>
                    <Button
                        onClick={() => denyInvitation(team.id)}
                        variant="destructive"
                    >
                        {t('deny')}
                    </Button>
                </DDFooter>
            </DDContent>
        </DD>
    );
}

function CreateTeam({ refetch }: { refetch: () => unknown }) {
    const surreal = useSurreal();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const t = useTranslations('pages.console.account.teams.new');

    const Schema = Team.pick({
        name: true,
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful, isValid },
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(async ({ name }) => {
        const result = (async () => {
            const [team] = await surreal.query<[Team]>(
                /* surql */ `
                CREATE ONLY team CONTENT {
                    name: $name,
                };
            `,
                { name }
            );

            await refetch();
            setOpen(false);
            return team;
        })();

        await toast.promise(result, {
            loading: t('toast.creating-team'),
            success: t('toast.created-team'),
            error: (e) => t('errors.create-team-failed', { error: e.message }),
            action: {
                label: t('toast.buttons.view'),
                onClick: () =>
                    result.then(({ slug }) =>
                        router.push(`/team/${slug}/overview`)
                    ),
            },
        });
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
                <form onSubmit={handler}>
                    <h3 className="mb-4 text-2xl font-bold">{t('title')}</h3>
                    <div className="mt-6 space-y-4">
                        <div className="space-y-3">
                            <Label htmlFor="name">
                                {t('fields.name.label')}
                            </Label>
                            <Input
                                id="name"
                                {...register('name')}
                                maxLength={
                                    Team.shape.name.maxLength ?? undefined
                                }
                                autoFocus
                                autoComplete="off"
                            />
                            {errors?.name && !isSubmitSuccessful && (
                                <p className="text-red-600">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <DDFooter>
                        <Button disabled={!isValid}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('submit')}
                        </Button>
                        {errors?.root && !isSubmitSuccessful && (
                            <p className="text-red-600">
                                {errors.root.message}
                            </p>
                        )}
                    </DDFooter>
                </form>
            </DDContent>
        </DD>
    );
}

function useData() {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['teams'],
        retry: false,
        throwOnError: true,
        queryFn: async () => {
            const result = await surreal.query<
                [Record<string, Team>, Record<string, TeamAnonymous>]
            >(/* surql */ `
                object::from_entries((
                    SELECT VALUE [<string> id, out.*]
                        FROM $auth->plays_in
                ));

                object::from_entries((
                    SELECT VALUE [<string> id, target.*]
                        FROM invite WHERE origin = $auth AND meta::tb(target) == 'team'
                ));       
            `);

            if (!result?.[0] || !result?.[1]) return null;

            return {
                confirmed: z.record(Team).parse(result[0]),
                unconfirmed: z.record(TeamAnonymous).parse(result[1]),
            };
        },
    });
}
