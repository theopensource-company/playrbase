import { Avatar } from '@/components/cards/avatar';
import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { doRenderColFactory } from '@/lib/table';
import { Link } from '@/locales/navigation';
import {
    Organisation,
    OrganisationSafeParse,
} from '@/schema/resources/organisation';
import {
    ArrowRight,
    Check,
    FileSearch,
    MoreHorizontal,
    Wrench,
    X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { ReactNode } from 'react';

export type OrganisationTableColumns = {
    avatar?: boolean;
    name?: boolean;
    email?: boolean;
    created?: boolean;
    updated?: boolean;
    actions?: boolean;
};

export function OrganisationTable({
    organisations,
    unconfirmed,
    columns,
    caption,
    acceptInvitation,
    denyInvitation,
    isLoading,
}: {
    organisations: Organisation[] | Record<string, Organisation>;
    unconfirmed?:
        | OrganisationSafeParse[]
        | Record<string, OrganisationSafeParse>;
    columns?: OrganisationTableColumns;
    caption?: ReactNode;
    acceptInvitation?: (id: Organisation['id']) => Promise<unknown>;
    denyInvitation?: (id: Organisation['id']) => Promise<unknown>;
    isLoading?: boolean;
}) {
    const t = useTranslations('components.data.organisations.table');
    const doRenderCol = doRenderColFactory(columns);

    const unconfirmedMappable = Array.isArray(unconfirmed)
        ? unconfirmed.map((a) => [a.id, a] as const)
        : Object.entries(unconfirmed ?? {});
    const organisationsMappable = Array.isArray(organisations)
        ? organisations.map((a) => [a.id, a] as const)
        : Object.entries(organisations ?? {});
    const count = unconfirmedMappable.length + organisationsMappable.length;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {doRenderCol('avatar') && count > 0 && <TableHead />}
                    {doRenderCol('name') && (
                        <TableHead>{t('columns.name')}</TableHead>
                    )}
                    {doRenderCol('email') && (
                        <TableHead>{t('columns.email')}</TableHead>
                    )}
                    {doRenderCol('created') && (
                        <TableHead>{t('columns.created')}</TableHead>
                    )}
                    {doRenderCol('updated') && (
                        <TableHead>{t('columns.updated')}</TableHead>
                    )}
                    {doRenderCol('actions') && count > 0 && <TableHead />}
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <>
                        <RenderLoading columns={columns} />
                        <RenderLoading columns={columns} />
                        <RenderLoading columns={columns} />
                    </>
                ) : (
                    <>
                        {unconfirmedMappable?.map(([key, organisation]) => (
                            <RenderUnconfirmed
                                key={key}
                                columns={columns}
                                organisation={organisation}
                                acceptInvitation={acceptInvitation}
                                denyInvitation={denyInvitation}
                            />
                        ))}
                        {organisationsMappable?.map(([key, organisation]) => (
                            <RenderConfirmed
                                key={key}
                                columns={columns}
                                organisation={organisation}
                            />
                        ))}
                    </>
                )}
            </TableBody>
            {count == 0 ? (
                <TableCaption className="my-12">
                    <div className="flex items-center justify-center gap-1">
                        <FileSearch className="h-4 w-4" /> {t('empty')}
                    </div>
                </TableCaption>
            ) : (
                caption && (
                    <TableCaption className="mb-4">{caption}</TableCaption>
                )
            )}
        </Table>
    );
}

function RenderLoading({ columns }: { columns?: OrganisationTableColumns }) {
    const doRenderCol = doRenderColFactory(columns);

    return (
        <TableRow>
            {doRenderCol('avatar') && (
                <TableCell>
                    <Skeleton className="h-10 w-10 rounded-full" />
                </TableCell>
            )}
            {doRenderCol('name') && (
                <TableCell>
                    <Skeleton className="h-5 w-24 rounded-full" />
                </TableCell>
            )}
            {doRenderCol('email') && (
                <TableCell>
                    <Skeleton className="h-5 w-32 rounded-full" />
                </TableCell>
            )}
            {doRenderCol('created') && (
                <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
            )}
            {doRenderCol('updated') && (
                <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
            )}
            {doRenderCol('actions') && (
                <TableCell className="flex items-center justify-end gap-4">
                    <Skeleton className="h-8 w-24 rounded" />
                    <Skeleton className="h-8 w-10 rounded" />
                </TableCell>
            )}
        </TableRow>
    );
}

function RenderConfirmed({
    organisation,
    columns,
}: {
    columns?: OrganisationTableColumns;
    organisation: Organisation;
}) {
    const t = useTranslations('components.data.organisations.table.confirmed');
    const doRenderCol = doRenderColFactory(columns);
    const url = (page: string) => `/organisation/${organisation.slug}/${page}`;

    return (
        <TableRow>
            {doRenderCol('avatar') && (
                <TableCell>
                    <Avatar profile={organisation} size="small" />
                </TableCell>
            )}
            {doRenderCol('name') && <TableCell>{organisation.name}</TableCell>}
            {doRenderCol('email') && (
                <TableCell>{organisation.email}</TableCell>
            )}
            {doRenderCol('created') && (
                <TableCell>
                    <DateTooltip date={organisation.created} />
                </TableCell>
            )}
            {doRenderCol('updated') && (
                <TableCell>
                    <DateTooltip date={organisation.updated} />
                </TableCell>
            )}
            {doRenderCol('actions') && (
                <TableCell className="flex items-center justify-end gap-4">
                    <Link
                        href={url('overview')}
                        className={buttonVariants({
                            size: 'sm',
                        })}
                    >
                        {t('actions.manage')}{' '}
                        <ArrowRight size={18} className="ml-2" />
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                                <MoreHorizontal size={20} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-44">
                            <DropdownMenuLabel>
                                {t('actions.more-options.label')}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link href={url('settings')}>
                                <DropdownMenuItem className="hover:cursor-pointer">
                                    <Wrench
                                        size={18}
                                        className="mr-2 h-4 w-4"
                                    />
                                    {t('actions.more-options.settings')}
                                </DropdownMenuItem>
                            </Link>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            )}
        </TableRow>
    );
}

function RenderUnconfirmed({
    organisation,
    columns,
    acceptInvitation,
    denyInvitation,
}: {
    columns?: OrganisationTableColumns;
    organisation: OrganisationSafeParse;
    acceptInvitation?: (id: Organisation['id']) => Promise<unknown>;
    denyInvitation?: (id: Organisation['id']) => Promise<unknown>;
}) {
    const t = useTranslations(
        'components.data.organisations.table.unconfirmed'
    );
    const doRenderCol = doRenderColFactory(columns);

    return (
        <TableRow>
            {doRenderCol('avatar') && (
                <TableCell>
                    <Avatar profile={organisation} />
                </TableCell>
            )}
            {doRenderCol('name') && <TableCell>{organisation.name}</TableCell>}
            {doRenderCol('email') && (
                <TableCell>{organisation.email}</TableCell>
            )}
            {doRenderCol('created') && (
                <TableCell>
                    <DateTooltip date={organisation.created} />
                </TableCell>
            )}
            {doRenderCol('updated') && <TableCell />}
            {doRenderCol('actions') && (
                <TableCell className="flex items-center justify-end gap-4">
                    {acceptInvitation && (
                        <Button
                            onClick={() => acceptInvitation(organisation.id)}
                            size="sm"
                        >
                            {t('actions.accept')}
                            <Check size={18} className="ml-2" />
                        </Button>
                    )}
                    {denyInvitation && (
                        <Button
                            onClick={() => denyInvitation(organisation.id)}
                            size={acceptInvitation ? 'sm' : 'icon'}
                            variant="destructive"
                        >
                            {!acceptInvitation && t('actions.deny')}
                            <X
                                size={18}
                                className={!acceptInvitation ? 'ml-2' : ''}
                            />
                        </Button>
                    )}
                    {!acceptInvitation && !denyInvitation && (
                        <Badge>{t('actions.badge-no-actions')}</Badge>
                    )}
                </TableCell>
            )}
        </TableRow>
    );
}
