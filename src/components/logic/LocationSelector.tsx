'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import React, {
    Dispatch,
    ReactNode,
    SetStateAction,
    useEffect,
    useState,
} from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function useLocationSelector(def?: [number, number]) {
    return useState<[number, number] | undefined>(def);
}

export function LocationSelector({
    location,
    setLocation,
    label,
    placeholder,
    autoFocus,
    autoComplete,
    limit = 5,
    children,
}: {
    location?: [number, number];
    setLocation: Dispatch<SetStateAction<[number, number] | undefined>>;
    label?: string;
    placeholder?: string;
    autoFocus?: boolean;
    autoComplete?: string;
    limit?: number;
    children?: ReactNode;
}) {
    const t = useTranslations('components.logic.location-selector');
    type Match = [string, [number, number]];

    const [input, setInput] = useState('');
    const [matches, setMatches] = useState<Match[]>([]);
    const { data: locationAddress } = useQuery({
        queryKey: ['location', location],
        async queryFn() {
            if (!location) return null;
            const search = new URLSearchParams({
                format: 'json',
                limit: '1',
                q: location.join(','),
            });

            const raw = await fetch(
                `https://nominatim.openstreetmap.org/search?${search}`
            );

            const res = await raw.json();
            return (res?.[0]?.display_name as string) ?? null;
        },
    });

    useEffect(() => {
        const timeOutId = setTimeout(() => {
            const search = new URLSearchParams({
                format: 'json',
                limit: limit.toString(),
                q: input,
            });

            fetch(`https://nominatim.openstreetmap.org/search?${search}`)
                .then((res) => res.json())
                .then((res) =>
                    setMatches(
                        (res || []).map((match: Record<string, string>) => [
                            match.display_name,
                            [parseFloat(match.lat), parseFloat(match.lon)],
                        ])
                    )
                );
        }, 300);

        return () => clearTimeout(timeOutId);
    }, [input, limit]);

    useEffect(() => {
        if (location && input) setInput('');
    }, [location, input, setInput]);

    return (
        <div className="space-y-3">
            <Label htmlFor="input">{label ?? 'Name or Email'}</Label>
            {location ? (
                <div className="flex items-center justify-between rounded-md border px-4 py-2">
                    <p>{locationAddress}</p>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setLocation(undefined)}
                    >
                        {t('selected.button.clear')}
                    </Button>
                </div>
            ) : (
                <>
                    <Input
                        id="input"
                        placeholder={placeholder ?? t('placeholder')}
                        value={input}
                        onInput={(e) => setInput(e.currentTarget.value)}
                        autoFocus={autoFocus}
                        autoComplete={autoComplete}
                    />
                    {matches && (
                        <div>
                            {matches.map(([display_name, location]) => (
                                <div
                                    key={location.join(',')}
                                    className="flex items-center justify-between py-2"
                                >
                                    <p>{display_name}</p>
                                    <Button
                                        size="sm"
                                        onClick={() => setLocation(location)}
                                    >
                                        {children ?? t('unselected.select')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
