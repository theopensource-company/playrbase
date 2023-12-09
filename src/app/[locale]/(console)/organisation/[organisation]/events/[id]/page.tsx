'use client';

import { useRouter } from '@/locales/navigation';
import { useParams } from 'next/navigation';

export default function Account() {
    const router = useRouter();
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;
    const event_id = Array.isArray(params.id) ? params.id[0] : params.id;

    router.push(`/organisation/${slug}/events/${event_id}/overview`);
}
