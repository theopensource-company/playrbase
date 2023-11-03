'use client';

import { useSurreal } from '@/lib/Surreal';
import { Organisation } from '@/schema/resources/organisation';
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

export function useOrganisationSelector() {
    return useState<Organisation['id']>();
}

export function OrganisationSelector({
    organisation,
    setOrganisation,
    label,
    placeholder,
    autoFocus,
    autoComplete,
    limit = 5,
    canManage,
    children,
}: {
    organisation?: Organisation['id'];
    setOrganisation: Dispatch<SetStateAction<Organisation['id'] | undefined>>;
    label?: string;
    placeholder?: string;
    autoFocus?: boolean;
    autoComplete?: string;
    limit?: number;
    canManage?: boolean;
    children?: ReactNode;
}) {
    const surreal = useSurreal();
    const t = useTranslations('components.logic.organisation-selector');
    type Org = Organisation & { can_manage: boolean };

    const [input, setInput] = useState('');
    const [matches, setMatches] = useState<Org[]>([]);
    const { data: profile } = useQuery({
        queryKey: ['organisation', organisation],
        async queryFn() {
            if (!organisation) return null;
            const [res] = await surreal.select<Organisation>(organisation);
            return res ?? null;
        },
    });

    useEffect(() => {
        const timeOutId = setTimeout(() => {
            surreal
                .query<[Org[]]>(
                    /* surql */ `
                        SELECT 
                            *,
                            $auth.id IN managers[WHERE role IN ["owner", "administrator"]].user AS can_manage
                        FROM organisation 
                            WHERE $input
                            AND (
                                email ~ $input
                                OR name ~ $input
                            )
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
        if (organisation && input) setInput('');
    }, [organisation, input, setInput]);

    return (
        <div className="space-y-3">
            <Label htmlFor="input">{label ?? 'Name or Email'}</Label>
            {organisation ? (
                <div className="flex items-center justify-between rounded-md border px-4 py-2">
                    <Profile profile={profile || undefined} size="tiny" />
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setOrganisation(undefined)}
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
                            {matches.map((organisation) => (
                                <div
                                    key={organisation.id}
                                    className="flex items-center justify-between py-2"
                                >
                                    <Profile
                                        profile={organisation}
                                        size="small"
                                    />
                                    {(
                                        canManage
                                            ? organisation.can_manage
                                            : true
                                    ) ? (
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setOrganisation(organisation.id)
                                            }
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
