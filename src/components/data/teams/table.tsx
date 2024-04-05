import { Avatar } from '@/components/cards/avatar';
import { CutTextTooltip } from '@/components/miscellaneous/CutTextTooltip';
import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import { useMarkdownInline } from '@/components/miscellaneous/Markdown';
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
import { Team, TeamAnonymous } from '@/schema/resources/team';
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

export type TeamTableColumns = {
    avatar?: boolean;
    name?: boolean;
    description?: boolean;
    created?: boolean;
    updated?: boolean;
    actions?: boolean;
};

export function TeamTable({
    teams,
    unconfirmed,
    columns,
    caption,
    acceptInvitation,
    denyInvitation,
    isLoading,
}: {
    teams: Team[] | Record<string, Team>;
    unconfirmed?: TeamAnonymous[] | Record<string, TeamAnonymous>;
    columns?: TeamTableColumns;
    caption?: ReactNode;
    acceptInvitation?: (id: Team['id']) => Promise<unknown>;
    denyInvitation?: (id: Team['id']) => Promise<unknown>;
    isLoading?: boolean;
}) {
    const t = useTranslations('components.data.teams.table');
    const doRenderCol = doRenderColFactory(columns);

    const unconfirmedMappable = Array.isArray(unconfirmed)
        ? unconfirmed.map((a) => [a.id, a] as const)
        : Object.entries(unconfirmed ?? {});
    const teamsMappable = Array.isArray(teams)
        ? teams.map((a) => [a.id, a] as const)
        : Object.entries(teams ?? {});
    const count = unconfirmedMappable.length + teamsMappable.length;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {doRenderCol('avatar') && count > 0 && <TableHead />}
                    {doRenderCol('name') && (
                        <TableHead>{t('columns.name')}</TableHead>
                    )}
                    {doRenderCol('description') && (
                        <TableHead>{t('columns.description')}</TableHead>
                    )}
                    {doRenderCol('created') && (
                        <TableHead>{t('columns.created')}</TableHead>
                    )}
                    {doRenderCol('updated') && (
                        <TableHead>{t('columns.created')}</TableHead>
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
                        {unconfirmedMappable?.map(([key, team]) => (
                            <RenderUnconfirmed
                                key={key}
                                columns={columns}
                                team={team}
                                acceptInvitation={acceptInvitation}
                                denyInvitation={denyInvitation}
                            />
                        ))}
                        {teamsMappable?.map(([key, team]) => (
                            <RenderConfirmed
                                key={key}
                                columns={columns}
                                team={team}
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

function RenderLoading({ columns }: { columns?: TeamTableColumns }) {
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
            {doRenderCol('description') && (
                <TableCell>
                    <Skeleton className="h-5 w-48 rounded-full" />
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

const Description = ({ children }: { children: string }) => {
    const text = useMarkdownInline(children);
    return <CutTextTooltip text={text} maxLength={40} />;
};

function RenderConfirmed({
    team,
    columns,
}: {
    columns?: TeamTableColumns;
    team: Team;
}) {
    const t = useTranslations('components.data.teams.table.confirmed');
    const doRenderCol = doRenderColFactory(columns);
    const url = (page: string) => `/team/${team.slug}/${page}`;

    return (
        <TableRow>
            {doRenderCol('avatar') && (
                <TableCell>
                    <Avatar profile={team} size="small" />
                </TableCell>
            )}
            {doRenderCol('name') && <TableCell>{team.name}</TableCell>}
            {doRenderCol('description') && (
                <TableCell>
                    <Description>{team.description ?? ''}</Description>
                </TableCell>
            )}
            {doRenderCol('created') && (
                <TableCell>
                    <DateTooltip date={team.created} />
                </TableCell>
            )}
            {doRenderCol('updated') && (
                <TableCell>
                    <DateTooltip date={team.updated} />
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
                        {t('actions.manage')}
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
    team,
    columns,
    acceptInvitation,
    denyInvitation,
}: {
    columns?: TeamTableColumns;
    team: TeamAnonymous;
    acceptInvitation?: (id: Team['id']) => Promise<unknown>;
    denyInvitation?: (id: Team['id']) => Promise<unknown>;
}) {
    const t = useTranslations('components.data.teams.table.unconfirmed');
    const doRenderCol = doRenderColFactory(columns);

    return (
        <TableRow>
            {doRenderCol('avatar') && (
                <TableCell>
                    <Avatar profile={team} />
                </TableCell>
            )}
            {doRenderCol('name') && <TableCell>{team.name}</TableCell>}
            {doRenderCol('description') && (
                <TableCell>
                    <Description>{team.description ?? ''}</Description>
                </TableCell>
            )}
            {doRenderCol('created') && (
                <TableCell>
                    <DateTooltip date={team.created} />
                </TableCell>
            )}
            {doRenderCol('updated') && <TableCell />}
            {doRenderCol('actions') && (
                <TableCell className="flex items-center justify-end gap-4">
                    {acceptInvitation && (
                        <Button
                            onClick={() => acceptInvitation(team.id)}
                            size="sm"
                        >
                            {t('actions.accept')}
                            <Check size={18} className="ml-2" />
                        </Button>
                    )}
                    {denyInvitation && (
                        <Button
                            onClick={() => denyInvitation(team.id)}
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
