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
import React, { ReactNode } from 'react';

export type EventTableColumns = {
    name?: boolean;
    start?: boolean;
    end?: boolean;
    published?: boolean;
    discoverable?: boolean;
    created?: boolean;
    actions?: boolean;
};

export function EventTable({
    organisation_slug,
    events,
    columns,
    caption,
}: {
    organisation_slug: string;
    events: Event[];
    columns?: EventTableColumns;
    caption?: ReactNode;
}) {
    const doRenderCol = (col: keyof EventTableColumns) =>
        columns?.[col] ?? true;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {doRenderCol('name') && <TableHead>Name</TableHead>}
                    {doRenderCol('start') && <TableHead>Start</TableHead>}
                    {doRenderCol('end') && <TableHead>End</TableHead>}
                    {doRenderCol('published') && (
                        <TableHead>Published</TableHead>
                    )}
                    {doRenderCol('discoverable') && (
                        <TableHead>Discoverable</TableHead>
                    )}
                    {doRenderCol('created') && <TableHead>Created</TableHead>}
                    {doRenderCol('actions') && <TableHead />}
                </TableRow>
            </TableHeader>
            <TableBody>
                {events?.map((event) => {
                    const url = (page: string) =>
                        `/organisation/${organisation_slug}/events/${event.id.slice(
                            6
                        )}/${page}`;

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
                            {doRenderCol('actions') && (
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
                                            <Button size="icon" variant="ghost">
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
                            )}
                        </TableRow>
                    );
                })}
            </TableBody>
            {events?.length == 0 ? (
                <TableCaption className="my-12">
                    <div className="flex items-center justify-center gap-1">
                        <FileSearch className="h-4 w-4" /> No events found
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
