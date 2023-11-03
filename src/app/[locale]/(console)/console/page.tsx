import { useRouter } from '@/locales/navigation';

export default function ConsolePage() {
    const router = useRouter();
    router.push('/account');
    return null;
}
