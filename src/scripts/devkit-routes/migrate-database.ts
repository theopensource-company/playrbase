import { Express } from 'express';
import { PlayrbaseDefaultAdmin, migrateDatabase } from '../_migratetool.ts';

export const MigrateDatabaseRoute = (app: Express) => {
    app.get('/migrate-database', async (_req, res) => {
        const logs: string[] = [];
        await migrateDatabase(
            {
                SURREAL_HOST: 'http://127.0.0.1:13001',
                SURREAL_NAMESPACE: 'playrbase',
                SURREAL_DATABASE: 'playrbase-deployment_local',
                SURREAL_USERNAME: 'root',
                SURREAL_PASSWORD: 'root',
                PLAYRBASE_DEFAULT_ADMIN: JSON.stringify({
                    name: 'Default admin',
                    email: 'admin@playrbase.local',
                } satisfies PlayrbaseDefaultAdmin),
            },
            false,
            true,
            (log: string) => {
                console.log(log);
                logs.push(log);
            }
        );

        res.json({
            success: true,
            logs,
        });
    });
};
