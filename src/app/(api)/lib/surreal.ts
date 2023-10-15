import { Surreal } from 'surrealdb.js';

export const surreal = new Surreal();
surreal.connect(process.env.NEXT_PUBLIC_SURREAL_ENDPOINT ?? '', {
    prepare: async (surreal) => {
        await surreal.use({
            ns: process.env.NEXT_PUBLIC_SURREAL_NAMESPACE ?? '',
            db: process.env.NEXT_PUBLIC_SURREAL_DATABASE ?? '',
        });

        await surreal.signin({
            user: process.env.SURREAL_USER ?? '',
            pass: process.env.SURREAL_PASS ?? '',
        });
    },
});
