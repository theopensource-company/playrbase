'use client';

import { useRouter } from 'next-intl/client';
// import { useTranslations } from 'next-intl';

export default function ConsolePage() {
    const router = useRouter();
    router.push('/account');
    return null;
}
