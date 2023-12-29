import { Avatar } from '@/components/cards/avatar';
import { cn } from '@/lib/utils';
import { Team } from '@/schema/resources/team';
import React, { ReactNode } from 'react';
import { TinyTeamName } from './TinyTeamName';

export function PageTitle({
    team,
    title,
    children,
    className,
}: {
    team: Team;
    title: string;
    children?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex items-end justify-between gap-6 pb-6',
                className
            )}
        >
            <div className="flex items-center gap-6">
                <Avatar profile={team} renderBadge={false} size="big" />
                <div>
                    <TinyTeamName name={team.name} />
                    <h1 className="text-3xl font-semibold">{title}</h1>
                </div>
            </div>
            {children}
        </div>
    );
}
