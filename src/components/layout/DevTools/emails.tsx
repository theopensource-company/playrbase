'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Email } from '@/constants/Types/Email.types';
// import { useTranslations } from 'next-intl';
import React from 'react';
import useSWR from 'swr';

export default function Devtools_Emails() {
    const list = async () => {
        const raw = await fetch('/api/devkit/email/list');
        return (await raw.json()) as {
            success: true;
            emails: Record<string, Email & { sent: Date }>;
        };
    };
    const { data } = useSWR('devkit:/email/list', list);
    // const t = useTranslations('components.devtools.emails');

    const emails = Object.entries(data?.emails ?? {})
        .map(([key, { sent, ...rest }]) => ({
            key,
            sent: new Date(sent),
            ...rest,
        }))
        .sort((a, b) => b.sent.getTime() - a.sent.getTime());

    console.log(emails);

    return (
        <div className="flex flex-col gap-8">
            <h1 className="items-center text-4xl font-bold">Emails</h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Sent</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {emails.map(({ key, sent, subject, to, html, text }) => (
                        <TableRow key={key}>
                            <TableCell>{`${sent.toDateString()}, ${sent.toLocaleTimeString()}`}</TableCell>
                            <TableCell>{subject}</TableCell>
                            <TableCell>{to}</TableCell>
                            <TableCell>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button>View</Button>
                                    </DialogTrigger>
                                    <DialogContent
                                        className="h-[700px] max-h-[90%] w-[800px]"
                                        style={{ maxWidth: '90%' }}
                                    >
                                        <Tabs
                                            defaultValue="html"
                                            className="flex w-full flex-col"
                                        >
                                            <div>
                                                <TabsList className="mb-4">
                                                    <TabsTrigger value="html">
                                                        HTML
                                                    </TabsTrigger>
                                                    <TabsTrigger value="text">
                                                        Text
                                                    </TabsTrigger>
                                                </TabsList>
                                            </div>
                                            <TabsContent
                                                value="html"
                                                className="h-full w-full"
                                            >
                                                <iframe
                                                    srcDoc={html}
                                                    className="h-full w-full"
                                                />
                                            </TabsContent>
                                            <TabsContent
                                                value="text"
                                                className="h-full w-full"
                                            >
                                                <iframe
                                                    srcDoc={text}
                                                    className="h-full w-full"
                                                />
                                            </TabsContent>
                                        </Tabs>
                                    </DialogContent>
                                </Dialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
