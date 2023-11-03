import { Surreal } from 'surrealdb.js';

export const surreal = new Surreal();
surreal.connect(process.env.NEXT_PUBLIC_SURREAL_ENDPOINT ?? '', {
    namespace: process.env.NEXT_PUBLIC_SURREAL_NAMESPACE ?? '',
    database: process.env.NEXT_PUBLIC_SURREAL_DATABASE ?? '',
    auth: {
        username: process.env.SURREAL_USERNAME ?? '',
        password: process.env.SURREAL_PASSWORD ?? '',
    },
});
