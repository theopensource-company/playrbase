'use client';

import { Avatar } from '@/components/cards/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
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
import {
    useOrganisations,
    useUpdateOrganisation,
} from '@/lib/Queries/Organisation';
import { Organisation } from '@/schema/organisation';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ArrowUpRightFromCircle, HelpCircle } from 'lucide-react';
import Link from 'next-intl/link';
import Image from 'next/image';
import React, { ReactNode } from 'react';
import { FieldError, useForm } from 'react-hook-form';
import { z } from 'zod';

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
                                      <div className="mt-1 flex flex-col gap-1">
                                          <Skeleton className="h-2.5 w-32" />
                                          <Skeleton className="h-1 w-28" />
                                      </div>
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
                                      {org.website ? (
                                          <Link
                                              href={org.website}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="flex items-center gap-1.5 underline-offset-2 hover:underline"
                                          >
                                              {org.website}
                                              <ArrowUpRightFromCircle
                                                  size={12}
                                              />
                                          </Link>
                                      ) : (
                                          <HelpCircle size={16} />
                                      )}
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
                                      <OrganisationEditor organisation={org} />
                                  </TableCell>
                              </TableRow>
                          ))}
                </TableBody>
            </Table>
        </div>
    );
}

export function OrganisationEditor({
    organisation,
}: {
    organisation: Organisation;
}) {
    const { mutateAsync: updateOrganisation, isLoading } =
        useUpdateOrganisation(organisation.id);

    const Schema = z.object({
        name: z.string().optional(),
        email: z
            .string()
            .email({ message: 'Enter a valid email address!' })
            .optional(),
        website: z
            .string()
            .url({ message: 'Enter a valid website address!' })
            .optional(),
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof Schema>>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(async (changes) => {
        const result = await updateOrganisation(changes);
        console.log(result);
    });

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button>Manage</Button>
            </SheetTrigger>
            <SheetContent className="w-screen sm:w-2/3 sm:max-w-[1200px]">
                <SheetHeader>
                    <div className="relative aspect-video max-h-[200px] rounded-lg bg-secondary">
                        {organisation.banner && (
                            <Image
                                src={organisation.banner}
                                alt={`${organisation.name}'s banner`}
                            />
                        )}
                        <div className="absolute left-0 top-0 flex h-full w-full items-center gap-6 px-12 lg:gap-8 lg:px-20">
                            <Avatar
                                profile={organisation}
                                size="huge"
                                className="bg-primary text-primary-foreground"
                            />
                            <div className="flex flex-col gap-1">
                                <SheetTitle className="text-2xl font-bold">
                                    {organisation.name}
                                </SheetTitle>
                                <SheetDescription>
                                    <span className="capitalize">
                                        {organisation.tier}
                                    </span>{' '}
                                    tier - {organisation.email}
                                </SheetDescription>
                            </div>
                        </div>
                    </div>
                </SheetHeader>
                <div className="grid gap-8 xl:grid-cols-5">
                    <form className="col-span-3" onSubmit={handler}>
                        <table className="border-separate border-spacing-x-4 border-spacing-y-3">
                            <tbody>
                                <EditorRow label="Name" htmlFor="name">
                                    <Input
                                        id="name"
                                        defaultValue={organisation.name}
                                        placeholder="Name"
                                        disabled={isLoading}
                                        {...register('name')}
                                    />
                                    <EditorError error={errors.name} />
                                </EditorRow>

                                <EditorRow label="Email" htmlFor="email">
                                    <Input
                                        id="email"
                                        defaultValue={organisation.email}
                                        placeholder="Email"
                                        disabled={isLoading}
                                        {...register('email')}
                                    />
                                    <EditorError error={errors.email} />
                                </EditorRow>

                                <EditorRow label="Website" htmlFor="website">
                                    <Input
                                        id="website"
                                        defaultValue={organisation.website}
                                        placeholder="Website"
                                        disabled={isLoading}
                                        {...register('website')}
                                    />
                                    <EditorError error={errors.website} />
                                </EditorRow>
                                <tr>
                                    <td />
                                    <td className="flex w-full justify-end">
                                        <div className="">
                                            <Button
                                                type="submit"
                                                disabled={isLoading}
                                            >
                                                Update
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </form>
                    <div className="p-3">logs here...</div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function EditorRow({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: ReactNode;
}) {
    return (
        <tr>
            <td className="align-baseline">
                <div className="flex h-10 items-center">
                    <Label htmlFor={htmlFor} className="text-right">
                        {label}
                    </Label>
                </div>
            </td>
            <td className="w-full">{children}</td>
        </tr>
    );
}

function EditorError({ error }: { error?: FieldError }) {
    return error && <p className="mt-2 text-red-500">{error?.message}</p>;
}
