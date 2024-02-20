import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Link } from '@/locales/navigation';
import { Event } from '@/schema/resources/event';
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

export type EventTableColumns = {
    name?: boolean;
    start?: boolean;
    end?: boolean;
    published?: boolean;
    discoverable?: boolean;
    created?: boolean;
    updated?: boolean;
    actions?: boolean;
};

export function EventTable({
    events,
    columns,
    caption,
}: {
    events: Event[];
    columns?: EventTableColumns;
    caption?: ReactNode;
}) {
    const t = useTranslations('components.data.events.table');
    const doRenderCol = (col: keyof EventTableColumns) =>
        columns?.[col] ?? true;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {doRenderCol('name') && (
                        <TableHead>{t('columns.name')}</TableHead>
                    )}
                    {doRenderCol('start') && (
                        <TableHead>{t('columns.start')}</TableHead>
                    )}
                    {doRenderCol('end') && (
                        <TableHead>{t('columns.end')}</TableHead>
                    )}
                    {doRenderCol('published') && (
                        <TableHead>{t('columns.published')}</TableHead>
                    )}
                    {doRenderCol('discoverable') && (
                        <TableHead>{t('columns.discoverable')}</TableHead>
                    )}
                    {doRenderCol('created') && (
                        <TableHead>{t('columns.created')}</TableHead>
                    )}
                    {doRenderCol('updated') && (
                        <TableHead>{t('columns.updated')}</TableHead>
                    )}
                    {doRenderCol('actions') && <TableHead />}
                </TableRow>
            </TableHeader>
            <TableBody>
                {events?.map((event) => {
                    const url = (page: string) =>
                        `/e/${event.id.slice(6)}/manage/${page}`;

                    return (
                        <TableRow key={event.id}>
                            {doRenderCol('name') && (
                                <TableCell>{event.name}</TableCell>
                            )}
                            {doRenderCol('start') && (
                                <TableCell>
                                    {event.start && (
                                        <DateTooltip date={event.start} />
                                    )}
                                </TableCell>
                            )}
                            {doRenderCol('end') && (
                                <TableCell>
                                    {event.end && (
                                        <DateTooltip date={event.end} />
                                    )}
                                </TableCell>
                            )}
                            {doRenderCol('published') && (
                                <TableCell>
                                    {event.published ? (
                                        <Check size={20} />
                                    ) : (
                                        <X size={20} />
                                    )}
                                </TableCell>
                            )}
                            {doRenderCol('discoverable') && (
                                <TableCell>
                                    {event.discoverable ? (
                                        <Check size={20} />
                                    ) : (
                                        <X size={20} />
                                    )}
                                </TableCell>
                            )}
                            {doRenderCol('created') && (
                                <TableCell>
                                    <DateTooltip date={event.created} />
                                </TableCell>
                            )}
                            {doRenderCol('updated') && (
                                <TableCell>
                                    {event.updated && (
                                        <DateTooltip date={event.updated} />
                                    )}
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
                                        {t('row.actions.manage')}
                                        <ArrowRight
                                            size={18}
                                            className="ml-2"
                                        />
                                    </Link>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost">
                                                <MoreHorizontal size={20} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-44">
                                            <DropdownMenuLabel>
                                                {t(
                                                    'row.actions.more-options.label'
                                                )}
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <Link href={url('settings')}>
                                                <DropdownMenuItem className="hover:cursor-pointer">
                                                    <Wrench
                                                        size={18}
                                                        className="mr-2 h-4 w-4"
                                                    />
                                                    {t(
                                                        'row.actions.more-options.settings'
                                                    )}
                                                </DropdownMenuItem>
                                            </Link>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            )}
                        </TableRow>
                    );
                })}
            </TableBody>
            {events?.length == 0 ? (
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
