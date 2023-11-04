'use client';

import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Email } from '@/schema/miscellaneous/email';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslations } from 'next-intl';
import React from 'react';

dayjs.extend(duration);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export default function Devtools_Emails() {
    const { data, isPending } = useQuery({
        queryKey: ['devkit', '/email/list'],
        queryFn: async () => {
            const raw = await fetch('/api/devkit/email/list');
            return (await raw.json()) as {
                success: true;
                emails: Record<string, Email & { sent: Date }>;
            };
        },
    });
    const t = useTranslations('components.devtools.emails');

    const emails = Object.entries(data?.emails ?? {})
        .map(([key, { sent, ...rest }]) => ({
            key,
            sent: new Date(sent),
            ...rest,
        }))
        .sort((a, b) => b.sent.getTime() - a.sent.getTime());

    return (
        <div className="flex flex-col gap-8">
            <h1 className="items-center text-4xl font-bold">{t('title')}</h1>
            <Table>
                <TableCaption>
                    <b>{t('table.emails.caption.total')}:</b> {emails.length}
                </TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('table.emails.column.sent')}</TableHead>
                        <TableHead>
                            {t('table.emails.column.subject')}
                        </TableHead>
                        <TableHead>
                            {t('table.emails.column.recipient')}
                        </TableHead>
                        <TableHead>
                            {t('table.emails.column.actions')}
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isPending
                        ? new Array(5).fill(0).map((_, i) => (
                              <TableRow key={i}>
                                  <TableCell>
                                      <div className="flex gap-3">
                                          <Skeleton className="h-4 w-8 bg-muted-foreground" />
                                          <Skeleton className="h-4 w-8 bg-muted-foreground" />
                                          <Skeleton className="h-4 w-14 bg-muted-foreground" />
                                      </div>
                                  </TableCell>
                                  <TableCell>
                                      <Skeleton className="h-4 w-36 bg-muted-foreground" />
                                  </TableCell>
                                  <TableCell>
                                      <Skeleton className="h-4 w-32 bg-muted-foreground" />
                                  </TableCell>
                                  <TableCell>
                                      <Skeleton className="h-10 w-24 bg-muted-foreground" />
                                  </TableCell>
                              </TableRow>
                          ))
                        : emails.map(
                              ({ key, sent, subject, to, html, text }) => (
                                  <TableRow key={key}>
                                      <TableCell>
                                          <DateTooltip date={sent} />
                                      </TableCell>
                                      <TableCell>{subject}</TableCell>
                                      <TableCell>{to}</TableCell>
                                      <TableCell>
                                          <Dialog>
                                              <DialogTrigger asChild>
                                                  <Button>
                                                      {t(
                                                          'table.emails.actions.view'
                                                      )}
                                                  </Button>
                                              </DialogTrigger>
                                              <DialogContent
                                                  className="h-[900px] max-h-[90%]"
                                                  style={{
                                                      maxWidth: '90%',
                                                      width: '900px',
                                                  }}
                                              >
                                                  <div className="flex flex-grow flex-col gap-8 px-2 pt-2">
                                                      <div className="space-y-2">
                                                          <h3 className="text-3xl font-bold">
                                                              {subject}
                                                          </h3>
                                                          <p className="space-x-2 text-sm text-muted-foreground">
                                                              <DateTooltip
                                                                  date={sent}
                                                              />
                                                              <span>-</span>
                                                              <span>{to}</span>
                                                          </p>
                                                      </div>
                                                      <Tabs
                                                          defaultValue="html"
                                                          className="flex w-full flex-grow flex-col"
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
                                                                  className="h-full w-full rounded border"
                                                              />
                                                          </TabsContent>
                                                          <TabsContent
                                                              value="text"
                                                              className="h-full w-full"
                                                          >
                                                              <div className="h-full w-full whitespace-pre-line break-all rounded border bg-email p-8 text-white/80">
                                                                  {text}
                                                              </div>
                                                          </TabsContent>
                                                      </Tabs>
                                                  </div>
                                              </DialogContent>
                                          </Dialog>
                                      </TableCell>
                                  </TableRow>
                              )
                          )}
                </TableBody>
            </Table>
        </div>
    );
}
