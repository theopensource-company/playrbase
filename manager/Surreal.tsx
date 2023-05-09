import Surreal from 'surrealdb.js';
import {
    SurrealDatabase,
    SurrealEndpoint,
    SurrealNamespace,
} from '../lib/Surreal';

export const SurrealInstanceManager = new Surreal(SurrealEndpoint, {
    prepare: async (surreal) => {
        await surreal.use(SurrealNamespace, SurrealDatabase);
        const token = localStorage.getItem('pmgrsess');
        if (token) {
            console.log('Authenticating manager with existing token');
            try {
                await surreal.authenticate(token);
            } catch (e) {
                console.error(
                    'Failed to authenticate manager with existing token, clearing it.'
                );
                localStorage.removeItem('pmgrsess');
            }
        }
    },
});
