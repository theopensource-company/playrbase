'use client';

import { CreateOrganisation } from '@/components/data/organisations/create';
import { OrganisationTable } from '@/components/data/organisations/table';
import { NotFoundScreen } from '@/components/layout/NotFoundScreen';
import { useSurreal } from '@/lib/Surreal';
import { Organisation } from '@/schema/resources/organisation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import React from 'react';
import { z } from 'zod';
import { PageTitle } from '../../components/PageTitle';

export default function Organisations() {
    const params = useParams();
    const slug = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;

    const { data, isPending, refetch } = useData({ slug });
    const t = useTranslations('pages.console.organisation.organisations');

    if (!data?.organisation) return <NotFoundScreen text={t('not_found')} />;
    const nested = data.nested ?? [];
    const organisation = data.organisation;

    return (
        <div className="flex flex-grow flex-col gap-12 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-8">
                <PageTitle organisation={organisation} title={t('title')} />
                <CreateOrganisation
                    refetch={refetch}
                    defaultPartOf={organisation.id}
                />
            </div>

            <OrganisationTable
                isLoading={isPending}
                organisations={nested}
                caption={
                    nested ? (
                        <>
                            <b>{t('table.caption.count')}:</b> {nested.length}
                        </>
                    ) : undefined
                }
            />
        </div>
    );
}

function useData({ slug }: { slug: Organisation['slug'] }) {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['organisations', 'nested', slug],
        queryFn: async () => {
            const result = await surreal.query<
                [null, Organisation, Organisation[]]
            >(
                /* surql */ `
                    LET $org = 
                        SELECT * FROM ONLY organisation 
                            WHERE slug = $slug
                            LIMIT 1;

                    SELECT * FROM organisation
                        WHERE part_of = $org.id;

                    $org;
                `,
                { slug }
            );

            if (!result?.[1] || !result?.[2]) return null;
            return {
                organisation: Organisation.parse(result[2]),
                nested: z.array(Organisation).parse(result[1]),
            };
        },
    });
}
