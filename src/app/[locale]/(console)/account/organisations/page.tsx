'use client';

import { Avatar } from '@/components/cards/avatar';
import {
    OrganisationSelector,
    useOrganisationSelector,
} from '@/components/logic/OrganisationSelector';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
import { record } from '@/lib/zod';
import { Link } from '@/locales/navigation';
import {
    Organisation,
    OrganisationSafeParse,
} from '@/schema/resources/organisation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, Plus, Settings2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export default function Account() {
    const { data: organisations, isPending, refetch } = useData();
    const t = useTranslations('pages.console.account.organisations');

    return (
        <div className="flex flex-grow flex-col gap-12 pt-6">
            <div className="flex items-center justify-between pb-6">
                <h1 className="text-3xl font-bold">{t('title')}</h1>
                <CreateOrganisation refetch={refetch} />
            </div>
            <Table>
                {organisations && (
                    <TableCaption>
                        <b>{t('table.caption.count')}:</b>{' '}
                        {organisations.confirmed.length +
                            organisations.unconfirmed.length}
                    </TableCaption>
                )}
                <TableHeader>
                    <TableRow>
                        <TableHead />
                        <TableHead>{t('table.columns.name')}</TableHead>
                        <TableHead>{t('table.columns.email')}</TableHead>
                        <TableHead>{t('table.columns.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isPending && (
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
                                    {t('table.body.invitations')}
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
                                    {t('table.body.confirmed')}
                                </h2>
                            )}
                            {organisations.confirmed.map((data) => (
                                <RenderConfirmed data={data} key={data.edge} />
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
    const surreal = useSurreal();
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

function RenderConfirmed({ data: { organisation } }: { data: Data }) {
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
            </TableCell>
        </TableRow>
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

const Data = z.object({
    edge: record('manages'),
    organisation: OrganisationSafeParse.extend({
        part_of: OrganisationSafeParse.optional().nullable(),
    }),
});

type Data = z.infer<typeof Data>;

function useData() {
    const surreal = useSurreal();
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

            if (!result?.[0] || !result?.[1]) return null;
            return {
                confirmed: z.array(Data).parse(result[0]),
                unconfirmed: z.array(Data).parse(result[1]),
            };
        },
    });
}
