'use client';

import { Button } from '@/components/ui/button';
import { useFeatureFlags } from '@/lib/featureFlags';
import {
    DialogClose,
    DialogContent,
    DialogTrigger,
} from '@radix-ui/react-dialog';
import { Wrench, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';
import { Dialog } from '../../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import Container from '../Container';
import Devtools_Emails from './emails';
import Devtools_Environment from './environment';
import Devtools_MigrateDatabase from './migrate-database';
import Devtools_Query from './query';

export function DevTools() {
    const t = useTranslations('components.devtools');
    const [featureFlags] = useFeatureFlags();

    return (
        <Dialog>
            <DialogTrigger className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 max-sm:bg-muted">
                <Wrench />
                <span className="ml-2 md:hidden">Devtools</span>
            </DialogTrigger>
            <DialogContent className="fixed left-0 top-0 h-screen w-full border-none bg-muted">
                {featureFlags.devToolsWarning && (
                    <div className="w-screen bg-red-stripes p-2 text-center text-xl font-bold drop-shadow-xl">
                        <span className="text-yellow-300 drop-shadow-2xl">
                            USE THIS TOOL WITH CAUTION. YOU CAN DAMAGE YOUR
                            ACCOUNT
                        </span>
                    </div>
                )}
                <Container className="h-full overflow-hidden p-12 pt-12">
                    <Tabs
                        defaultValue="environment"
                        className="h-full w-full pb-12"
                    >
                        <div className="mb-8 flex justify-between gap-10 overflow-x-auto rounded-md">
                            <TabsList className="bg-primary-foreground ">
                                <TabsTrigger
                                    className="data-[state=active]:bg-secondary-foreground data-[state=active]:text-primary-foreground"
                                    value="environment"
                                >
                                    {t('environment.title')}
                                </TabsTrigger>
                                <TabsTrigger
                                    className="data-[state=active]:bg-secondary-foreground data-[state=active]:text-primary-foreground"
                                    value="query"
                                >
                                    {t('query.title')}
                                </TabsTrigger>
                                <TabsTrigger
                                    className="data-[state=active]:bg-secondary-foreground data-[state=active]:text-primary-foreground"
                                    value="emails"
                                    disabled={!featureFlags.localEmail}
                                >
                                    Emails
                                </TabsTrigger>
                                <TabsTrigger
                                    className="data-[state=active]:bg-secondary-foreground data-[state=active]:text-primary-foreground"
                                    value="migrate-database"
                                    disabled={!featureFlags.migrateDatabase}
                                >
                                    {t('migrate-database.title')}
                                </TabsTrigger>
                            </TabsList>
                            <DialogClose aria-label="Close" asChild>
                                <Button size="sm" className="h-10">
                                    <X />
                                </Button>
                            </DialogClose>
                        </div>
                        <div className="h-full overflow-y-auto">
                            <TabsContent value="environment">
                                <Devtools_Environment />
                            </TabsContent>
                            <TabsContent value="query">
                                <Devtools_Query />
                            </TabsContent>
                            <TabsContent value="emails">
                                <Devtools_Emails />
                            </TabsContent>
                            <TabsContent value="migrate-database">
                                <Devtools_MigrateDatabase />
                            </TabsContent>
                        </div>
                    </Tabs>
                </Container>
            </DialogContent>
        </Dialog>
    );
}
