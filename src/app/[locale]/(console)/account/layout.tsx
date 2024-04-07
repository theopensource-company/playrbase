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
import { useSurreal } from '@/lib/Surreal';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import React, { ReactNode } from 'react';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
    const surreal = useSurreal();
    const [featureFlags] = useFeatureFlags();
    const { user } = useAuth();
    const t = useTranslations('pages.console.account');

    const { data: orgTabEnabled } = useQuery({
        queryKey: [
            'account',
            'layout',
            'orgTabEnabled',
            { userId: user?.id, platformUser: user?.platform },
        ],
        initialData: false,
        async queryFn() {
            if (!user) return false;
            if (user.platform) return true;
            return await surreal
                .query<[boolean]>(
                    /* surql */ `
                        RETURN !!(SELECT id FROM ONLY manages WHERE in = $auth LIMIT 1);
                    `
                )
                .then(([r]) => r);
        },
    });

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
                    <NavbarSubLink link="teams">
                        {t('teams.title')}
                    </NavbarSubLink>
                    <NavbarSubLink link="registrations">
                        {t('registrations.title')}
                    </NavbarSubLink>
                    {orgTabEnabled && (
                        <NavbarSubLink link="organisations">
                            {t('organisations.title')}
                        </NavbarSubLink>
                    )}
                    {user && 'api_access' in user && user.api_access && (
                        <NavbarSubLink link="api-access">
                            {t('api_access.title')}
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
