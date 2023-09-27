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
import { useAdmins, useUpdateAdmin } from '@/lib/Queries/Admin';
import { fullname } from '@/lib/zod';
import { Admin } from '@/schema/resources/admin';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { HelpCircle } from 'lucide-react';
import React, { ReactNode } from 'react';
import { FieldError, useForm } from 'react-hook-form';
import { z } from 'zod';

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
                                      <TableCell>
                                          <AdminEditor admin={admin} />
                                      </TableCell>
                                  </TableRow>
                              );
                          })}
                </TableBody>
            </Table>
        </div>
    );
}

export function AdminEditor({ admin }: { admin: Admin }) {
    const { mutateAsync: updateAdmin, isLoading } = useUpdateAdmin(admin.id);

    const Schema = z.object({
        name: fullname().optional(),
        email: z
            .string()
            .email({ message: 'Enter a valid email address!' })
            .optional(),
        profile_picture: z
            .string()
            .url('Must be a URL to a profile picture')
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
        const result = await updateAdmin(changes);
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
                        <div className="absolute left-0 top-0 flex h-full w-full items-center gap-6 px-12 lg:gap-8 lg:px-20">
                            <Avatar
                                profile={admin}
                                size="huge"
                                className="bg-primary text-primary-foreground"
                            />
                            <div className="flex flex-col gap-1">
                                <SheetTitle className="text-2xl font-bold">
                                    {admin.name}
                                </SheetTitle>
                                <SheetDescription>
                                    {admin.email}
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
                                        defaultValue={admin.name}
                                        placeholder="Name"
                                        disabled={isLoading}
                                        {...register('name')}
                                    />
                                    <EditorError error={errors.name} />
                                </EditorRow>

                                <EditorRow label="Email" htmlFor="email">
                                    <Input
                                        id="email"
                                        defaultValue={admin.email}
                                        placeholder="Email"
                                        disabled={isLoading}
                                        {...register('email')}
                                    />
                                    <EditorError error={errors.email} />
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
