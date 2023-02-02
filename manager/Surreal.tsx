import React, { ReactNode, useEffect, useState } from 'react';
import Surreal, { Result } from 'surrealdb.js';
import {
    SurrealDatabase,
    SurrealEndpoint,
    SurrealNamespace,
} from '../lib/Surreal';

export const SurrealInstanceManager = new Surreal(SurrealEndpoint);

export const SurrealInitManager = async () => {
    await SurrealInstanceManager.use(SurrealNamespace, SurrealDatabase);
    const token = localStorage.getItem('pmgrsess');
    if (token) {
        console.log('Authenticating manager with existing token');
        try {
            await SurrealInstanceManager.authenticate(token);
        } catch (e) {
            console.error(
                'Failed to authenticate manager with existing token, clearing it.'
            );
            localStorage.removeItem('pmgrsess');
        }
    }
};

export const SurrealQueryManager = async <T = unknown,>(
    query: string,
    vars?: Record<string, unknown>
): Promise<Result<T[]>[]> =>
    SurrealInstanceManager.query<Result<T[]>[]>(query, vars);

export function InitializeSurrealManager({
    children,
}: {
    children: ReactNode;
}) {
    const [ready, setReady] = useState<boolean>(false);
    useEffect(() => {
        (async () => {
            await SurrealInitManager();
            setReady(true);
        })();
    }, []);

    return <>{ready && children}</>;
}
