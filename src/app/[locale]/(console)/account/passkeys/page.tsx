'use client';

import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { surreal } from '@/lib/Surreal';
import { Credential } from '@/schema/resources/credential';
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogClose } from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { AlertOctagon, Loader2, Pencil, Plus, Trash } from 'lucide-react';
import Link from 'next-intl/link';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export default function Account() {
    const { data: credentials, isLoading, refetch } = useData();

    return (
        <div className="flex flex-grow flex-col gap-12 pt-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Passkeys</h1>
                <Link
                    href="/account/create-passkey"
                    className={buttonVariants()}
                >
                    Create passkey
                    <Plus className="ml-2 h-6 w-6" />
                </Link>
            </div>
            {credentials && credentials.length == 0 ? (
                <p className="opacity-50">
                    There are no Passkeys linked to your account. Create one by
                    pressing the button above!
                </p>
            ) : (
                <Table>
                    {credentials && (
                        <TableCaption>
                            <b>Count:</b> {credentials.length}
                        </TableCaption>
                    )}
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading &&
                            new Array(3).fill(0).map((_, id) => (
                                <TableRow key={id}>
                                    <TableCell>
                                        <Skeleton className="h-4 w-36" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell className="flex justify-end gap-4">
                                        <Skeleton className="h-8 w-10" />
                                        <Skeleton className="h-8 w-10" />
                                    </TableCell>
                                </TableRow>
                            ))}

                        {credentials?.map((credential) => (
                            <RenderCredential
                                credential={credential}
                                refetch={refetch}
                                key={credential.id}
                            />
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}

function RenderCredential({
    credential,
    refetch,
}: {
    credential: Credential;
    refetch: () => unknown;
}) {
    return (
        <TableRow>
            <TableCell>{credential.name}</TableCell>
            <TableCell>
                <DateTooltip date={credential.created} />
            </TableCell>
            <TableCell>
                <DateTooltip date={credential.created} />
            </TableCell>
            <TableCell className="flex justify-end gap-4">
                <EditCredential credential={credential} refetch={refetch} />
                <DeleteCredential credential={credential} refetch={refetch} />
            </TableCell>
        </TableRow>
    );
}

function EditCredential({
    credential,
    refetch,
}: {
    credential: Credential;
    refetch: () => unknown;
}) {
    const [open, setOpen] = useState(false);
    const Schema = Credential.pick({
        name: true,
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful, isValid, isSubmitting },
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(async ({ name }) => {
        await surreal.merge(credential.id, { name });
        refetch();
        setOpen(false);
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handler}>
                    <CardHeader>
                        <CardTitle>Edit Passkey</CardTitle>
                        <CardDescription>
                            Change the name of your passkey
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Label htmlFor="name">Passkey Name</Label>
                        <Input
                            id="name"
                            placeholder={credential.name}
                            defaultValue={credential.name}
                            maxLength={Schema.shape.name.maxLength ?? undefined}
                            autoComplete="off"
                            {...register('name')}
                        />
                        {errors?.name && !isSubmitSuccessful && (
                            <p className="text-red-600">
                                {errors.name.message}
                            </p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button disabled={!isValid || isSubmitting}>
                            {isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save name
                        </Button>
                        {errors?.root && (
                            <p className="text-red-600">
                                {errors.root.message}
                            </p>
                        )}
                    </CardFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteCredential({
    credential,
    refetch,
}: {
    credential: Credential;
    refetch: () => unknown;
}) {
    const Schema = z.object({
        name: z.literal(credential.name),
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitting },
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(async () => {
        await surreal.query(/* surql */ `DELETE $id`, { id: credential.id });
        refetch();
    });

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="destructive">
                    <Trash className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handler}>
                    <CardHeader>
                        <CardTitle>Delete Passkey</CardTitle>
                        <CardDescription>
                            Deleting this passkey will <b>permanently</b>{' '}
                            disallow access to Playrbase via this Passkey.
                            <br />
                            <br />
                            To confirm the deletion, please re-type the
                            Passkey&apos;s name
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 pt-1">
                        <Label htmlFor="name_delete">
                            <b>Type:</b>{' '}
                            <i className="select-none">{credential.name}</i>
                        </Label>
                        <Input
                            id="name_delete"
                            autoComplete="off"
                            {...register('name')}
                        />
                    </CardContent>
                    <CardFooter>
                        <div className="flex items-center gap-4">
                            <DialogClose asChild>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button variant="destructive" disabled={!isValid}>
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <AlertOctagon className="mr-2 h-4 w-4" />
                                )}
                                Permanently delete
                            </Button>
                        </div>
                        {errors?.root && (
                            <p className="text-red-600">
                                {errors.root.message}
                            </p>
                        )}
                    </CardFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function useData() {
    return useQuery({
        queryKey: ['passkeys'],
        queryFn: async () => {
            const result = await surreal.query<[Credential[]]>(/* surql */ `
                SELECT * FROM credential WHERE user = $auth;        
            `);

            if (!result?.[0]?.result) return null;
            return result[0].result;
        },
    });
}
