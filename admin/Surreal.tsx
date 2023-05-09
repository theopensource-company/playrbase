import Surreal from 'surrealdb.js';
import { RawQueryResult } from 'surrealdb.js/types/types';
import {
    SurrealDatabase,
    SurrealEndpoint,
    SurrealNamespace,
} from '../lib/Surreal';

export const SurrealInstanceAdmin = new Surreal(SurrealEndpoint, {
    prepare: async (surreal) => {
        await surreal.use(SurrealNamespace, SurrealDatabase);
        const token = localStorage.getItem('kadmsess');
        if (token) {
            console.log('Authenticating admin with existing token');
            try {
                await surreal.authenticate(token);
            } catch (e) {
                console.error(
                    'Failed to authenticate admin with existing token, clearing it.'
                );
                localStorage.removeItem('kadmsess');
            }
        }
    },
});

export const SurrealQueryAdmin = async <
    T extends RawQueryResult = RawQueryResult
>(
    query: string,
    vars?: Record<string, unknown>
) => SurrealInstanceAdmin.query<T[]>(query, vars);
