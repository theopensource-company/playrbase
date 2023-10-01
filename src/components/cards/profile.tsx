import {
    unknownProfile,
    type Profile as TProfile,
} from '@/schema/resources/profile';
import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { Avatar } from './avatar';

export function Profile({
    loading,
    size,
    profile = unknownProfile,
}: {
    profile?: TProfile;
    loading?: boolean;
    size?: 'small' | 'normal' | 'big';
}) {
    return (
        <div className="flex items-center space-x-4">
            <Avatar profile={profile} loading={loading} size={size} />
            {loading ? (
                <div className="min-w-[150px] space-y-2 pr-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                </div>
            ) : (
                <div className="min-w-[150px] pr-4">
                    <h2 className="font-bold text-foreground">
                        {profile.name}
                    </h2>
                    {'email' in profile && profile.email && (
                        <p className="text-xs text-muted-foreground">
                            {profile.email}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
