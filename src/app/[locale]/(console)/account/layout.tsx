'use client';

import Container from '@/components/layout/Container';
import {
    Navbar,
    NavbarSubLink,
    NavbarSubLinks,
} from '@/components/layout/navbar';
import { useScrolledState } from '@/lib/scrolled';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import React, { ReactNode } from 'react';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
    const scrolled = useScrolledState();
    const t = useTranslations('pages.console.account');

    return (
        <>
            <Navbar>
                <NavbarSubLinks baseUrl={`/account`}>
                    <NavbarSubLink>{t('index.title')}</NavbarSubLink>
                    <NavbarSubLink link="passkeys">
                        {t('passkeys.title')}
                    </NavbarSubLink>
                    <NavbarSubLink link="organisations">
                        {t('organisations.title')}
                    </NavbarSubLink>
                </NavbarSubLinks>
            </Navbar>
            <Container className="pb-24 pt-8">
                <div
                    className={cn(
                        'transition-height',
                        scrolled ? 'h-24' : 'h-36'
                    )}
                />
                {children}
            </Container>{' '}
        </>
    );
}
