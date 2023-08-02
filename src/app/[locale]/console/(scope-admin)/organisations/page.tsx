'use client';

import { Avatar } from '@/components/cards/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
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
import { useOrganisations } from '@/lib/Queries/Organisation';
import { Organisation } from '@/schema/organisation';
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
    const { isLoading, data: organisations } = useOrganisations();

    return (
        <div className="flex flex-grow flex-col gap-12 pt-6">
            <h1 className="text-4xl font-bold">Organisations</h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Website</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
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
                                      <Skeleton className="h-4 w-32" />
                                  </TableCell>
                                  <TableCell>
                                      <Skeleton className="h-4 w-24" />
                                  </TableCell>
                                  <TableCell>
                                      <div className="flex gap-3">
                                          <Skeleton className="h-4 w-8" />
                                          <Skeleton className="h-4 w-8" />
                                          <Skeleton className="h-4 w-14" />
                                      </div>
                                  </TableCell>
                                  <TableCell>
                                      <Skeleton className="h-10 w-24" />
                                  </TableCell>
                              </TableRow>
                          ))
                        : organisations?.map((org) => (
                              <TableRow key={org.id}>
                                  <TableCell>
                                      <Avatar size="small" profile={org} />
                                  </TableCell>
                                  <TableCell>{org.name}</TableCell>
                                  <TableCell>{org.email}</TableCell>
                                  <TableCell>
                                      {org.website ?? <HelpCircle size={16} />}
                                  </TableCell>
                                  <TableCell className="capitalize">
                                      {org.tier}
                                  </TableCell>
                                  <TableCell>
                                      <TooltipProvider>
                                          <Tooltip>
                                              <TooltipTrigger>
                                                  {dayjs
                                                      .duration(
                                                          dayjs(
                                                              org.created
                                                          ).diff()
                                                      )
                                                      .humanize(true)}
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                  <i>
                                                      {dayjs(
                                                          org.created
                                                      ).format('LLLL')}
                                                  </i>
                                              </TooltipContent>
                                          </Tooltip>
                                      </TooltipProvider>
                                  </TableCell>
                                  <TableCell>
                                      <OrganisationManager organisation={org} />
                                  </TableCell>
                              </TableRow>
                          ))}
                </TableBody>
            </Table>
        </div>
    );
}

export function OrganisationManager({
    organisation,
}: {
    organisation: Organisation;
}) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button>Manage</Button>
            </SheetTrigger>
            <SheetContent className="w-screen sm:w-2/3 sm:max-w-full">
                <SheetHeader>
                    <SheetTitle>{organisation.name}</SheetTitle>
                    <SheetDescription>
                        <span className="capitalize">{organisation.tier}</span>{' '}
                        tier - {organisation.email}
                    </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            defaultValue={organisation.name}
                            placeholder="Name"
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            defaultValue={organisation.email}
                            placeholder="Email"
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                    </div>
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button type="submit">Save changes</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
