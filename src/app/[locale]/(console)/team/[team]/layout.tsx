'use client';

import {
    Navbar,
    NavbarHeightOffset,
    NavbarSubLink,
    NavbarSubLinks,
} from '@/components/layout/navbar';
import { useTeam } from '@/lib/Queries/Team';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/locales/navigation';
import { User } from '@/schema/resources/user';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { ReactNode, useEffect } from 'react';

export default function TeamLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const params = useParams();
    const slug = Array.isArray(params.team) ? params.team[0] : params.team;

    const { loading: authLoading, user } = useAuth();
    const { isPending: orgLoading, data: team } = useTeam({
        slug,
    });

    const loading = orgLoading || authLoading;

    useEffect(() => {
        if (!loading) {
            if (!team?.players.includes(user?.id as User['id'])) {
                router.push(`/team/${slug}`);
            }
        }
    }, [user, loading, router, team, slug]);

    return (
        <>
            <Navbar actor={team ?? undefined}>
                <NavbarSubLinks baseUrl={`/team/${slug}`}>
                    <NavbarSubLink>
                        <ArrowLeft />
                    </NavbarSubLink>
                    <NavbarSubLink link="overview">Overview</NavbarSubLink>
                    <NavbarSubLink link="registrations">
                        Registrations
                    </NavbarSubLink>
                    <NavbarSubLink link="members">Members</NavbarSubLink>
                    <NavbarSubLink link="settings">Settings</NavbarSubLink>
                </NavbarSubLinks>
            </Navbar>
            <div className="flex flex-grow flex-col pb-24 pt-8">
                <NavbarHeightOffset />
                {children}
            </div>
        </>
    );
}
