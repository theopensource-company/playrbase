'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { useMutation } from '@tanstack/react-query';
import { Key, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';

export default function ApiAccess() {
    const [_, copy] = useCopyToClipboard();
    const { user, loading: userLoading } = useAuth();
    const t = useTranslations('pages.console.account.api_access');

    const has_access = user && 'api_access' in user && user.api_access;
    const {
        data: token,
        isPending,
        mutateAsync: createApiKey,
    } = useMutation({
        mutationKey: ['user', 'generate-api-key'],
        async mutationFn() {
            const apikey = fetch('/api/auth/apikey')
                .then((res) => res.json())
                .then(async (res) => {
                    await new Promise((r) => setTimeout(r, 1000));
                    if (res.success) return res.apikey as string;
                    throw new Error(
                        t('errors.request_failed', { error: res.error })
                    );
                });

            toast.promise(apikey, {
                loading: t('toast.submitting'),
                success: t('toast.success'),
                error: (e) => e.message,
            });

            return apikey;
        },
    });

    return (
        <div className="max-w-sm space-y-8 pt-6">
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            {userLoading ? (
                <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-32" />
                </>
            ) : !has_access ? (
                <p>{t('errors.no_access')}</p>
            ) : (
                <>
                    <p>{t.rich('warning')}</p>
                    <Button onClick={() => createApiKey()} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Key className="mr-2 h-4 w-4" />
                        )}
                        {t('button.generate')}
                    </Button>
                    {token && (
                        <div className="rounded-md border">
                            <div className="flex flex-col items-start justify-between gap-2 border-b p-4 sm:flex-row sm:items-center sm:gap-4">
                                <h3 className="text font-semibold">
                                    {t('token-kind')}
                                </h3>
                                <Button
                                    variant="link"
                                    onClick={() => {
                                        copy(token);
                                        toast(t('toast.copied'));
                                    }}
                                    className="h-6 p-0 text-xs"
                                >
                                    {t('button.copy')}
                                </Button>
                            </div>
                            <div className="text-wrap break-all p-4 text-sm">
                                <p className="text-muted-foreground">{token}</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
