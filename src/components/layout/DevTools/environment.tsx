'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    parseValueFromString,
    schema,
} from '@/config/Environment';
import { database, endpoint, namespace, useSurreal } from '@/lib/Surreal';
import { useAuth } from '@/lib/auth';
import { useFeatureFlags } from '@/lib/featureFlags';
import { FeatureFlags } from '@theopensource-company/feature-flags';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import { useTranslations } from 'next-intl';
import React from 'react';

dayjs.extend(calendar);

function RenderFeatureFlag({ flag }: { flag: keyof typeof schema }) {
    const [featureFlags, setFeatureFlags] = useFeatureFlags();
    const opts = schema[flag];
    const readonly = 'readonly' in opts && opts.readonly;

    return (
        <TableRow key={flag}>
            <TableCell>{flag}</TableCell>
            <TableCell className="w-[150px] capitalize">
                {typeof featureFlags[flag]}
            </TableCell>
            <TableCell>
                {readonly ? (
                    <div className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background/20 px-3 py-2 text-sm ring-offset-background">
                        {JSON.stringify(featureFlags[flag])}
                    </div>
                ) : (
                    <Select
                        value={JSON.stringify(featureFlags[flag])}
                        onValueChange={(value) => {
                            setFeatureFlags({
                                [flag]: parseValueFromString(value),
                            });
                        }}
                    >
                        <SelectTrigger className="h-8 bg-background/50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {opts.options.map((opt) => {
                                const str = JSON.stringify(opt);
                                return (
                                    <SelectItem key={str} value={str}>
                                        {str}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                )}
            </TableCell>
        </TableRow>
    );
}

export default function Devtools_Environment() {
    const surreal = useSurreal();
    const t = useTranslations('components.devtools.environment');
    const { user } = useAuth();

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
                            {FeatureFlags.listOptionsFromSchema(schema).map(
                                (flag) => (
                                    <RenderFeatureFlag key={flag} flag={flag} />
                                )
                            )}
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
                                        surreal.status
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
                                    ][surreal.status]
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
                                <TableCell>{endpoint}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    {t(
                                        'table.surrealdb-connection.row.namespace'
                                    )}
                                </TableCell>
                                <TableCell>{namespace}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    {t(
                                        'table.surrealdb-connection.row.database'
                                    )}
                                </TableCell>
                                <TableCell>{database}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                    <h2 className="mb-4 mt-8 text-2xl font-bold">
                        {t('table.authentication.title')}
                    </h2>
                    <Table>
                        <TableCaption>
                            <b>
                                {t(
                                    'table.authentication.caption.authenticated'
                                )}
                                :
                            </b>{' '}
                            {t(
                                `table.authentication.caption.${
                                    user ? 'yes' : 'no'
                                }`
                            )}
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    {t('table.authentication.column.property')}
                                </TableHead>
                                <TableHead>
                                    {t('table.authentication.column.value')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>
                                    {t('table.authentication.row.id')}
                                </TableCell>
                                <TableCell>{user?.id}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    {t('table.authentication.row.name')}
                                </TableCell>
                                <TableCell>{user?.name}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    {t('table.authentication.row.email')}
                                </TableCell>
                                <TableCell>{user?.email}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    {t('table.authentication.row.scope')}
                                </TableCell>
                                <TableCell>{user?.scope}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    {t('table.authentication.row.created')}
                                </TableCell>
                                <TableCell>
                                    {user?.created &&
                                        dayjs(user.created).calendar()}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    {t('table.authentication.row.updated')}
                                </TableCell>
                                <TableCell>
                                    {user?.updated &&
                                        dayjs(user.updated).calendar()}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
