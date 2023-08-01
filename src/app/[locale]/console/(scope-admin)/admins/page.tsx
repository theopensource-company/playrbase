'use client';

import { Avatar } from '@/components/cards/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAdmins } from '@/lib/Queries/Admin';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { HelpCircle } from 'lucide-react';
import React from 'react';

dayjs.extend(duration);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export default function Account() {
    const { isLoading, data: admins } = useAdmins();

    return (
        <div className="flex flex-grow flex-col gap-12 pt-6">
            <h1 className="text-4xl font-bold">Admins</h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Created</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading
                        ? new Array(5).fill(0).map((_, i) => (
                              <TableRow key={i}>
                                  <TableCell>
                                      <Avatar size="small" loading />
                                  </TableCell>
                                  <TableCell>
                                      <Skeleton className="h-4 w-36" />
                                  </TableCell>
                                  <TableCell>
                                      <Skeleton className="h-4 w-32" />
                                  </TableCell>
                                  <TableCell>
                                      <div className="flex gap-3">
                                          <Skeleton className="h-4 w-8" />
                                          <Skeleton className="h-4 w-8" />
                                          <Skeleton className="h-4 w-14" />
                                      </div>
                                  </TableCell>
                              </TableRow>
                          ))
                        : admins?.map((admin) => {
                              console.log(admin);
                              return (
                                  <TableRow key={admin.id}>
                                      <TableCell>
                                          <Avatar
                                              size="small"
                                              profile={admin}
                                          />
                                      </TableCell>
                                      <TableCell>
                                          {admin.name ?? (
                                              <HelpCircle size={16} />
                                          )}
                                      </TableCell>
                                      <TableCell>
                                          {admin.email ?? (
                                              <HelpCircle size={16} />
                                          )}
                                      </TableCell>
                                      <TableCell>
                                          <TooltipProvider>
                                              <Tooltip>
                                                  <TooltipTrigger>
                                                      {dayjs
                                                          .duration(
                                                              dayjs(
                                                                  admin.created
                                                              ).diff()
                                                          )
                                                          .humanize(true)}
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                      <i>
                                                          {dayjs(
                                                              admin.created
                                                          ).format('LLLL')}
                                                      </i>
                                                  </TooltipContent>
                                              </Tooltip>
                                          </TooltipProvider>
                                      </TableCell>
                                  </TableRow>
                              );
                          })}
                </TableBody>
            </Table>
        </div>
    );
}
