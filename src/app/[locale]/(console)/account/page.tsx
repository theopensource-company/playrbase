'use client';

import { Avatar } from '@/components/cards/avatar';
import { Profile } from '@/components/cards/profile';
import UploadImage from '@/components/logic/UploadImage';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@/components/ui/table';
import { useSurreal } from '@/lib/Surreal';
import { useAuth } from '@/lib/auth';
import { fullname } from '@/lib/zod';
import { Admin } from '@/schema/resources/admin';
import { User } from '@/schema/resources/user';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export default function Account() {
    const { loading, user } = useAuth();
    const t = useTranslations('pages.console.account.index');

    return (
        <div className="flex flex-grow flex-col gap-12 pt-6">
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <div className="flex w-full max-w-2xl flex-col gap-6 rounded-lg border p-6">
                <Profile loading={loading} profile={user} size="big" />
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableHead>{t('picture.title')}</TableHead>
                            <TableCell>
                                <Avatar
                                    loading={loading}
                                    profile={user}
                                    size="small"
                                    renderBadge={false}
                                />
                            </TableCell>
                            <TableCell align="right">
                                <UploadImage
                                    intent="profile_picture"
                                    title={t('picture.uploader.title')}
                                    description={t(
                                        'picture.uploader.description'
                                    )}
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead>{t('name.title')}</TableHead>
                            <TableCell>
                                {!loading ? (
                                    user?.name
                                ) : (
                                    <Skeleton className="h-4" />
                                )}
                            </TableCell>
                            <TableCell align="right">
                                <EditName />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableHead>{t('email.title')}</TableHead>
                            <TableCell>
                                {!loading ? (
                                    user?.email
                                ) : (
                                    <Skeleton className="h-4" />
                                )}
                            </TableCell>
                            <TableCell align="right">
                                <EditEmail />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function EditName() {
    const surreal = useSurreal();
    const [open, setOpen] = useState(false);
    const { loading, user, refreshUser } = useAuth();
    const t = useTranslations('pages.console.account.index.name.dialog');

    const Schema = z.object({
        name: fullname(),
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful },
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(async ({ name }) => {
        const result = await surreal.query<[(User | Admin)[]]>(
            /* surql */ `
            UPDATE type::thing($auth.id) SET name = $name;
        `,
            { name }
        );

        if (!result?.[0]) throw new Error('Unexpected error occurred');
        if (result[0].detail) throw new Error(result[0].detail);

        if (!Array.isArray(result?.[0].result))
            throw new Error('Unexpected result format');
        if (result?.[0].result?.[0]?.name !== name)
            throw new Error('Update not applied');

        refreshUser();
        setOpen(false);
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {loading ? (
                    <Skeleton className="h-10 w-20" />
                ) : (
                    <Button>{t('trigger')}</Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handler}>
                    <DialogHeader>
                        <DialogTitle>{t('title')}</DialogTitle>
                        <DialogDescription>
                            {t('description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                {t('label')}
                            </Label>
                            {loading ? (
                                <Skeleton className="col-span-2 h-8" />
                            ) : (
                                <Input
                                    id="name"
                                    placeholder={user?.name}
                                    className="col-span-3"
                                    {...register('name')}
                                />
                            )}
                        </div>
                        {errors?.name && !isSubmitSuccessful && (
                            <p className="text-right text-red-600">
                                {errors.name.message}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit">{t('submit')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditEmail() {
    const [open, setOpen] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const { loading, user } = useAuth();
    const t = useTranslations('pages.console.account.index.email.dialog');

    const Schema = z.object({
        email: z.string().email(),
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful },
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(async ({ email }) => {
        const res = await fetch('/api/auth/change-email', {
            method: 'POST',
            body: JSON.stringify({
                email,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((res) => res.json())
            .catch(() => ({ success: false, error: 'client_fallback_error' }));

        if (!res.success)
            return alert(`An unexpected error occurred: ${res.error}`);

        setEmailSent(true);
    });

    useEffect(() => {
        if (!open && emailSent) setTimeout(() => setEmailSent(false), 100);
    }, [open, emailSent, setEmailSent]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {loading ? (
                    <Skeleton className="h-10 w-20" />
                ) : (
                    <Button>{t('trigger')}</Button>
                )}
            </DialogTrigger>
            <DialogContent>
                {emailSent ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>{t('sent.title')}</DialogTitle>
                            <DialogDescription>
                                {t('sent.description')}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button onClick={() => setOpen(false)}>
                                {t('sent.close')}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <form onSubmit={handler}>
                        <DialogHeader>
                            <DialogTitle>{t('form.title')}</DialogTitle>
                            <DialogDescription>
                                {t('form.description')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    {t('form.label')}
                                </Label>
                                {loading ? (
                                    <Skeleton className="col-span-2 h-8" />
                                ) : (
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder={user?.email}
                                        className="col-span-3"
                                        {...register('email')}
                                    />
                                )}
                            </div>
                            {errors?.email && !isSubmitSuccessful && (
                                <p className="text-right text-red-600">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="submit">{t('form.submit')}</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
