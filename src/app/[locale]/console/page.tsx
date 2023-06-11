import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { UserCog, UserSquare2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

export default function ConsolePage() {
    const t = useTranslations('pages.console.index');

    return (
        <Container className="flex justify-center align-middle">
            <div className="mt-8 flex flex-col items-center gap-16 rounded-2xl bg-muted px-48 pb-32 pt-24">
                <h1 className="text-5xl font-bold">{t('title')}</h1>
                <div className="flex justify-between gap-8">
                    <div className="flex flex-col items-center gap-4 rounded-lg bg-primary p-3 dark:bg-primary-foreground">
                        <UserSquare2
                            size={48}
                            className="mb-4 mt-8 text-primary-foreground dark:text-primary"
                        />
                        <h2 className="mb-6 text-2xl font-bold text-primary-foreground dark:text-primary">
                            {t('player')}
                        </h2>
                        <Button className="w-48 bg-primary-foreground text-primary dark:bg-primary dark:text-primary-foreground">
                            {t('button')}
                        </Button>
                    </div>
                    <div className="flex flex-col items-center gap-4 rounded-lg bg-primary p-3 dark:bg-primary-foreground">
                        <UserCog
                            size={48}
                            className="mb-4 mt-8 text-primary-foreground dark:text-primary"
                        />
                        <h2 className="mb-6 text-2xl font-bold text-primary-foreground dark:text-primary">
                            {t('manager')}
                        </h2>
                        <Button className="w-48 bg-primary-foreground text-primary dark:bg-primary dark:text-primary-foreground">
                            {t('button')}
                        </Button>
                    </div>
                </div>
            </div>
        </Container>
    );
}
