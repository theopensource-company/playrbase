import {
    OrganisationSelector,
    useOrganisationSelector,
} from '@/components/logic/OrganisationSelector';
import { DD, DDContent, DDFooter, DDTrigger } from '@/components/ui-custom/dd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSurreal } from '@/lib/Surreal';
import { useRouter } from '@/locales/navigation';
import { Organisation } from '@/schema/resources/organisation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export function CreateOrganisation({
    refetch,
    defaultPartOf,
}: {
    refetch: () => unknown;
    defaultPartOf?: Organisation['id'];
}) {
    const surreal = useSurreal();
    const router = useRouter();
    const [partOf, setPartOf] = useOrganisationSelector(defaultPartOf);
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
            email = email.toLowerCase()
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
                                className="lowercase"
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
