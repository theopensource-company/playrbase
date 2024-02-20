'use client';

import { useSurreal } from '@/lib/Surreal';
import { Event } from '@/schema/resources/event';
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
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function useEventSelector() {
    return useState<Event['id']>();
}

export function EventSelector({
    event,
    setEvent,
    label,
    placeholder,
    noLabel,
    autoFocus,
    autoComplete,
    limit = 5,
    canManage,
    children,
}: {
    event?: Event['id'];
    setEvent: Dispatch<SetStateAction<Event['id'] | undefined>>;
    label?: string;
    placeholder?: string;
    noLabel?: boolean;
    autoFocus?: boolean;
    autoComplete?: string;
    limit?: number;
    canManage?: boolean;
    children?: ReactNode;
}) {
    const surreal = useSurreal();
    const t = useTranslations('components.logic.event-selector');
    type Evt = Event & { can_manage: boolean };

    const [input, setInput] = useState('');
    const [matches, setMatches] = useState<Evt[]>([]);
    const { data: selected } = useQuery({
        queryKey: ['event', event],
        async queryFn() {
            console.log(event);
            if (!event) return null;
            const [res] = await surreal.select<Event>(event);
            return res ?? null;
        },
    });

    useEffect(() => {
        const timeOutId = setTimeout(() => {
            surreal
                .query<[Evt[]]>(
                    /* surql */ `
                        SELECT 
                            *,
                            $auth.id IN organiser.managers[WHERE role IN ["owner", "administrator", "event_manager"]].user AS can_manage
                        FROM event 
                            WHERE $input
                            AND name ~ $input
                            LIMIT $limit;
                    `,
                    { input, limit }
                )
                .then(([result]) => {
                    setMatches(result ?? []);
                });
        }, 300);

        return () => clearTimeout(timeOutId);
    }, [input, limit, surreal]);

    useEffect(() => {
        if (event && input) setInput('');
    }, [event, input, setInput]);

    return (
        <div className="space-y-3">
            {!noLabel && <Label htmlFor="input">{label ?? 'Event name'}</Label>}
            {event ? (
                <div className="flex items-center justify-between rounded-md border px-4 py-2">
                    <Profile profile={selected || undefined} size="tiny" />
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setEvent(undefined)}
                    >
                        {t('selected.button.clear')}
                    </Button>
                </div>
            ) : (
                <>
                    <Input
                        id="input"
                        placeholder={placeholder ?? 'john@doe.org'}
                        value={input}
                        onInput={(e) => setInput(e.currentTarget.value)}
                        autoFocus={autoFocus}
                        autoComplete={autoComplete}
                    />
                    {matches && (
                        <div>
                            {matches.map((event) => (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between py-2"
                                >
                                    <Profile profile={event} size="small" />
                                    {(canManage ? event.can_manage : true) ? (
                                        <Button
                                            size="sm"
                                            onClick={() => setEvent(event.id)}
                                        >
                                            {children ?? 'Select'}
                                        </Button>
                                    ) : (
                                        <Badge>
                                            {t(
                                                'unselected.badge.no-permissions'
                                            )}
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
