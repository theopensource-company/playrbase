import { useRouter } from 'next-intl/client';

export default function ConsolePage() {
    const router = useRouter();
    router.push('/account');
    return null;
}
