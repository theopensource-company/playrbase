'use client';

import Container from '@/components/layout/Container';
import { useOrganisation } from '@/lib/Queries/Organisation';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import React from 'react';

export default function Account() {
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;
    const {
        isLoading,
        data: organisation,
        // refetch,
    } = useOrganisation({ slug });

    return isLoading ? (
        <Container className="flex w-full flex-grow items-center justify-center">
            <Loader2 size={50} className="animate-spin" />
        </Container>
    ) : organisation ? (
        <div className="flex max-w-2xl flex-grow flex-col gap-6 pt-6">
            <h1 className="pb-6 text-3xl font-semibold">Members</h1>
        </div>
    ) : (
        <p>org not found</p>
    );
}
