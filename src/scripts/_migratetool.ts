import fetch from 'node-fetch';
import { ExperimentalSurrealHTTP } from 'surrealdb.js';
import { z } from 'zod';
import { fullname } from '../lib/zod.ts';
import * as schemas from '../schema/index.ts';

export const MigrationEnvironment = z.object({
    SURREAL_HOST: z.string(),
    SURREAL_NAMESPACE: z.string(),
    SURREAL_DATABASE: z.string(),
    SURREAL_USERNAME: z.string(),
    SURREAL_PASSWORD: z.string(),
    PLAYRBASE_DEFAULT_ADMIN: z.string().optional(),
});

export type MigrationEnvironment = z.infer<typeof MigrationEnvironment>;

export const PlayrbaseDefaultAdmin = z.object({
    name: fullname(),
    email: z.string().email(),
});

export type PlayrbaseDefaultAdmin = z.infer<typeof PlayrbaseDefaultAdmin>;

export const migrateDatabase = async (
    envRaw: MigrationEnvironment,
    exit = true,
    logsEnabled = true,
    logger = console.log
) => {
    const log = logsEnabled ? logger : null;
    try {
        const env = MigrationEnvironment.parse(envRaw);

        log?.('\nHost: ' + env.SURREAL_HOST);
        log?.('NS: ' + env.SURREAL_NAMESPACE);
        log?.('DB: ' + env.SURREAL_DATABASE);

        const db = new ExperimentalSurrealHTTP(env.SURREAL_HOST, {
            fetch,
            ns: env.SURREAL_NAMESPACE,
            db: env.SURREAL_DATABASE,
            auth: {
                user: env.SURREAL_USERNAME,
                pass: env.SURREAL_PASSWORD,
            },
        });

        log?.('\nStarting database migrations\n');

        await Promise.all(
            Object.entries(schemas).map(async ([name, schema]) => {
                log?.(` + Executing schema ${name}`);
                await db.query(schema).catch((e) => {
                    log?.(`\n - Migration failed for schema: ${name}`);
                    log?.(' - ' + e.toString());
                    throw new Error('Failed, see reason above');
                });
            })
        );

        if (env.PLAYRBASE_DEFAULT_ADMIN) {
            log?.('\nDetected default admin credentials\n');

            try {
                const user = PlayrbaseDefaultAdmin.parse(
                    JSON.parse(env.PLAYRBASE_DEFAULT_ADMIN)
                );

                log?.(' + Setting default admin credentials');
                await db.create('admin', user).catch((e) => {
                    log?.(' - ' + e.toString());
                });
            } catch (e) {
                const err = e as Error;
                log?.(' - ' + err.toString());
            }
        } else {
            log?.('\nNo default admin credentials were found');
        }

        log?.('\nFinished database migrations');
        if (exit) process.exit(0);
    } catch (e) {
        const err = e as Error;
        log?.('\nCould not run migration script');
        log?.(err.toString());
    }
};
