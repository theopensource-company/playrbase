'use client';

import { OrganisationTable } from '@/components/data/organisations/table';
import {
    OrganisationSelector,
    useOrganisationSelector,
} from '@/components/logic/OrganisationSelector';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSurreal } from '@/lib/Surreal';
import {
    Organisation,
    OrganisationSafeParse,
} from '@/schema/resources/organisation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export default function Account() {
    const { data: organisations, isPending, refetch } = useData();
    const t = useTranslations('pages.console.account.organisations');

    function findUnconfirmedEdge(id: Organisation['id']) {
        const obj = organisations?.unconfirmed ?? {};
        return Object.keys(obj).find((k) => obj[k].id === id);
    }

    const surreal = useSurreal();
    const { mutateAsync: acceptInvitation } = useMutation({
        mutationKey: ['manages', 'accept-invite'],
        async mutationFn(id: Organisation['id']) {
            const edge = findUnconfirmedEdge(id);
            if (!edge) throw new Error('Could not find unconfirmed edge');
            await surreal.merge(edge, { confirmed: true });
            refetch();
        },
    });

    const { mutateAsync: denyInvitation } = useMutation({
        mutationKey: ['manages', 'deny-invite'],
        async mutationFn(id: Organisation['id']) {
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
                <CreateOrganisation refetch={refetch} />
            </div>
            <OrganisationTable
                isLoading={isPending}
                organisations={organisations?.confirmed ?? {}}
                unconfirmed={organisations?.unconfirmed ?? {}}
                acceptInvitation={acceptInvitation}
                denyInvitation={denyInvitation}
                caption={
                    organisations ? (
                        <>
                            <b>{t('table.caption.count')}:</b>{' '}
                            {Object.values(organisations.confirmed).length +
                                Object.values(organisations.unconfirmed).length}
                        </>
                    ) : undefined
                }
            />
        </div>
    );
}

function CreateOrganisation({ refetch }: { refetch: () => unknown }) {
    const surreal = useSurreal();
    const [partOf, setPartOf] = useOrganisationSelector();
    const [open, setOpen] = useState(false);
    const t = useTranslations('pages.console.account.organisations.new');

    const Schema = Organisation.pick({
        name: true,
        email: true,
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful, isValid },
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(async ({ name, email }) => {
        // TODO set to correct type, not important for the moment
        await surreal.query<[Organisation]>(
            /* surql */ `
            CREATE ONLY organisation CONTENT {
                name: $name,
                email: $email,
                part_of: $part_of,
            };
        `,
            { name, email, part_of: partOf }
        );

        refetch();
        setPartOf(undefined);
        setOpen(false);
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    {t('trigger')}
                    <Plus className="ml-2 h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handler}>
                    <h3 className="mb-4 text-2xl font-bold">{t('title')}</h3>
                    <div className="mb-8 mt-6 space-y-4">
                        <div className="space-y-3">
                            <Label htmlFor="name">
                                {t('fields.name.label')}
                            </Label>
                            <Input
                                id="name"
                                {...register('name')}
                                maxLength={
                                    Organisation.shape.name.maxLength ??
                                    undefined
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
                        <div className="space-y-3">
                            <Label htmlFor="email">
                                {t('fields.email.label')}
                            </Label>
                            <Input
                                id="email"
                                {...register('email')}
                                placeholder={t('fields.email.placeholder')}
                                autoComplete="off"
                            />
                            {errors?.email && !isSubmitSuccessful && (
                                <p className="text-red-600">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>
                        <OrganisationSelector
                            organisation={partOf}
                            setOrganisation={setPartOf}
                            label={t('fields.selector.label')}
                            placeholder={t('fields.selector.placeholder')}
                            autoComplete="off"
                            canManage
                        />
                    </div>
                    <div className="mt-3">
                        <Button disabled={!isValid}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('submit')}
                        </Button>
                    </div>
                    {errors?.root && !isSubmitSuccessful && (
                        <p className="text-red-600">{errors.root.message}</p>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}

function useData() {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['organisations'],
        queryFn: async () => {
            const result = await surreal.query<
                [
                    Record<string, Organisation>,
                    Record<string, OrganisationSafeParse>,
                ]
            >(/* surql */ `
                object::from_entries((
                    SELECT VALUE [<string> id, out.*]
                        FROM $auth->manages[?confirmed] 
                        FETCH organisation.part_of.*
                ));

                object::from_entries((
                    SELECT VALUE [<string> id, out.*]
                        FROM $auth->manages[?!confirmed] 
                        FETCH organisation.part_of.*
                ));       
            `);

            if (!result?.[0] || !result?.[1]) return null;
            return {
                confirmed: z.record(Organisation).parse(result[0]),
                unconfirmed: z.record(OrganisationSafeParse).parse(result[1]),
            };
        },
    });
}
