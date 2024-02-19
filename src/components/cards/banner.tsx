import { Pattern } from '@/lib/pattern';
import { cn } from '@/lib/utils';
import { Profile, unknownProfile } from '@/schema/resources/profile';
import Image from 'next/image';
import React from 'react';
import { Skeleton } from '../ui/skeleton';

export function Banner({
    loading,
    profile,
    className,
    alt,
}: {
    profile?: Profile | null;
    loading?: boolean;
    className?: string;
    alt?: string;
}) {
    profile = profile ?? unknownProfile;
    const src =
        'computed' in profile
            ? profile.computed.banner
            : 'banner' in profile
              ? profile.banner
              : undefined;

    return (
        <div className={cn('aspect-[4/1] overflow-hidden', className)}>
            {loading ? (
                <Skeleton className="opacity-10" />
            ) : src ? (
                <Image
                    width={2048}
                    height={512}
                    src={src}
                    className="h-full w-full object-cover repeat-0"
                    alt={alt ?? 'Banner'}
                />
            ) : (
                <Pattern
                    input={'id' in profile ? profile.id ?? '' : ''}
                    className="h-full w-full opacity-40 dark:invert"
                />
            )}
        </div>
    );
}
