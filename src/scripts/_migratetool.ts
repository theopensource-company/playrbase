import fetch from 'node-fetch';
import { ExperimentalSurrealHTTP } from 'surrealdb.js';
import { z } from 'zod';
import * as schemas from '../schema/index.ts';

export const MigrationEnvironment = z.object({
    SURREAL_HOST: z.string(),
    SURREAL_NAMESPACE: z.string(),
    SURREAL_DATABASE: z.string(),
    SURREAL_USERNAME: z.string(),
    SURREAL_PASSWORD: z.string(),
});

export type MigrationEnvironment = z.infer<typeof MigrationEnvironment>;

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

        const db = new ExperimentalSurrealHTTP({ fetch });
        await db.connect(env.SURREAL_HOST, {
            namespace: env.SURREAL_NAMESPACE,
            database: env.SURREAL_DATABASE,
            auth: {
                username: env.SURREAL_USERNAME,
                password: env.SURREAL_PASSWORD,
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

        log?.('\nFinished database migrations');
        if (exit) process.exit(0);
    } catch (e) {
        const err = e as Error;
        log?.('\nCould not run migration script');
        log?.(err.toString());
    }
};
