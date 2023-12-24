'use client';

import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import {
    DD,
    DDContent,
    DDDescription,
    DDFooter,
    DDHeader,
    DDTitle,
    DDTrigger,
} from '@/components/ui-custom/dd';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { useFeatureFlags } from '@/lib/featureFlags';
import { Link } from '@/locales/navigation';
import { Credential } from '@/schema/resources/credential';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { AlertOctagon, Loader2, Pencil, Plus, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export default function Account() {
    const { data: credentials, isPending, refetch } = useData();
    const [featureFlags] = useFeatureFlags();
    const t = useTranslations('pages.console.account.passkeys');

    return featureFlags.passkeys ? (
        <div className="flex flex-grow flex-col gap-12 pt-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">{t('title')}</h1>
                <Link
                    href="/account/create-passkey"
                    className={buttonVariants()}
                >
                    {t('create')}
                    <Plus className="ml-2 h-6 w-6" />
                </Link>
            </div>
            {credentials && credentials.length == 0 ? (
                <p className="opacity-50">{t('empty')}</p>
            ) : (
                <Table>
                    {credentials && (
                        <TableCaption>
                            <b>{t('table.caption.count')}:</b>{' '}
                            {credentials.length}
                        </TableCaption>
                    )}
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('table.columns.name')}</TableHead>
                            <TableHead>{t('table.columns.created')}</TableHead>
                            <TableHead>{t('table.columns.updated')}</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isPending &&
                            new Array(3).fill(0).map((_, id) => (
                                <TableRow key={id}>
                                    <TableCell>
                                        <Skeleton className="h-4 w-36" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell className="flex justify-end gap-4">
                                        <Skeleton className="h-8 w-10" />
                                        <Skeleton className="h-8 w-10" />
                                    </TableCell>
                                </TableRow>
                            ))}

                        {credentials?.map((credential) => (
                            <RenderCredential
                                credential={credential}
                                refetch={refetch}
                                key={credential.id}
                            />
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    ) : (
        <NotFoundScreen />
    );
}

function RenderCredential({
    credential,
    refetch,
}: {
    credential: Credential;
    refetch: () => unknown;
}) {
    return (
        <TableRow>
            <TableCell>{credential.name}</TableCell>
            <TableCell>
                <DateTooltip date={credential.created} />
            </TableCell>
            <TableCell>
                <DateTooltip date={credential.updated} />
            </TableCell>
            <TableCell className="flex justify-end gap-4">
                <EditCredential credential={credential} refetch={refetch} />
                <DeleteCredential credential={credential} refetch={refetch} />
            </TableCell>
        </TableRow>
    );
}

function EditCredential({
    credential,
    refetch,
}: {
    credential: Credential;
    refetch: () => unknown;
}) {
    const surreal = useSurreal();
    const [open, setOpen] = useState(false);
    const t = useTranslations('pages.console.account.passkeys.edit');

    const Schema = Credential.pick({
        name: true,
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful, isValid, isSubmitting },
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(async ({ name }) => {
        await surreal.merge(credential.id, { name });
        refetch();
        setOpen(false);
    });

    return (
        <DD open={open} onOpenChange={setOpen}>
            <DDTrigger asChild>
                <Button size="sm">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DDTrigger>
            <DDContent>
                <form onSubmit={handler}>
                    <DDHeader>
                        <DDTitle>{t('title')}</DDTitle>
                        <DDDescription>{t('description')}</DDDescription>
                    </DDHeader>
                    <div className="space-y-4 py-6">
                        <Label htmlFor="name">{t('fields.name.label')}</Label>
                        <Input
                            id="name"
                            placeholder={credential.name}
                            defaultValue={credential.name}
                            maxLength={Schema.shape.name.maxLength ?? undefined}
                            autoFocus
                            autoComplete="off"
                            {...register('name')}
                        />
                        {errors?.name && !isSubmitSuccessful && (
                            <p className="text-red-600">
                                {errors.name.message}
                            </p>
                        )}
                    </div>
                    <DDFooter>
                        <Button disabled={!isValid || isSubmitting}>
                            {isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {t('submit')}
                        </Button>
                        {errors?.root && (
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

function DeleteCredential({
    credential,
    refetch,
}: {
    credential: Credential;
    refetch: () => unknown;
}) {
    const surreal = useSurreal();
    const t = useTranslations('pages.console.account.passkeys.delete');

    const Schema = z.object({
        name: z.literal(credential.name),
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitting },
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(async () => {
        await surreal.query(/* surql */ `DELETE $id`, { id: credential.id });
        refetch();
    });

    return (
        <DD>
            <DDTrigger asChild>
                <Button size="sm" variant="destructive">
                    <Trash className="h-4 w-4" />
                </Button>
            </DDTrigger>
            <DDContent>
                <form onSubmit={handler}>
                    <DDHeader>
                        <DDTitle>{t('title')}</DDTitle>
                        <DDDescription>
                            {t.rich('description', {
                                b: (children) => <b>{children}</b>,
                                br: () => <br />,
                            })}
                        </DDDescription>
                    </DDHeader>
                    <div className="flex flex-col gap-4 py-3">
                        <Label htmlFor="name_delete">
                            <b>{t('repeat')}:</b>{' '}
                            <i className="select-none">{credential.name}</i>
                        </Label>
                        <Input
                            id="name_delete"
                            autoFocus
                            autoComplete="off"
                            {...register('name')}
                        />
                    </div>
                    <DDFooter>
                        <Button variant="destructive" disabled={!isValid}>
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <AlertOctagon className="mr-2 h-4 w-4" />
                            )}
                            {t('submit')}
                        </Button>
                        {errors?.root && (
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
        queryKey: ['passkeys'],
        queryFn: async () => {
            const result = await surreal.query<[Credential[]]>(/* surql */ `
                SELECT * FROM credential WHERE user = $auth;        
            `);

            if (!result?.[0]) return null;
            return result[0];
        },
    });
}
