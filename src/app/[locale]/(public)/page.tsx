'use client';

import { Button } from '@/components/ui/button';
import { useFeatureFlags } from '@/lib/featureFlags';
import { Link } from '@/locales/navigation';
import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { ReactNode } from 'react';

export default function Home() {
    const t = useTranslations('pages.home');
    const [featureFlags] = useFeatureFlags();
    const tint = (children: ReactNode) => (
        <span className="bg-gradient-to-tr from-blue-400 via-indigo-600 to-purple-400 bg-clip-text text-transparent">
            {children}
        </span>
    );

    return (
        <div className="flex flex-grow flex-col justify-center gap-10">
            <div className="flex flex-col gap-7 text-4xl font-bold sm:text-5xl">
                <h1>{t.rich('headline.0', { tint })}</h1>
                <h2>{t.rich('headline.1', { tint })}</h2>
                <h2>{t.rich('headline.2', { tint })}</h2>
            </div>
            <div>
                {featureFlags.preLaunchPage ? (
                    <Button disabled>
                        <Clock className="mr-2 h-4 w-4" />
                        {t('button.releasing-soon')}
                    </Button>
                ) : (
                    <Button asChild size="lg">
                        <Link href="/get-started">
                            {t('button.get-started')}
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    );
}
