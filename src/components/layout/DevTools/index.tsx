import { Button } from '@/components/ui/button';
import { featureFlags } from '@/config/Environment';
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
import Devtools_Environment from './environment';
import Devtools_MigrateDatabase from './migrate-database';
import Devtools_Query from './query';

export function DevTools() {
    const t = useTranslations('components.devtools');

    return (
        <Dialog>
            <DialogTrigger className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                <Wrench />
            </DialogTrigger>
            <DialogContent className="fixed left-0 top-0 h-screen w-screen border-none bg-primary-foreground">
                <div className="p-12">
                    <Tabs defaultValue="environment" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="environment">
                                {t('environment.title')}
                            </TabsTrigger>
                            <TabsTrigger value="query">
                                {t('query.title')}
                            </TabsTrigger>
                            <TabsTrigger
                                value="migrate-database"
                                disabled={!featureFlags.migrateDatabase}
                            >
                                {t('migrate-database.title')}
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="environment">
                            <Devtools_Environment />
                        </TabsContent>
                        <TabsContent value="query">
                            <Devtools_Query />
                        </TabsContent>
                        <TabsContent value="migrate-database">
                            <Devtools_MigrateDatabase />
                        </TabsContent>
                    </Tabs>
                </div>
                <DialogClose
                    aria-label="Close"
                    className="fixed right-0 top-0 mr-8 mt-8"
                >
                    <Button size="sm">
                        <X />
                    </Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
}
