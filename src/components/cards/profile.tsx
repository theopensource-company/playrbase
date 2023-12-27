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
    size?: 'extra-tiny' | 'tiny' | 'small' | 'normal' | 'big';
    noSub?: boolean;
    customSub?: ReactNode | string;
}) {
    profile = profile ?? unknownProfile;
    const sub = customSub || ('email' in profile && profile.email);

    return (
        <div
            className={cn(
                'flex items-center',
                size == 'tiny' || size == 'extra-tiny'
                    ? 'space-x-3'
                    : 'space-x-4'
            )}
        >
            <Avatar profile={profile} loading={loading} size={size} />
            {loading ? (
                <div
                    className={cn(
                        'min-w-[100px] space-y-2',
                        size == 'tiny' || size == 'extra-tiny' ? 'pr-3' : 'pr-4'
                    )}
                >
                    {size == 'tiny' || size == 'extra-tiny' ? (
                        <>
                            <Skeleton
                                className={cn('w-full', noSub ? 'h-4' : 'h-3')}
                            />
                            {!noSub && <Skeleton className="h-2 w-[80%]" />}
                        </>
                    ) : (
                        <>
                            <Skeleton className="h-4 w-full" />
                            {!noSub && <Skeleton className="h-3 w-[80%]" />}
                        </>
                    )}
                </div>
            ) : (
                <div
                    className={cn(
                        size == 'tiny' || size == 'extra-tiny' ? 'pr-3' : 'pr-4'
                    )}
                >
                    <h2
                        className={cn(
                            'text-foreground',
                            size == 'extra-tiny' && 'text-sm',
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
