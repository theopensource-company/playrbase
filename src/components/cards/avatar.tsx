import { cn } from '@/lib/utils';
import { Profile, unknownProfile } from '@/schema/resources/profile';
import { Building, MailPlus, Users } from 'lucide-react';
import React, { ReactNode } from 'react';
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
    profile,
    renderBadge = true,
    className,
}: {
    profile?: Profile | null;
    loading?: boolean;
    size?: 'extra-tiny' | 'tiny' | 'small' | 'normal' | 'big' | 'huge';
    renderBadge?: boolean;
    className?: string;
}) {
    profile = profile ?? unknownProfile;
    const avatarFallback = avatarFallbackByName(
        profile.type == 'email' ? profile.email : profile.name
    );
    const avatarSize = {
        'extra-tiny': 'h-6 w-6 text-xs',
        tiny: 'h-8 w-8 text-md',
        small: 'h-10 w-10 text-lg',
        normal: 'h-12 w-12 text-xl',
        big: 'h-14 w-14 text-2xl',
        huge: 'h-20 w-20 text-4xl',
    }[size ?? 'normal'];

    function Badge({ icon, text }: { icon: ReactNode; text: string }) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                'absolute -bottom-1 -right-1 aspect-square rounded-full bg-background transition-colors group-hover:bg-accent',
                                ['big', 'huge'].includes(size as string)
                                    ? 'w-[45%] p-1.5'
                                    : size == 'extra-tiny'
                                      ? 'w-2/3 p-1'
                                      : size == 'tiny'
                                        ? 'w-3/5 p-1'
                                        : 'w-1/2 p-1'
                            )}
                        >
                            {icon}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{text}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return loading ? (
        <Skeleton
            className={cn(
                'aspect-square rounded-full bg-white/10 backdrop-blur',
                avatarSize,
                className
            )}
        />
    ) : (
        <div
            className={cn(
                'relative aspect-square rounded-full bg-white/10 backdrop-blur',
                avatarSize,
                className
            )}
        >
            <RenderAvatar className="h-full w-full rounded-full shadow-md">
                <AvatarImage
                    src={
                        'profile_picture' in profile
                            ? (profile.profile_picture as string)
                            : 'computed' in profile
                              ? (profile.computed.logo as string)
                              : 'logo' in profile
                                ? (profile.logo as string)
                                : undefined
                    }
                />
                <AvatarFallback className="bg-transparent">
                    {avatarFallback}
                </AvatarFallback>
            </RenderAvatar>
            {renderBadge && 'type' in profile ? (
                profile.type == 'organisation' ? (
                    <Badge
                        text="Organisation"
                        icon={<Building className="h-full w-full" />}
                    />
                ) : profile.type == 'team' ? (
                    <Badge
                        text="Team"
                        icon={<Users className="h-full w-full" />}
                    />
                ) : profile.type == 'email' ? (
                    <Badge
                        text="Invited user"
                        icon={<MailPlus className="h-full w-full" />}
                    />
                ) : undefined
            ) : undefined}
        </div>
    );
}

function avatarFallbackByName(name: string) {
    const split = name.toUpperCase().split(' ');
    return split.length > 1
        ? [split.at(0)?.at(0), split.at(-1)?.at(0)].join('')
        : split[0].slice(0, 2) ?? '??';
}
