import {
    DropdownMenuOptionalBoolean,
    useOptionalBoolean,
} from '@/components/logic/DropdownMenuOptionalBoolean';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

export function useEventFilters({
    rootForOrgDefault,
    publishedDefault,
    discoverableDefault,
}: {
    rootForOrgDefault?: boolean;
    publishedDefault?: boolean;
    discoverableDefault?: boolean;
} = {}) {
    const [rootForOrg, setRootForOrg] = useOptionalBoolean(rootForOrgDefault);
    const [published, setPublished] = useOptionalBoolean(publishedDefault);
    const [discoverable, setDiscoverable] =
        useOptionalBoolean(discoverableDefault);

    return {
        rootForOrg,
        published,
        discoverable,
        setRootForOrg,
        setPublished,
        setDiscoverable,
    };
}

export function EventFilters({
    filters: {
        rootForOrg,
        published,
        discoverable,
        setRootForOrg,
        setPublished,
        setDiscoverable,
    },
}: {
    filters: ReturnType<typeof useEventFilters>;
}) {
    const t = useTranslations('components.data.events.filters');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    {t('trigger')}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>{t('menu-label')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuOptionalBoolean
                    value={rootForOrg}
                    onValueChange={setRootForOrg}
                    title={t('hosted-by.title')}
                    options={{
                        undefined: t('hosted-by.options.undefined'),
                        true: t('hosted-by.options.true'),
                        false: t('hosted-by.options.false'),
                    }}
                />
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuOptionalBoolean
                        value={published}
                        onValueChange={setPublished}
                        title={t('published.title')}
                        options={{
                            undefined: t('published.options.undefined'),
                            true: t('published.options.true'),
                            false: t('published.options.false'),
                        }}
                    />
                    <DropdownMenuOptionalBoolean
                        value={discoverable}
                        onValueChange={setDiscoverable}
                        title={t('discoverable.title')}
                        options={{
                            undefined: t('discoverable.options.undefined'),
                            true: t('discoverable.options.true'),
                            false: t('discoverable.options.false'),
                        }}
                    />
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
