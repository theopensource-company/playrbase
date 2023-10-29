import { Metadata, Viewport } from 'next';

import React from 'react';

import { siteConfig } from '@/config/site';
import { fontSans } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { importLocale } from '@/locales';
import { Language } from '@/locales/languages';
import { NextIntlClientProvider, useLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { Providers } from './providers';

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: `%s - ${siteConfig.name}`,
    },
    description: siteConfig.description,
    icons: {
        icon: '/favicon.ico',
        shortcut: '/apple-touch-icon.png',
        apple: '/apple-touch-icon.png',
    },
};

export const viewport: Viewport = {
    themeColor: [{ media: '(prefers-color-scheme: dark)', color: 'black' }],
};

interface RootLayoutProps {
    children: React.ReactNode;
    params: {
        locale: Language;
    };
}

export default async function RootLayout({
    children,
    params,
}: RootLayoutProps) {
    let messages = {};
    /* eslint-disable-next-line */
  const locale = useLocale();
    if (params.locale !== locale) {
        notFound();
    } else {
        messages = (await importLocale({ locale })).messages;
    }

    return (
        <>
            <html lang={locale} className="dark" suppressHydrationWarning>
                <head />
                <body
                    className={cn(
                        'min-h-screen bg-background font-sans antialiased',
                        fontSans.variable
                    )}
                >
                    <Providers>
                        <NextIntlClientProvider
                            locale={locale}
                            messages={messages}
                        >
                            <div className="flex min-h-screen flex-col">
                                {children}
                            </div>
                        </NextIntlClientProvider>
                    </Providers>
                </body>
            </html>
        </>
    );
}
