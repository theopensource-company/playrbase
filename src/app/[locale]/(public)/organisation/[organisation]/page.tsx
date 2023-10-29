'use client';

import { LoaderOverlay } from '@/components/layout/LoaderOverlay';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { useOrganisation } from '@/lib/Queries/Organisation';
import { useParams } from 'next/navigation';
import React from 'react';

export default function Page() {
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;
    const { isPending, data: organisation } = useOrganisation({ slug });

    return isPending ? (
        <LoaderOverlay />
    ) : organisation ? (
        <div className="flex max-w-2xl flex-grow flex-col gap-6">
            <h1 className="pb-6 text-3xl font-semibold">{organisation.name}</h1>
        </div>
    ) : (
        <NotFoundScreen text="Organisation not found" />
    );
}
