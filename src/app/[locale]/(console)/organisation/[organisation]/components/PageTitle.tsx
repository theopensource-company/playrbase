import { Avatar } from '@/components/cards/avatar';
import { cn } from '@/lib/utils';
import { Organisation } from '@/schema/resources/organisation';
import React, { ReactNode } from 'react';
import { TinyOrgName } from './TinyOrgName';

export function PageTitle({
    organisation,
    title,
    children,
    className,
}: {
    organisation: Organisation;
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
                <Avatar profile={organisation} renderBadge={false} size="big" />
                <div>
                    <TinyOrgName name={organisation.name} />
                    <h1 className="text-3xl font-semibold">{title}</h1>
                </div>
            </div>
            {children}
        </div>
    );
}
