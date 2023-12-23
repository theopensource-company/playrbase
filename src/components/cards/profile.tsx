import { cn } from '@/lib/utils';
import {
    unknownProfile,
    type Profile as TProfile,
} from '@/schema/resources/profile';
import React, { ReactNode } from 'react';
import { Skeleton } from '../ui/skeleton';
import { Avatar } from './avatar';

export function Profile({
    loading,
    size,
    profile,
    noSub,
    customSub,
}: {
    profile?: TProfile | null;
    loading?: boolean;
    size?: 'tiny' | 'small' | 'normal' | 'big';
    noSub?: boolean;
    customSub?: ReactNode | string;
}) {
    profile = profile ?? unknownProfile;
    const sub = customSub || ('email' in profile && profile.email);

    return (
        <div
            className={cn(
                'flex items-center',
                size == 'tiny' ? 'space-x-3' : 'space-x-4'
            )}
        >
            <Avatar profile={profile} loading={loading} size={size} />
            {loading ? (
                <div className="min-w-[150px] space-y-2 pr-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                </div>
            ) : (
                <div className="min-w-[150px] pr-4">
                    <h2
                        className={cn(
                            'text-foreground',
                            noSub ? 'font-semibold' : 'font-bold'
                        )}
                    >
                        {profile.name}
                    </h2>
                    {!noSub && sub && (
                        <p className="text-xs text-muted-foreground">{sub}</p>
                    )}
                </div>
            )}
        </div>
    );
}
