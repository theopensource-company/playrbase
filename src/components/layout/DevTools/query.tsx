'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { surreal } from '@/lib/Surreal';
import { useTranslations } from 'next-intl';
import React, { ReactNode, createRef, useCallback, useState } from 'react';

export default function Devtools_Query() {
    const [result, setResult] = useState<object>({});
    const inputRef = createRef<HTMLTextAreaElement>();
    const t = useTranslations('components.devtools.query');

    const run = useCallback(() => {
        if (inputRef.current && inputRef.current.value.trim().length > 0) {
            surreal.query(inputRef.current.value).then((res) => {
                setResult(res);
            });
        } else {
            alert(t('alert.no-query'));
        }
    }, [inputRef, setResult, t]);

    return (
        <div className="flex flex-col gap-16">
            <div>
                <h1 className="items-center text-4xl font-bold">
                    {t('title')}
                </h1>
                <p className="mt-4">
                    {t.rich('warning', {
                        b: (children: ReactNode) => <b>{children}</b>,
                    })}
                </p>
            </div>
            <div className="flex flex-col items-center gap-8">
                <Textarea
                    rows={15}
                    className="whitespace-pre rounded-xl border-muted-foreground p-8 font-mono text-muted-foreground"
                    placeholder={t('input-placeholder')}
                    ref={inputRef}
                />
                <Button onClick={run}>{t('button')}</Button>
                <Textarea
                    rows={15}
                    className="whitespace-pre rounded-xl border-muted-foreground p-8 font-mono text-muted-foreground"
                    disabled
                    value={JSON.stringify(result, null, 2)}
                />
            </div>
        </div>
    );
}
