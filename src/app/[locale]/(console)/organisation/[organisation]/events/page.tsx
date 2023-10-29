'use client';

import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { useOrganisation } from '@/lib/Queries/Organisation';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React from 'react';

export default function Account() {
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;
    const t = useTranslations('pages.console.organisation.events');
    const {
        isPending,
        data: organisation,
        // refetch,
    } = useOrganisation({ slug });

    return isPending ? (
        <LoaderOverlay />
    ) : organisation ? (
        <div className="flex max-w-2xl flex-grow flex-col gap-6 pt-6">
            <h1 className="pb-6 text-3xl font-semibold">{t('title')}</h1>
        </div>
    ) : (
        <NotFoundScreen text={t('not_found')} />
    );
}
