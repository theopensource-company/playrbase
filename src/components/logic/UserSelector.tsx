'use client';

import { useSurreal } from '@/lib/Surreal';
import { User } from '@/schema/resources/user';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import React, {
    Dispatch,
    ReactNode,
    SetStateAction,
    useEffect,
    useState,
} from 'react';
import { Profile } from '../cards/profile';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function useUserSelector() {
    return useState<User['id']>();
}

export function UserSelector({
    user,
    setUser,
    autoFocus,
    autoComplete,
    limit = 5,
    children,
}: {
    user?: User['id'];
    setUser: Dispatch<SetStateAction<User['id'] | undefined>>;
    autoFocus?: boolean;
    autoComplete?: string;
    limit?: number;
    children?: ReactNode;
}) {
    const surreal = useSurreal();
    const [input, setInput] = useState('');
    const [matches, setMatches] = useState<User[]>([]);
    const t = useTranslations('components.logic.user-selector');

    const { data: profile } = useQuery({
        queryKey: ['user', user],
        async queryFn() {
            if (!user) return null;
            const [res] = await surreal.select<User>(user);
            return res ?? null;
        },
    });

    useEffect(() => {
        const timeOutId = setTimeout(() => {
            surreal
                .query<[User[]]>(
                    /* surql */ `
                        SELECT * FROM user WHERE id != $auth && $email && email ~ $email LIMIT $limit
                    `,
                    { email: input, limit }
                )
                .then(([{ result }]) => {
                    setMatches(result ?? []);
                });
        }, 300);

        return () => clearTimeout(timeOutId);
    }, [input, limit, surreal]);

    useEffect(() => {
        if (user && input) setInput('');
    }, [user, input, setInput]);

    return user ? (
        <div className="flex items-center justify-between rounded-md border px-4 py-2">
            <Profile profile={profile || undefined} size="tiny" />
            <Button
                variant="destructive"
                size="sm"
                onClick={() => setUser(undefined)}
            >
                {t('selected.button.clear')}
            </Button>
        </div>
    ) : (
        <div className="space-y-3">
            <Label htmlFor="email">{t('unselected.label')}</Label>
            <Input
                id="email"
                placeholder={t('unselected.placeholder')}
                value={input}
                onInput={(e) => setInput(e.currentTarget.value)}
                autoFocus={autoFocus}
                autoComplete={autoComplete}
            />
            {matches && (
                <div>
                    {matches.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center justify-between py-2"
                        >
                            <Profile profile={user} size="small" />
                            <Button size="sm" onClick={() => setUser(user.id)}>
                                {children ?? t('unselected.select')}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
