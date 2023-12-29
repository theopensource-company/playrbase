'use client';

import Container from '@/components/layout/Container';
import {
    Navbar,
    NavbarHeightOffset,
    NavbarSubLink,
    NavbarSubLinks,
} from '@/components/layout/navbar';
import { useAuth } from '@/lib/auth';
import { useFeatureFlags } from '@/lib/featureFlags';
import { useTranslations } from 'next-intl';
import React, { ReactNode } from 'react';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
    const [featureFlags] = useFeatureFlags();
    const { user } = useAuth();
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
                    <NavbarSubLink link="teams">Teams</NavbarSubLink>
                    <NavbarSubLink link="organisations">
                        {t('organisations.title')}
                    </NavbarSubLink>
                    {user && 'api_access' in user && user.api_access && (
                        <NavbarSubLink link="api-access">
                            API Access
                        </NavbarSubLink>
                    )}
                </NavbarSubLinks>
            </Navbar>
            <Container className="flex flex-grow flex-col pb-24 pt-8">
                <NavbarHeightOffset />
                {children}
            </Container>
        </>
    );
}
