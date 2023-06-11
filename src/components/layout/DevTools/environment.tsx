import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Deployed,
    Environment,
    Preview,
    featureFlagOptions,
    featureFlags,
} from '@/config/Environment';
import {
    SurrealDatabase,
    SurrealEndpoint,
    SurrealInstance,
    SurrealNamespace,
} from '@/lib/Surreal';
import { useTranslations } from 'next-intl';
import React from 'react';

export default function Devtools_Environment() {
    const t = useTranslations('components.devtools.environment');

    return (
        <div className="flex flex-col gap-16">
            <h1 className="text-4xl font-bold">{t('title')}</h1>
            <div className="flex flex-wrap gap-16">
                <div className="flex-grow">
                    <h2 className="mb-4 text-2xl font-bold">
                        {t('table.feature-flags.title')}
                    </h2>
                    <Table>
                        <TableCaption>
                            <b>
                                {t('table.feature-flags.caption.environment')}:
                            </b>{' '}
                            {Environment}
                            <span className="mx-3">&#8226;</span>
                            <b>
                                {t('table.feature-flags.caption.deployed')}:
                            </b>{' '}
                            {Deployed
                                ? t('table.feature-flags.caption.yes')
                                : t('table.feature-flags.caption.no')}
                            <span className="mx-3">&#8226;</span>
                            <b>
                                {t('table.feature-flags.caption.preview')}:
                            </b>{' '}
                            {Preview
                                ? t('table.feature-flags.caption.yes')
                                : t('table.feature-flags.caption.no')}
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    {t('table.feature-flags.column.flag')}
                                </TableHead>
                                <TableHead>
                                    {t('table.feature-flags.column.type')}
                                </TableHead>
                                <TableHead>
                                    {t('table.feature-flags.column.value')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {featureFlagOptions.map((flag) => (
                                <TableRow key={flag}>
                                    <TableCell>{flag}</TableCell>
                                    <TableCell className="w-[150px] capitalize">
                                        {typeof featureFlags[flag]}
                                    </TableCell>
                                    <TableCell>
                                        {JSON.stringify(featureFlags[flag])}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex-grow">
                    <h2 className="mb-4 text-2xl font-bold">
                        {t('table.surrealdb-connection.title')}
                    </h2>
                    <Table>
                        <TableCaption>
                            <b>
                                {t('table.surrealdb-connection.caption.status')}
                                :
                            </b>{' '}
                            <span
                                style={{
                                    color: ['green', 'red', 'yellow'][
                                        SurrealInstance.status
                                    ],
                                }}
                            >
                                {
                                    [
                                        t(
                                            'table.surrealdb-connection.caption.connected'
                                        ),
                                        t(
                                            'table.surrealdb-connection.caption.disconnected'
                                        ),
                                        t(
                                            'table.surrealdb-connection.caption.reconnecting'
                                        ),
                                    ][SurrealInstance.status]
                                }
                            </span>
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    {t(
                                        'table.surrealdb-connection.column.property'
                                    )}
                                </TableHead>
                                <TableHead>
                                    {t(
                                        'table.surrealdb-connection.column.value'
                                    )}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>
                                    {t(
                                        'table.surrealdb-connection.row.endpoint'
                                    )}
                                </TableCell>
                                <TableCell>{SurrealEndpoint}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    {t(
                                        'table.surrealdb-connection.row.namespace'
                                    )}
                                </TableCell>
                                <TableCell>{SurrealNamespace}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    {t(
                                        'table.surrealdb-connection.row.database'
                                    )}
                                </TableCell>
                                <TableCell>{SurrealDatabase}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
