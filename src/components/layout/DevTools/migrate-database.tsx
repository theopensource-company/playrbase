'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import React, { ReactNode } from 'react';

export default function Devtools_MigrateDatabase() {
    const migrate = () =>
        fetch('/api/devkit/migrate-database', { mode: 'no-cors' });
    const t = useTranslations('components.devtools.migrate-database');

    return (
        <div>
            <h1 className="items-center text-4xl font-bold">{t('title')}</h1>
            <p className="mb-8 mt-4">
                {t.rich('warning', {
                    b: (children: ReactNode) => <b>{children}</b>,
                })}
            </p>

            <Button onClick={() => migrate()}>{t('button')}</Button>
        </div>
    );
}
