import { cn } from '@/lib/utils';
import { Profile, unknownProfile } from '@/schema/profile';
import Image from 'next/image';
import React from 'react';
import {
    AvatarFallback,
    AvatarImage,
    Avatar as RenderAvatar,
} from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';

export function Avatar({
    loading,
    size,
    profile = unknownProfile,
    renderBadge = true,
}: {
    profile?: Profile;
    loading?: boolean;
    size?: 'small' | 'normal' | 'big';
    renderBadge?: boolean;
}) {
    const avatarFallback = avatarFallbackByName(profile.name);
    const avatarSize = {
        small: 'h-10 w-10 text-lg',
        normal: 'h-12 w-12 text-xl',
        big: 'h-14 w-14 text-2xl',
    }[size ?? 'normal'];

    return loading ? (
        <Skeleton className={cn('rounded-full', avatarSize)} />
    ) : (
        <div className="relative">
            <RenderAvatar className={cn('rounded-full shadow-md', avatarSize)}>
                <AvatarImage
                    src={
                        'profile_picture' in profile
                            ? (profile.profile_picture as string)
                            : undefined
                    }
                />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
            </RenderAvatar>
            {renderBadge && profile.type == 'admin' && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className={cn(
                                    'absolute -bottom-1 -right-1 aspect-square rounded-full bg-background transition-colors group-hover:bg-accent',
                                    size == 'big'
                                        ? 'w-[45%] p-1.5'
                                        : 'w-1/2 p-1'
                                )}
                            >
                                <Image
                                    src="/favicon.ico"
                                    alt="Playrbase Logo"
                                    width="50"
                                    height="50"
                                    className="h-full w-full text-white"
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Platform admin</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
}

function avatarFallbackByName(name: string) {
    const split = name.toUpperCase().split(' ');
    return split.length > 1
        ? [split.at(0)?.at(0), split.at(-1)?.at(0)].join('')
        : split.slice(0, 2);
}
