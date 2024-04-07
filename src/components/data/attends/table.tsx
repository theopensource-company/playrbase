import { Avatar } from '@/components/cards/avatar';
import { Profile } from '@/components/cards/profile';
import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import { buttonVariants } from '@/components/ui/button';
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
import { RichAttends } from '@/schema/relations/attends';
import { ArrowRight, Check, FileSearch, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
    registrations,
    columns,
    caption,
}: {
    registrations: RichAttends[];
    columns?: AttendsTableColumns;
    caption?: ReactNode;
}) {
    const t = useTranslations('components.data.attends.table');
    const doRenderCol = (col: keyof AttendsTableColumns) =>
        columns?.[col] ?? true;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {doRenderCol('in') && (
                        <TableHead>{t('columns.registrant')}</TableHead>
                    )}
                    {doRenderCol('out') && (
                        <TableHead>{t('columns.event')}</TableHead>
                    )}
                    {doRenderCol('players') && (
                        <TableHead>{t('columns.players')}</TableHead>
                    )}
                    {doRenderCol('confirmed') && (
                        <TableHead>{t('columns.confirmed')}</TableHead>
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
                {registrations?.map((registration) => {
                    return (
                        <TableRow key={registration.id}>
                            {doRenderCol('in') && (
                                <TableCell>
                                    <Profile
                                        profile={registration.in}
                                        noSub
                                        clickable
                                        size="extra-tiny"
                                    />
                                </TableCell>
                            )}
                            {doRenderCol('out') && (
                                <TableCell>
                                    <Profile
                                        profile={registration.out}
                                        noSub
                                        clickable
                                        size="extra-tiny"
                                        renderBadge={false}
                                    />
                                </TableCell>
                            )}
                            {doRenderCol('players') && (
                                <TableCell>
                                    <div className="flex -space-x-2">
                                        {registration.players
                                            .slice(0, 5)
                                            .map((player) => (
                                                <Avatar
                                                    key={player.id}
                                                    profile={player}
                                                    size="extra-tiny"
                                                />
                                            ))}
                                    </div>
                                </TableCell>
                            )}
                            {doRenderCol('confirmed') && (
                                <TableCell>
                                    {registration.confirmed ? (
                                        <Check size={20} />
                                    ) : (
                                        <X size={20} />
                                    )}
                                </TableCell>
                            )}
                            {doRenderCol('created') && (
                                <TableCell>
                                    <DateTooltip date={registration.created} />
                                </TableCell>
                            )}
                            {doRenderCol('updated') && (
                                <TableCell>
                                    <DateTooltip date={registration.updated} />
                                </TableCell>
                            )}
                            {doRenderCol('actions') && (
                                <TableCell className="flex items-center justify-end gap-4">
                                    <Link
                                        href={`/e/${registration.out.id.slice(
                                            6
                                        )}/registration/${registration.id.slice(
                                            8
                                        )}`}
                                        className={buttonVariants({
                                            size: 'sm',
                                        })}
                                    >
                                        View registration
                                        <ArrowRight
                                            size={18}
                                            className="ml-2"
                                        />
                                    </Link>
                                    {/* <DropdownMenu>
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
            {registrations?.length == 0 ? (
                <TableCaption className="my-12">
                    <div className="flex items-center justify-center gap-1">
                        <FileSearch className="h-4 w-4" />
                        {t('empty')}
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
