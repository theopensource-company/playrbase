'use client';

import { EventTable } from '@/components/data/events/table';
import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import {
    DropdownMenuOptionalBoolean,
    useOptionalBoolean,
} from '@/components/logic/DropdownMenuOptionalBoolean';
import {
    EventSelector,
    useEventSelector,
} from '@/components/logic/EventSelector';
import { Pagination, usePagination } from '@/components/logic/Pagination';
import { DD, DDContent, DDFooter, DDTrigger } from '@/components/ui-custom/dd';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSurreal } from '@/lib/Surreal';
import { useRouter } from '@/locales/navigation';
import { Event } from '@/schema/resources/event';
import { Organisation } from '@/schema/resources/organisation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Filter, Plus, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { PageTitle } from '../../components/PageTitle';

export default function Account() {
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;

    const [rootForOrg, setRootForOrg] = useOptionalBoolean();
    const [published, setPublished] = useOptionalBoolean();
    const [discoverable, setDiscoverable] = useOptionalBoolean();
    const pagination = usePagination();

    const t = useTranslations('pages.console.organisation.events');
    const { isPending, data, refetch } = useData({
        slug,
        root_for_org: rootForOrg,
        published,
        discoverable,
        pagination,
    });

    if (isPending) return <LoaderOverlay />;
    if (!data?.organisation) return <NotFoundScreen text={t('not_found')} />;

    const { events, count, organisation } = data;

    return (
        <div className="flex flex-grow flex-col gap-6 pt-6">
            <PageTitle organisation={organisation} title={t('title')}>
                <CreateEvent refetch={refetch} organiser={organisation} />
            </PageTitle>
            <div className="flex justify-start gap-4 pb-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            {t('filters.trigger')}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>
                            {t('filters.menu-label')}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuOptionalBoolean
                            value={rootForOrg}
                            onValueChange={setRootForOrg}
                            title={t('filters.hosted-by.title')}
                            options={{
                                undefined: t(
                                    'filters.hosted-by.options.undefined'
                                ),
                                true: t('filters.hosted-by.options.true'),
                                false: t('filters.hosted-by.options.false'),
                            }}
                        />
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuOptionalBoolean
                                value={published}
                                onValueChange={setPublished}
                                title={t('filters.published.title')}
                                options={{
                                    undefined: t(
                                        'filters.published.options.undefined'
                                    ),
                                    true: t('filters.published.options.true'),
                                    false: t('filters.published.options.false'),
                                }}
                            />
                            <DropdownMenuOptionalBoolean
                                value={discoverable}
                                onValueChange={setDiscoverable}
                                title={t('filters.discoverable.title')}
                                options={{
                                    undefined: t(
                                        'filters.discoverable.options.undefined'
                                    ),
                                    true: t(
                                        'filters.discoverable.options.true'
                                    ),
                                    false: t(
                                        'filters.discoverable.options.false'
                                    ),
                                }}
                            />
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                    <RefreshCw size={20} />
                </Button>
            </div>
            <div className="rounded-md border">
                <EventTable organisation_slug={slug} events={events ?? []} />
            </div>
            <div className="flex items-center justify-end gap-10 pt-2">
                <Pagination pagination={pagination} count={count} />
            </div>
        </div>
    );
}

function CreateEvent({
    refetch,
    organiser,
}: {
    refetch: () => unknown;
    organiser: Organisation;
}) {
    const surreal = useSurreal();
    const router = useRouter();
    const [tournament, setTournament] = useEventSelector();
    const [open, setOpen] = useState(false);
    const t = useTranslations('pages.console.organisation.events.new');

    const Schema = Event.pick({
        name: true,
        description: true,
        discoverable: true,
        published: true,
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful, isValid },
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
        defaultValues: {
            discoverable: true,
            published: false,
        },
    });

    const handler = handleSubmit(
        async ({ name, description, discoverable, published }) => {
            const result = (async () => {
                const [event] = await surreal.query<[Event]>(
                    /* surql */ `
                        CREATE ONLY event CONTENT {
                            name: $name,
                            description: $description,
                            discoverable: $discoverable,
                            published: $published,
                            tournament: $tournament,
                            organiser: $organiser,
                        };
                    `,
                    {
                        name,
                        description,
                        discoverable,
                        published,
                        tournament,
                        organiser: organiser.id,
                    }
                );

                await refetch();
                setTournament(undefined);
                setOpen(false);

                return event;
            })();

            await toast.promise(result, {
                loading: t('toast.creating-event'),
                success: t('toast.created-event'),
                error: (e) =>
                    t('errors.failed-create-event', { error: e.message }),
                action: {
                    label: t('toast.buttons.view'),
                    onClick: () =>
                        result.then(({ id }) =>
                            router.push(
                                `/organisation/${
                                    organiser.slug
                                }/event/${id.slice(6)}`
                            )
                        ),
                },
            });
        }
    );

    return (
        <DD open={open} onOpenChange={setOpen}>
            <DDTrigger asChild>
                <Button>
                    {t('trigger')}
                    <Plus className="ml-2 h-6 w-6" />
                </Button>
            </DDTrigger>
            <DDContent className="max-w-2xl">
                <form onSubmit={handler}>
                    <h3 className="mb-4 text-2xl font-bold">{t('title')}</h3>
                    <div className="mb-3 mt-6 grid gap-12 sm:grid-cols-2 sm:gap-16">
                        <div className="space-y-6">
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
                                    {t('fields.description.label')}
                                </Label>
                                <Textarea
                                    id="email"
                                    {...register('description')}
                                    autoComplete="off"
                                    rows={4}
                                />
                                {errors?.description && !isSubmitSuccessful && (
                                    <p className="text-red-600">
                                        {errors.description.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-1">
                                    <Checkbox
                                        id="discoverable"
                                        {...register('discoverable')}
                                    />
                                    <Label htmlFor="discoverable">
                                        {t('fields.discoverable.label')}
                                    </Label>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Checkbox
                                        id="published"
                                        {...register('published')}
                                    />
                                    <Label htmlFor="published">
                                        {t('fields.published.label')}
                                    </Label>
                                </div>
                            </div>
                        </div>
                        <EventSelector
                            event={tournament}
                            setEvent={setTournament}
                            label={t('fields.tournament.label')}
                            placeholder={t('fields.tournament.placeholder')}
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

const OrgCanManage = Organisation.extend({
    can_manage: z.boolean(),
});

type OrgCanManage = z.infer<typeof OrgCanManage>;

function useData({
    slug,
    root_for_org,
    published,
    discoverable,
    pagination: { start, limit },
}: {
    slug: Organisation['slug'];
    root_for_org?: Event['root_for_org'];
    published?: boolean;
    discoverable?: boolean;
    pagination: {
        start: number;
        limit: number;
    };
}) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: [
            'organisation',
            'events',
            slug,
            { root_for_org, published, discoverable },
            { start, limit },
        ],
        retry: false,
        queryFn: async () => {
            const result = await surreal.query<
                [null[], Event[], { count: number }[], OrgCanManage]
            >(
                /* surql */ `
                    LET $org = 
                        SELECT
                            *,
                            $auth.id IN managers[?role IN ["owner", "administrator", "event_manager"]].user as can_manage
                        FROM ONLY organisation 
                            WHERE slug = $slug
                            LIMIT 1;

                    SELECT * FROM event 
                        WHERE organiser = $org.id
                            AND $root_for_org IN [root_for_org, NONE]
                            AND $published IN [published, NONE]
                            AND $discoverable IN [discoverable, NONE]
                        START $start
                        LIMIT $limit;

                    SELECT count() FROM event 
                        WHERE organiser = $org.id
                            AND $root_for_org IN [root_for_org, NONE]
                            AND $published IN [published, NONE]
                            AND $discoverable IN [discoverable, NONE]
                        GROUP ALL;

                    $org;
                `,
                {
                    slug,
                    root_for_org,
                    published,
                    discoverable,
                    start,
                    limit,
                }
            );

            if (!result?.[1] || !result?.[2] || !result?.[3]) return null;

            return {
                organisation: OrgCanManage.parse(result[3]),
                count: z.number().parse(result[2][0]?.count ?? 0),
                events: z.array(Event).parse(result[1]),
            };
        },
    });
}
