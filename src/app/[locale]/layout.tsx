import { Metadata, Viewport } from 'next';

import React from 'react';

import { Toaster } from '@/components/ui/sonner';
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
    maximumScale: 1,
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
    let importedLocale = {};
    const locale = useLocale();
    if (params.locale !== locale) {
        notFound();
    } else {
        importedLocale = await importLocale({ locale });
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
                    <NextIntlClientProvider locale={locale} {...importedLocale}>
                        <Providers>
                            <div
                                // eslint-disable-next-line react/no-unknown-property
                                vaul-drawer-wrapper=""
                                className="flex min-h-screen flex-col will-change-transform"
                            >
                                {children}
                            </div>
                            <Toaster />
                        </Providers>
                    </NextIntlClientProvider>
                </body>
            </html>
        </>
    );
}
