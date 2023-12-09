'use client';

import Container from '@/components/layout/Container';
import {
    Navbar,
    NavbarHeightOffset,
    NavbarSubLink,
    NavbarSubLinks,
} from '@/components/layout/navbar';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useTranslations } from 'next-intl';
import React, { ReactNode } from 'react';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
    const [featureFlags] = useFeatureFlags();
    const t = useTranslations('pages.console.account');

    return (
        <>
            <Navbar>
                <NavbarSubLinks baseUrl={`/account`}>
                    <NavbarSubLink>{t('index.title')}</NavbarSubLink>
                    {featureFlags.passkeys && (
                        <NavbarSubLink link="passkeys">
                            {t('passkeys.title')}
                        </NavbarSubLink>
                    )}
                    <NavbarSubLink link="organisations">
                        {t('organisations.title')}
                    </NavbarSubLink>
                </NavbarSubLinks>
            </Navbar>
            <Container className="flex flex-grow flex-col pb-24 pt-8">
                <NavbarHeightOffset />
                {children}
            </Container>
        </>
    );
}
