'use client';

import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    useOrganisation,
    useUpdateOrganisation,
} from '@/lib/Queries/Organisation';
import { useSurreal } from '@/lib/Surreal';
import { promiseTimeout } from '@/lib/utils';
import { Organisation } from '@/schema/resources/organisation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogClose } from '@radix-ui/react-dialog';
import { AlertOctagon, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next-intl/client';
import { useParams } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export default function Account() {
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;
    const {
        isPending,
        data: organisation,
        refetch,
    } = useOrganisation<Organisation>({ slug });
    const t = useTranslations('pages.console.organisation.settings');

    return isPending ? (
        <LoaderOverlay />
    ) : organisation ? (
        <div className="flex max-w-2xl flex-grow flex-col gap-6 pt-6">
            <h1 className="pb-6 text-3xl font-semibold">{t('title')}</h1>
            <NameEditor organisation={organisation} onSubmit={refetch} />
            <EmailEditor organisation={organisation} onSubmit={refetch} />
            <WebsiteEditor organisation={organisation} onSubmit={refetch} />
            <DescriptionEditor organisation={organisation} onSubmit={refetch} />
            <DangerZone organisation={organisation} />
        </div>
    ) : (
        <NotFoundScreen text={t('not_found')} />
    );
}

function NameEditor({
    organisation,
    onSubmit,
}: {
    organisation: Organisation;
    onSubmit: () => void;
}) {
    const { mutateAsync } = useUpdateOrganisation(organisation.id);
    const t = useTranslations('pages.console.organisation.settings.name');

    const Schema = Organisation.pick({
        name: true,
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful, isValid, isSubmitting },
        reset,
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(({ name }) =>
        promiseTimeout(
            mutateAsync({ name }).then(() => onSubmit()),
            250
        ).then(() => reset())
    );

    return (
        <form
            onSubmit={handler}
            className="flex w-full flex-col gap-6 rounded-lg border p-6"
        >
            <div className="space-y-2">
                <h2 className="text-xl font-bold">{t('title')}</h2>
                <p>{t('description')}</p>
            </div>
            <Input
                defaultValue={organisation?.name}
                {...register('name')}
                className="max-w-sm"
                maxLength={Organisation.shape.name.maxLength ?? undefined}
            />
            <div className="flex items-center gap-4">
                <Button size="sm" disabled={!isValid || isSubmitting}>
                    {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t('submit')}
                </Button>
                {errors?.name && !isSubmitSuccessful && (
                    <p className="text-red-600">{errors.name.message}</p>
                )}
            </div>
        </form>
    );
}

function EmailEditor({
    organisation,
    onSubmit,
}: {
    organisation: Organisation;
    onSubmit: () => void;
}) {
    const { mutateAsync } = useUpdateOrganisation(organisation.id);
    const t = useTranslations('pages.console.organisation.settings.email');

    const Schema = Organisation.pick({
        email: true,
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful, isValid, isSubmitting },
        reset,
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(({ email }) =>
        promiseTimeout(
            mutateAsync({ email }).then(() => onSubmit()),
            250
        ).then(() => reset())
    );

    return (
        <form
            onSubmit={handler}
            className="flex w-full flex-col gap-6 rounded-lg border p-6"
        >
            <div className="space-y-2">
                <h2 className="text-xl font-bold">{t('title')}</h2>
                <p>{t('description')}</p>
            </div>
            <Input
                placeholder={t('placeholder')}
                defaultValue={organisation?.email}
                {...register('email')}
                className="max-w-sm"
            />
            <div className="flex items-center gap-4">
                <Button size="sm" disabled={!isValid || isSubmitting}>
                    {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t('submit')}
                </Button>
                {errors?.email && !isSubmitSuccessful && (
                    <p className="text-red-600">{errors.email.message}</p>
                )}
            </div>
        </form>
    );
}

function WebsiteEditor({
    organisation,
    onSubmit,
}: {
    organisation: Organisation;
    onSubmit: () => void;
}) {
    const { mutateAsync } = useUpdateOrganisation(organisation.id);
    const t = useTranslations('pages.console.organisation.settings.website');

    const Schema = z.object({
        website: z.union([z.literal(''), Organisation.shape.website]),
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful, isValid, isSubmitting },
        reset,
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(({ website }) =>
        promiseTimeout(
            mutateAsync({ website }).then(() => onSubmit()),
            250
        ).then(() => reset())
    );

    return (
        <form
            onSubmit={handler}
            className="flex w-full flex-col gap-6 rounded-lg border p-6"
        >
            <div className="space-y-2">
                <h2 className="text-xl font-bold">{t('title')}</h2>
                <p>{t('description')}</p>
            </div>
            <Input
                placeholder={t('placeholder')}
                defaultValue={organisation?.website}
                {...register('website')}
                className="max-w-sm"
            />
            <div className="flex items-center gap-4">
                <Button size="sm" disabled={!isValid || isSubmitting}>
                    {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t('submit')}
                </Button>
                {errors?.website && !isSubmitSuccessful && (
                    <p className="text-red-600">{errors.website.message}</p>
                )}
            </div>
        </form>
    );
}

function DescriptionEditor({
    organisation,
    onSubmit,
}: {
    organisation: Organisation;
    onSubmit: () => void;
}) {
    const { mutateAsync } = useUpdateOrganisation(organisation.id);
    const t = useTranslations(
        'pages.console.organisation.settings.description'
    );

    const Schema = Organisation.pick({
        description: true,
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful, isValid, isSubmitting },
        reset,
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(({ description }) =>
        promiseTimeout(
            mutateAsync({ description }).then(() => onSubmit()),
            250
        ).then(() => reset())
    );

    return (
        <form
            onSubmit={handler}
            className="flex w-full flex-col gap-6 rounded-lg border p-6"
        >
            <div className="space-y-2">
                <h2 className="text-xl font-bold">{t('title')}</h2>
                <p>{t('description')}</p>
            </div>
            <Textarea
                placeholder={t('placeholder')}
                defaultValue={organisation?.description}
                {...register('description')}
                className="max-w-sm"
                rows={8}
            />
            <div className="flex items-center gap-4">
                <Button size="sm" disabled={!isValid || isSubmitting}>
                    {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t('submit')}
                </Button>
                {errors?.description && !isSubmitSuccessful && (
                    <p className="text-red-600">{errors.description.message}</p>
                )}
            </div>
        </form>
    );
}

function DangerZone({ organisation }: { organisation: Organisation }) {
    const surreal = useSurreal();
    const router = useRouter();
    const t = useTranslations(
        'pages.console.organisation.settings.danger-zone'
    );

    const Schema = z.object({
        name: z.literal(organisation.name),
        email: z.literal(organisation.email),
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
        await surreal.query(/* surql */ `DELETE $id`, { id: organisation.id });
        router.push('/account/organisations');
    });

    return (
        <div className="flex w-full flex-col gap-6 rounded-lg border border-red-600 border-opacity-40 p-6">
            <div className="space-y-2">
                <h2 className="text-xl font-bold">{t('title')}</h2>
                <p>
                    {t.rich('description', {
                        b: (children) => <b>{children}</b>,
                    })}
                </p>
            </div>
            <div className="flex items-center gap-4">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="destructive"
                            className="opacity-70 transition-all hover:opacity-100"
                        >
                            <AlertOctagon className="mr-2 h-4 w-4" />
                            {t('dialog.trigger')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handler}>
                            <h2 className="mb-4 text-2xl font-bold">
                                {t.rich('dialog.title', {
                                    org: () => organisation.name,
                                })}
                            </h2>
                            <p>
                                {t.rich('dialog.description', {
                                    b: (children) => <b>{children}</b>,
                                    br: () => <br />,
                                })}
                            </p>

                            <div className="mb-5 mt-3 space-y-5">
                                <div className="space-y-3">
                                    <Label htmlFor="name_delete">
                                        <b>{t('dialog.repeat')}:</b>{' '}
                                        <i className="select-none">
                                            {organisation.name}
                                        </i>
                                    </Label>
                                    <Input
                                        id="name_delete"
                                        autoComplete="off"
                                        {...register('name')}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="email_delete">
                                        <b>{t('dialog.repeat')}:</b>{' '}
                                        <i className="select-none">
                                            {organisation.email}
                                        </i>
                                    </Label>
                                    <Input
                                        id="email_delete"
                                        autoComplete="off"
                                        {...register('email')}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <DialogClose asChild>
                                    <Button variant="outline" type="button">
                                        {t('dialog.cancel')}
                                    </Button>
                                </DialogClose>
                                <Button
                                    variant="destructive"
                                    disabled={!isValid}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <AlertOctagon className="mr-2 h-4 w-4" />
                                    )}
                                    {t('dialog.submit')}
                                </Button>
                            </div>
                            {errors?.root && (
                                <p className="text-red-600">
                                    {errors.root.message}
                                </p>
                            )}
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
