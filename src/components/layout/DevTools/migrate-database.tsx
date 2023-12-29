'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import React, { useCallback, useState } from 'react';

export default function Devtools_MigrateDatabase() {
    const [logs, setLogs] = useState('');
    const migrate = useCallback(async () => {
        const res = await fetch('/api/devkit/migrate-database').then((res) =>
            res.json()
        );
        setLogs(
            res.logs?.join('\n').slice(1) ??
                'An error occurred while storing logs'
        );
    }, []);
    const t = useTranslations('components.devtools.migrate-database');

    return (
        <div>
            <h1 className="items-center text-4xl font-bold">{t('title')}</h1>
            <p className="mb-8 mt-4">{t.rich('warning')}</p>

            {logs && (
                <p className="mb-10 whitespace-break-spaces rounded-lg bg-accent px-6 py-5 font-mono">
                    {logs}
                </p>
            )}

            <Button onClick={() => migrate()}>{t('button')}</Button>
        </div>
    );
}
