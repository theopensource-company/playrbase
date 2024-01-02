'use client';

import { Profile } from '@/components/cards/profile';
import { OrganisationTable } from '@/components/data/organisations/table';
import {
    OrganisationSelector,
    useOrganisationSelector,
} from '@/components/logic/OrganisationSelector';
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
import {
    Organisation,
    OrganisationSafeParse,
} from '@/schema/resources/organisation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export default function Account() {
    const { data: organisations, isPending, refetch } = useData();
    const t = useTranslations('pages.console.account.organisations');
    const searchParams = useSearchParams();
    const invite_id = searchParams.get('invite_id');
    const invite_popup =
        (!!invite_id && organisations?.unconfirmed?.[`invite:${invite_id}`]) ||
        undefined;

    function findInvite(id: Organisation['id']) {
        const obj = organisations?.unconfirmed ?? {};
        return Object.keys(obj).find((k) => obj[k].id === id);
    }

    const surreal = useSurreal();
    const { mutateAsync: acceptInvitation } = useMutation({
        mutationKey: ['manages', 'accept-invite'],
        async mutationFn(organisation: Organisation['id']) {
            await toast.promise(
                async () => {
                    await surreal.query(
                        /* surrealql */ `
                            RELATE $auth->manages->$organisation;
                        `,
                        { organisation }
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
        mutationKey: ['manages', 'deny-invite'],
        async mutationFn(id: Organisation['id']) {
            await toast.promise(
                async () => {
                    const edge = findInvite(id);
                    if (!edge) throw new Error(t('errors.no-unconfirmed-edge'));
                    await surreal.delete(edge);
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
            {invite_popup && (
                <InvitePopup
                    organisation={invite_popup}
                    acceptInvitation={acceptInvitation}
                    denyInvitation={denyInvitation}
                />
            )}
        </div>
    );
}

function InvitePopup({
    organisation,
    acceptInvitation,
    denyInvitation,
}: {
    organisation: OrganisationSafeParse;
    acceptInvitation: (id: Organisation['id']) => Promise<unknown>;
    denyInvitation: (id: Organisation['id']) => Promise<unknown>;
}) {
    const [open, setOpen] = useState(true);
    const t = useTranslations(
        'pages.console.account.organisations.invite-popup'
    );

    return (
        <DD open={open} onOpenChange={setOpen}>
            <DDContent>
                <DDHeader>
                    <DDTitle>{t('title')}</DDTitle>
                    <DDDescription>{t('description')}</DDDescription>
                </DDHeader>
                <div className="mt-4 rounded-lg border p-3">
                    <Profile profile={organisation} />
                </div>
                <DDFooter closeText={t('close')}>
                    <Button onClick={() => acceptInvitation(organisation.id)}>
                        {t('accept')}
                    </Button>
                    <Button
                        onClick={() => denyInvitation(organisation.id)}
                        variant="destructive"
                    >
                        {t('deny')}
                    </Button>
                </DDFooter>
            </DDContent>
        </DD>
    );
}

function CreateOrganisation({ refetch }: { refetch: () => unknown }) {
    const surreal = useSurreal();
    const router = useRouter();
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
        const result = (async () => {
            const [org] = await surreal.query<[Organisation]>(
                /* surql */ `
                CREATE ONLY organisation CONTENT {
                    name: $name,
                    email: $email,
                    part_of: $part_of,
                };
            `,
                { name, email, part_of: partOf }
            );

            await refetch();
            setPartOf(undefined);
            setOpen(false);
            return org;
        })();

        await toast.promise(result, {
            loading: t('toast.creating-organisation'),
            success: t('toast.created-organisation'),
            error: (e) =>
                t('errors.create-organisation-failed', {
                    error: e.message,
                }),
            action: {
                label: t('toast.buttons.view'),
                onClick: () =>
                    result.then(({ slug }) =>
                        router.push(`/organisation/${slug}/overview`)
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
                        FROM $auth->manages
                        FETCH organisation.part_of.*
                ));

                object::from_entries((
                    SELECT VALUE [<string> id, target.*]
                        FROM invite WHERE origin = $auth AND meta::tb(target) == 'organisation'
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
