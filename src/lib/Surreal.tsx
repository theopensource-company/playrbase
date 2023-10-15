'use client';

import React, { ReactNode, createContext, useContext } from 'react';
import { Surreal } from 'surrealdb.js';

export const endpoint = `${
    process.env.NEXT_PUBLIC_SURREAL_ENDPOINT ?? 'https://euc1-1-db.kards.social'
}/rpc`;
export const namespace =
    process.env.NEXT_PUBLIC_SURREAL_NAMESPACE ?? 'playrbase';
export const database =
    process.env.NEXT_PUBLIC_SURREAL_DATABASE ?? 'playrbase-deployment_unknown';

export const SurrealContext = createContext<Surreal>(new Surreal());

export function SurrealProvider({ children }: { children: ReactNode }) {
    const surreal = new Surreal();
    surreal.connect(endpoint, {
        prepare: async (surreal) => {
            await surreal.use({ ns: namespace, db: database });
            if (typeof window !== 'undefined') {
                const token = await fetch('/api/auth/token')
                    .then((res) => res.json())
                    .then((res) => {
                        if (res.success) return res.token as string;
                        console.error(`Failed to retrieve token: ${res.error}`);
                    });

                try {
                    if (token) await surreal.authenticate(token);
                } catch (e) {
                    console.error(`Failed to authenticate with token: ${e}`);
                }
            }
        },
    });

    return (
        <SurrealContext.Provider value={surreal}>
            {children}
        </SurrealContext.Provider>
    );
}

export function useSurreal() {
    return useContext(SurrealContext);
}

export function buildTableFilters<TRecord = unknown>(
    mapper: (
        property: keyof TRecord,
        record: Partial<TRecord>
    ) => Promise<string>
) {
    return async function (filters: Partial<TRecord>) {
        if (Object.keys(filters ?? {}).length == 0) return '';
        const result = (
            await Promise.all(
                (Object.keys(filters ?? {}) as (keyof TRecord)[]).map((p) =>
                    mapper(p, filters)
                )
            )
        )
            .filter((a) => !!a)
            .join(' AND ');

        return `WHERE ${result}`;
    };
}

export function isNoneValue<TRecord = unknown>(
    property: keyof TRecord,
    record: Partial<TRecord>
) {
    return property in record && typeof record[property] === 'undefined';
}
