'use client';

import { Avatar } from '@/components/cards/avatar';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { EditorBox, refetchWrapper } from '@/components/logic/EditorBox';
import UploadImage from '@/components/logic/UploadImage';
import { DD, DDContent, DDFooter, DDTrigger } from '@/components/ui-custom/dd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTeam, useUpdateTeam } from '@/lib/Queries/Team';
import { useSurreal } from '@/lib/Surreal';
import { useRouter } from '@/locales/navigation';
import { Team } from '@/schema/resources/team';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertOctagon, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { PageTitle } from '../../components/PageTitle';

export default function Account() {
    const t = useTranslations('pages.console.team.settings');
    const params = useParams();
    const slug = Array.isArray(params.team) ? params.team[0] : params.team;
    const { isPending, data: team, refetch } = useTeam<Team>({ slug });
    const { mutateAsync } = useUpdateTeam(team?.id ?? 'team:');
    const mutate = refetchWrapper({ mutateAsync, refetch });

    return isPending ? (
        <LoaderOverlay />
    ) : team ? (
        <div className="flex max-w-2xl flex-grow flex-col gap-6 pt-6">
            <PageTitle team={team} title={t('title')} />
            <div className="flex w-full items-center justify-between gap-16 rounded-lg border p-6">
                <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">{t('logo.title')}</h2>
                        <p>{t('logo.description')}</p>
                    </div>
                    <UploadImage
                        intent="logo"
                        actor={team}
                        triggerRefresh={refetch}
                        title={t('logo.change')}
                        description={t('logo.description')}
                    />
                </div>
                <Avatar profile={team} renderBadge={false} size="huge" />
            </div>
            <EditorBox
                title={t('name.title')}
                description={t('name.description')}
                submit={t('name.submit')}
                defaultValue={team.name}
                mutate={mutate}
                Schema={Team.pick({ name: true })}
                field="name"
            />
            <EditorBox
                title={t('description.title')}
                description={t('description.description')}
                submit={t('description.submit')}
                defaultValue={team.description}
                mutate={mutate}
                Schema={Team.pick({ description: true })}
                field="description"
                fieldType="richtext"
            />
            <DangerZone team={team} />
        </div>
    ) : (
        <NotFoundScreen text={t('not_found')} />
    );
}

function DangerZone({ team }: { team: Team }) {
    const surreal = useSurreal();
    const router = useRouter();
    const t = useTranslations(
        'pages.console.organisation.settings.danger-zone'
    );

    const Schema = z.object({
        name: z.literal(team.name),
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
        await surreal.query(/* surql */ `DELETE $id`, { id: team.id });
        router.push('/account/teams');
    });

    return (
        <div className="flex w-full flex-col gap-6 rounded-lg border border-red-600 border-opacity-40 p-6">
            <div className="space-y-2">
                <h2 className="text-xl font-bold">{t('title')}</h2>
                <p>{t.rich('description')}</p>
            </div>
            <div className="flex items-center gap-4">
                <DD>
                    <DDTrigger asChild>
                        <Button
                            variant="destructive"
                            className="opacity-70 transition-all hover:opacity-100"
                        >
                            <AlertOctagon className="mr-2 h-4 w-4" />
                            {t('dialog.trigger')}
                        </Button>
                    </DDTrigger>
                    <DDContent>
                        <form onSubmit={handler}>
                            <h2 className="mb-4 text-2xl font-bold">
                                {t('dialog.title', {
                                    org: team.name,
                                })}
                            </h2>
                            <p>{t.rich('dialog.description')}</p>

                            <div className="mb-5 mt-3 space-y-5">
                                <div className="space-y-3">
                                    <Label htmlFor="name_delete">
                                        <b>{t('dialog.repeat')}:</b>{' '}
                                        <i className="select-none">
                                            {team.name}
                                        </i>
                                    </Label>
                                    <Input
                                        id="name_delete"
                                        autoFocus
                                        autoComplete="off"
                                        {...register('name')}
                                    />
                                </div>
                            </div>

                            <DDFooter>
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
                                {errors?.root && (
                                    <p className="text-red-600">
                                        {errors.root.message}
                                    </p>
                                )}
                            </DDFooter>
                        </form>
                    </DDContent>
                </DD>
            </div>
        </div>
    );
}
