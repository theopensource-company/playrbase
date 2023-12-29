'use client';

import { TeamTable } from '@/components/data/teams/table';
import { DD, DDContent, DDFooter, DDTrigger } from '@/components/ui-custom/dd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSurreal } from '@/lib/Surreal';
import { Team, TeamAnonymous } from '@/schema/resources/team';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export default function Teams() {
    const { data: teams, isPending, refetch } = useData();
    const t = useTranslations('pages.console.account.organisations');

    function findUnconfirmedEdge(id: Team['id']) {
        const obj = teams?.unconfirmed ?? {};
        return Object.keys(obj).find((k) => obj[k].id === id);
    }

    const surreal = useSurreal();
    const { mutateAsync: acceptInvitation } = useMutation({
        mutationKey: ['plays_in', 'accept-invite'],
        async mutationFn(id: Team['id']) {
            const edge = findUnconfirmedEdge(id);
            if (!edge) throw new Error('Could not find unconfirmed edge');
            await surreal.merge(edge, { confirmed: true });
            refetch();
        },
    });

    const { mutateAsync: denyInvitation } = useMutation({
        mutationKey: ['plays_in', 'deny-invite'],
        async mutationFn(id: Team['id']) {
            const edge = findUnconfirmedEdge(id);
            if (!edge) throw new Error('Could not find unconfirmed edge');
            await surreal.delete(edge);
            refetch();
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
        </div>
    );
}

function CreateTeam({ refetch }: { refetch: () => unknown }) {
    const surreal = useSurreal();
    const [open, setOpen] = useState(false);
    const t = useTranslations('pages.console.account.organisations.new');

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
        // TODO set to correct type, not important for the moment
        await surreal.query<[Team]>(
            /* surql */ `
            CREATE ONLY team CONTENT {
                name: $name,
            };
        `,
            { name }
        );

        refetch();
        setOpen(false);
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
                        FROM $auth->plays_in[?confirmed] 
                ));

                object::from_entries((
                    SELECT VALUE [<string> id, out.*]
                        FROM $auth->plays_in[?!confirmed] 
                ));       
            `);

            if (!result?.[0] || !result?.[1]) return null;
            console.log(result);
            return {
                confirmed: z.record(Team).parse(result[0]),
                unconfirmed: z.record(TeamAnonymous).parse(result[1]),
            };
        },
    });
}
