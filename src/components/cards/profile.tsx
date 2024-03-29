import { cn } from '@/lib/utils';
import { Link } from '@/locales/navigation';
import {
    linkToProfile,
    unknownProfile,
    type Profile as TProfile,
} from '@/schema/resources/profile';
import React, { ReactNode } from 'react';
import { Skeleton } from '../ui/skeleton';
import { Avatar } from './avatar';

type Props = {
    profile?: TProfile | null;
    loading?: boolean;
    size?: 'extra-tiny' | 'tiny' | 'small' | 'normal' | 'big';
    noSub?: boolean;
    customSub?: ReactNode | string;
    renderBadge?: boolean;
    clickable?: boolean | 'manage' | 'settings';
    className?: string;
    noUnderline?: boolean;
};

export function Profile(props: Props) {
    if (props.clickable && props.profile)
        return (
            <Link
                href={
                    linkToProfile(
                        props.profile,
                        props.clickable === true ? 'public' : props.clickable
                    ) ?? ''
                }
            >
                <RenderProfile {...props} />
            </Link>
        );

    return <RenderProfile {...props} />;
}

function RenderProfile({
    loading,
    size,
    profile,
    noSub,
    customSub,
    renderBadge = true,
    clickable,
    className,
    noUnderline,
}: Props) {
    profile = profile ?? unknownProfile;
    const sub = (
        <ProfileSub profile={profile} customSub={customSub} noSub={noSub} />
    );

    return (
        <div
            className={cn(
                'flex items-center',
                size == 'tiny' || size == 'extra-tiny'
                    ? 'space-x-3'
                    : 'space-x-4',
                clickable && 'group',
                className
            )}
        >
            <Avatar
                profile={profile}
                loading={loading}
                size={size}
                renderBadge={renderBadge}
            />
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
                                className={cn('w-full', sub ? 'h-3' : 'h-4')}
                            />
                            {sub && <Skeleton className="h-2 w-[80%]" />}
                        </>
                    ) : (
                        <>
                            <Skeleton className="h-4 w-full" />
                            {sub && <Skeleton className="h-3 w-[80%]" />}
                        </>
                    )}
                </div>
            ) : (
                <div
                    className={cn(
                        size == 'tiny' || size == 'extra-tiny' ? 'pr-0' : 'pr-4'
                    )}
                >
                    <h2
                        className={cn(
                            'whitespace-nowrap text-foreground',
                            size == 'extra-tiny' && 'text-sm',
                            noSub ? 'font-semibold' : 'font-bold',
                            clickable && !noUnderline && 'group-hover:underline'
                        )}
                    >
                        <ProfileName profile={profile} />
                    </h2>
                    {sub && (
                        <p
                            className={cn(
                                'text-xs text-muted-foreground',
                                clickable &&
                                    !noUnderline &&
                                    'group-hover:underline'
                            )}
                        >
                            {sub}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export function ProfileName({ profile }: { profile?: TProfile | null }) {
    profile = profile ?? unknownProfile;
    return profile.type == 'email' ? profile.email : profile.name;
}

export function ProfileSub({
    profile,
    noSub,
    customSub,
}: {
    profile?: TProfile | null;
    noSub?: boolean;
    customSub?: ReactNode | string;
}) {
    profile = profile ?? unknownProfile;
    if (noSub) return;
    return (
        customSub ||
        (profile.type != 'email' && 'email' in profile && profile.email)
    );
}
