'use client';

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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Email } from '@/schema/miscellaneous/email';
import { TooltipProvider } from '@radix-ui/react-tooltip';
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
    const { data, isLoading } = useQuery({
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
                    {isLoading
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
                                          <TooltipProvider>
                                              <Tooltip>
                                                  <TooltipTrigger>
                                                      {dayjs
                                                          .duration(
                                                              dayjs(sent).diff()
                                                          )
                                                          .humanize(true)}
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                      <i>
                                                          {dayjs(sent).format(
                                                              'LLLL'
                                                          )}
                                                      </i>
                                                  </TooltipContent>
                                              </Tooltip>
                                          </TooltipProvider>
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
                              )
                          )}
                </TableBody>
            </Table>
        </div>
    );
}
