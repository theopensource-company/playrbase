'use client';

import { Profile } from '@/components/cards/profile';
import { CreateOrganisation } from '@/components/data/organisations/create';
import { OrganisationTable } from '@/components/data/organisations/table';
import {
    DD,
    DDContent,
    DDDescription,
    DDFooter,
    DDHeader,
    DDTitle,
} from '@/components/ui-custom/dd';
import { Button } from '@/components/ui/button';
import { useSurreal } from '@/lib/Surreal';
import {
    Organisation,
    OrganisationSafeParse,
} from '@/schema/resources/organisation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
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
