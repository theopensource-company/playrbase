'use client';

import { Avatar } from '@/components/cards/avatar';
import { Profile } from '@/components/cards/profile';
import {
    BirthdateSelector,
    useBirthdateSelector,
} from '@/components/logic/BirthdateSelector';
import UploadImage from '@/components/logic/UploadImage';
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
import { Actor } from '@/schema/resources/actor';
import { Admin } from '@/schema/resources/admin';
import { User } from '@/schema/resources/user';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export default function Account() {
    const { loading, user, refreshUser } = useAuth();
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
                                    actor={user as Actor}
                                    loading={loading}
                                    triggerRefresh={refreshUser}
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
                        <TableRow>
                            <TableHead>{t('birthdate.title')}</TableHead>
                            <TableCell>
                                {!loading ? (
                                    dayjs(user?.birthdate).format('LL')
                                ) : (
                                    <Skeleton className="h-4" />
                                )}
                            </TableCell>
                            <TableCell align="right">
                                <EditBirthdate />
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

        if (!Array.isArray(result?.[0]))
            throw new Error('Unexpected result format');
        if (result?.[0][0]?.name !== name)
            throw new Error('Update not applied');

        refreshUser();
        setOpen(false);
    });

    return (
        <DD open={open} onOpenChange={setOpen}>
            <DDTrigger asChild>
                {loading ? (
                    <Skeleton className="h-10 w-20" />
                ) : (
                    <Button>{t('trigger')}</Button>
                )}
            </DDTrigger>
            <DDContent>
                <form onSubmit={handler}>
                    <DDHeader>
                        <DDTitle>{t('title')}</DDTitle>
                        <DDDescription>{t('description')}</DDDescription>
                    </DDHeader>
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
                                    autoFocus
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
                    <DDFooter>
                        <Button type="submit">{t('submit')}</Button>
                    </DDFooter>
                </form>
            </DDContent>
        </DD>
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
        <DD open={open} onOpenChange={setOpen}>
            <DDTrigger asChild>
                {loading ? (
                    <Skeleton className="h-10 w-20" />
                ) : (
                    <Button>{t('trigger')}</Button>
                )}
            </DDTrigger>
            <DDContent>
                {emailSent ? (
                    <>
                        <DDHeader>
                            <DDTitle>{t('sent.title')}</DDTitle>
                            <DDDescription>
                                {t('sent.description')}
                            </DDDescription>
                        </DDHeader>
                        <DDFooter closeText={t('sent.close')} />
                    </>
                ) : (
                    <form onSubmit={handler}>
                        <DDHeader>
                            <DDTitle>{t('form.title')}</DDTitle>
                            <DDDescription>
                                {t('form.description')}
                            </DDDescription>
                        </DDHeader>
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
                                        autoFocus
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
                        <DDFooter>
                            <Button type="submit">{t('form.submit')}</Button>
                        </DDFooter>
                    </form>
                )}
            </DDContent>
        </DD>
    );
}

function EditBirthdate() {
    const [open, setOpen] = useState(false);
    const { loading, user, refreshUser } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const t = useTranslations('pages.console.account.index.birthdate.dialog');

    const birthdateSelector = useBirthdateSelector({
        birthdate: user?.birthdate,
    });

    const { birthdate, isBirthdateReady, birthdatePermit, setBirthdate } =
        birthdateSelector;

    useEffect(
        () => user?.birthdate && setBirthdate(user?.birthdate),
        [user?.birthdate, setBirthdate]
    );

    const submit = useCallback(async () => {
        setSubmitting(true);

        const raw = await fetch('/api/birthdate/change', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                birthdate,
                birthdate_permit: birthdatePermit,
            }),
        });

        const { success, error } = await raw.json();
        if (success) {
            setOpen(false);
            setSubmitting(false);
            setBirthdate(birthdate); // Reset form's state
            refreshUser();
        } else {
            setSubmitting(false);
            toast.error(t('error') + ': ' + error);
        }
    }, [birthdate, birthdatePermit, setBirthdate, refreshUser, t]);

    return (
        <DD open={open} onOpenChange={setOpen}>
            <DDTrigger asChild>
                {loading ? (
                    <Skeleton className="h-10 w-20" />
                ) : (
                    <Button>{t('trigger')}</Button>
                )}
            </DDTrigger>
            <DDContent>
                <DDHeader>
                    <DDTitle>{t('form.title')}</DDTitle>
                    <DDDescription>{t('form.description')}</DDDescription>
                </DDHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">{t('form.label')}</Label>
                        {loading ? (
                            <Skeleton className="col-span-2 h-8" />
                        ) : (
                            <div className="col-span-3">
                                <BirthdateSelector {...birthdateSelector} />
                            </div>
                        )}
                    </div>
                </div>
                <DDFooter>
                    <Button
                        onClick={submit}
                        disabled={submitting || !isBirthdateReady}
                    >
                        {t('form.submit')}
                        {submitting && (
                            <Loader2 className="ml-2 w-4 animate-spin" />
                        )}
                    </Button>
                </DDFooter>
            </DDContent>
        </DD>
    );
}
