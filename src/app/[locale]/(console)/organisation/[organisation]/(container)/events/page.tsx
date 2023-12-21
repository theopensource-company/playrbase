'use client';

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
import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useSurreal } from '@/lib/Surreal';
import { Link } from '@/locales/navigation';
import { Event } from '@/schema/resources/event';
import { Organisation } from '@/schema/resources/organisation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowRight,
    Check,
    Filter,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Wrench,
    X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { TinyOrgName } from '../../TinyOrgName';

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
            <div>
                <TinyOrgName name={organisation.name} />
                <div className="flex items-center justify-between gap-4">
                    <h1 className="pb-6 text-3xl font-semibold">
                        {t('title')}
                    </h1>
                    <CreateOrganisation
                        refetch={refetch}
                        organiser={organisation.id}
                    />
                </div>
            </div>
            <div className="flex justify-start gap-4 pb-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" /> Filters
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Filters</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuOptionalBoolean
                            value={rootForOrg}
                            onValueChange={setRootForOrg}
                            title="Hosted By"
                            options={{
                                undefined: 'Any organisation',
                                true: 'This organisation',
                                false: 'Other organisation',
                            }}
                        />
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuOptionalBoolean
                                value={published}
                                onValueChange={setPublished}
                                title="Published"
                                options={{
                                    undefined: 'No preference',
                                    true: 'Published',
                                    false: 'Not published',
                                }}
                            />
                            <DropdownMenuOptionalBoolean
                                value={discoverable}
                                onValueChange={setDiscoverable}
                                title="Discoverable"
                                options={{
                                    undefined: 'No preference',
                                    true: 'Discoverable',
                                    false: 'Not discoverable',
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Start</TableHead>
                            <TableHead>End</TableHead>
                            <TableHead>Published</TableHead>
                            <TableHead>Discoverable</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events?.map((event) => {
                            const url = (page: string) =>
                                `/organisation/${slug}/events/${event.id.slice(
                                    6
                                )}/${page}`;

                            return (
                                <TableRow key={event.id}>
                                    <TableCell>{event.name}</TableCell>
                                    <TableCell>{event.category}</TableCell>
                                    <TableCell>
                                        {event.start && (
                                            <DateTooltip date={event.start} />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {event.end && (
                                            <DateTooltip date={event.end} />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {event.published ? (
                                            <Check size={20} />
                                        ) : (
                                            <X size={20} />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {event.discoverable ? (
                                            <Check size={20} />
                                        ) : (
                                            <X size={20} />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DateTooltip date={event.created} />
                                    </TableCell>
                                    <TableCell className="flex items-center justify-end gap-4">
                                        <Link
                                            href={url('overview')}
                                            className={buttonVariants({
                                                size: 'sm',
                                            })}
                                        >
                                            Manage{' '}
                                            <ArrowRight
                                                size={18}
                                                className="ml-2"
                                            />
                                        </Link>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                >
                                                    <MoreHorizontal size={20} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-44">
                                                <DropdownMenuLabel>
                                                    More options
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <Link href={url('settings')}>
                                                    <DropdownMenuItem className="hover:cursor-pointer">
                                                        <Wrench
                                                            size={18}
                                                            className="mr-2 h-4 w-4"
                                                        />
                                                        Settings
                                                    </DropdownMenuItem>
                                                </Link>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end gap-10 pt-2">
                <Pagination pagination={pagination} count={count} />
            </div>
        </div>
    );
}

function CreateOrganisation({
    refetch,
    organiser,
}: {
    refetch: () => unknown;
    organiser: Organisation['id'];
}) {
    const surreal = useSurreal();
    const [tournament, setTournament] = useEventSelector();
    const [open, setOpen] = useState(false);
    const t = useTranslations('pages.console.account.organisations.new');

    const Schema = Event.pick({
        name: true,
        description: true,
        category: true,
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
            category: 'baseball',
            discoverable: true,
            published: false,
        },
    });

    const handler = handleSubmit(
        async ({ name, description, category, discoverable, published }) => {
            // TODO set to correct type, not important for the moment
            await surreal.query<[Event]>(
                /* surql */ `
                    CREATE ONLY event CONTENT {
                        name: $name,
                        description: $description,
                        category: $category,
                        discoverable: $discoverable,
                        published: $published,
                        tournament: $tournament,
                        organiser: $organiser,
                    };
                `,
                {
                    name,
                    description,
                    category,
                    discoverable,
                    published,
                    tournament,
                    organiser,
                }
            );

            refetch();
            setTournament(undefined);
            setOpen(false);
        }
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    {t('trigger')}
                    <Plus className="ml-2 h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <form onSubmit={handler}>
                    <h3 className="mb-4 text-2xl font-bold">{t('title')}</h3>
                    <div className="mb-8 mt-6 grid gap-16 sm:grid-cols-2">
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
                            {tournament ? (
                                <p>from tournament</p>
                            ) : (
                                <div className="space-y-3">
                                    <Label htmlFor="category">Category</Label>
                                    <Select>
                                        <SelectTrigger
                                            id="category"
                                            {...register('category')}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="baseball">
                                                Baseball
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors?.description &&
                                        !isSubmitSuccessful && (
                                            <p className="text-red-600">
                                                {errors.description.message}
                                            </p>
                                        )}
                                </div>
                            )}
                            <div className="space-y-3">
                                <Label htmlFor="email">Description</Label>
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
                                        Discoverable
                                    </Label>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Checkbox
                                        id="published"
                                        {...register('published')}
                                    />
                                    <Label htmlFor="published">Published</Label>
                                </div>
                            </div>
                        </div>
                        <EventSelector
                            event={tournament}
                            setEvent={setTournament}
                            label="Part of tournament"
                            placeholder="Tournament name"
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
