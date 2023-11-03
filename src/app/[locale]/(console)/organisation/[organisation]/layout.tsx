'use client';

import Container from '@/components/layout/Container';
import {
    Navbar,
    NavbarSubLink,
    NavbarSubLinks,
} from '@/components/layout/navbar';
import { useOrganisation } from '@/lib/Queries/Organisation';
import { useAuth } from '@/lib/auth';
import { useScrolledState } from '@/lib/scrolled';
import { cn } from '@/lib/utils';
import { useRouter } from '@/locales/navigation';
import { User } from '@/schema/resources/user';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React, { ReactNode, useEffect } from 'react';

export default function ConsoleLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;
    const t = useTranslations('pages.console.organisation');

    const scrolled = useScrolledState();
    const { loading: authLoading, user } = useAuth();
    const { isPending: orgLoading, data: organisation } = useOrganisation({
        slug,
    });

    const loading = orgLoading || authLoading;

    useEffect(() => {
        if (!loading) {
            if (
                !organisation?.managers
                    .map(({ user }) => user)
                    .includes(user?.id as User['id'])
            ) {
                router.push(`/organisation/${slug}`);
            }
        }
    }, [user, loading, router, organisation, slug]);

    return (
        <>
            <Navbar>
                <NavbarSubLinks baseUrl={`/organisation/${slug}`}>
                    <NavbarSubLink>
                        <ArrowLeft />
                    </NavbarSubLink>
                    <NavbarSubLink link="events">
                        {t('events.title')}
                    </NavbarSubLink>
                    <NavbarSubLink link="members">
                        {t('members.title')}
                    </NavbarSubLink>
                    <NavbarSubLink link="settings">
                        {t('settings.title')}
                    </NavbarSubLink>
                </NavbarSubLinks>
            </Navbar>
            <Container className="flex flex-grow flex-col pb-24 pt-8">
                <div
                    className={cn(
                        'transition-height',
                        scrolled ? 'h-24' : 'h-36'
                    )}
                />
                {children}
            </Container>
        </>
    );
}
