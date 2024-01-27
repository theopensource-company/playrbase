'use server';

import { surreal } from '@/app/(api)/lib/surreal';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function ManageRedirect({
    params: { event, subpage },
}: {
    params: { event: string; subpage: string };
}) {
    const [data] = await surreal.query<
        [{ event_slug: string; organisation_slug: string } | null]
    >(
        /* surrealql */ `
            SELECT 
                meta::id(id) as event_slug, 
                organiser.slug as organisation_slug
            FROM ONLY type::thing('event', $event)
        `,
        { event }
    );

    if (!data) <NotFoundScreen text="Event not found" />;
    return redirect(
        `/organisation/${data?.organisation_slug}/events/${data?.event_slug}/${subpage}`
    );
}
