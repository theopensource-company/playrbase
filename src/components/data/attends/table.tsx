import { Avatar } from '@/components/cards/avatar';
import { Profile } from '@/components/cards/profile';
import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { RichAttends } from '@/schema/relations/attends';
import { Check, FileSearch, X } from 'lucide-react';
import React, { ReactNode } from 'react';

export type AttendsTableColumns = {
    in?: boolean;
    out?: boolean;
    players?: boolean;
    confirmed?: boolean;
    created?: boolean;
    updated?: boolean;
    actions?: boolean;
};

export function AttendsTable({
    attendees,
    columns,
    caption,
}: {
    attendees: RichAttends[];
    columns?: AttendsTableColumns;
    caption?: ReactNode;
}) {
    const doRenderCol = (col: keyof AttendsTableColumns) =>
        columns?.[col] ?? true;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {doRenderCol('in') && <TableHead>Registrant</TableHead>}
                    {doRenderCol('out') && <TableHead>Event</TableHead>}
                    {doRenderCol('players') && <TableHead>Players</TableHead>}
                    {doRenderCol('confirmed') && (
                        <TableHead>Confirmed</TableHead>
                    )}
                    {doRenderCol('created') && <TableHead>Created</TableHead>}
                    {doRenderCol('updated') && <TableHead>Updated</TableHead>}
                    {doRenderCol('actions') && <TableHead />}
                </TableRow>
            </TableHeader>
            <TableBody>
                {attendees?.map((attends) => {
                    return (
                        <TableRow key={attends.id}>
                            {doRenderCol('in') && (
                                <TableCell>
                                    <Profile
                                        profile={attends.in}
                                        noSub
                                        clickable
                                        size="extra-tiny"
                                    />
                                </TableCell>
                            )}
                            {doRenderCol('out') && (
                                <TableCell>
                                    <Profile
                                        profile={attends.out}
                                        noSub
                                        clickable
                                        size="extra-tiny"
                                        renderBadge={false}
                                    />
                                </TableCell>
                            )}
                            {doRenderCol('players') && (
                                <TableCell className="flex -space-x-2">
                                    {attends.players
                                        .slice(0, 5)
                                        .map((player) => (
                                            <Avatar
                                                key={player.id}
                                                profile={player}
                                                size="extra-tiny"
                                            />
                                        ))}
                                </TableCell>
                            )}
                            {doRenderCol('confirmed') && (
                                <TableCell>
                                    {attends.confirmed ? (
                                        <Check size={20} />
                                    ) : (
                                        <X size={20} />
                                    )}
                                </TableCell>
                            )}
                            {doRenderCol('created') && (
                                <TableCell>
                                    <DateTooltip date={attends.created} />
                                </TableCell>
                            )}
                            {doRenderCol('updated') && (
                                <TableCell>
                                    <DateTooltip date={attends.updated} />
                                </TableCell>
                            )}
                            {doRenderCol('actions') && (
                                <TableCell className="flex items-center justify-end gap-4">
                                    {/* <Link
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
                                    </DropdownMenu> */}
                                </TableCell>
                            )}
                        </TableRow>
                    );
                })}
            </TableBody>
            {attendees?.length == 0 ? (
                <TableCaption className="my-12">
                    <div className="flex items-center justify-center gap-1">
                        <FileSearch className="h-4 w-4" /> No attendees
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
