import { migrateDatabase, MigrationEnvironment } from './_migratetool.ts';

let env: MigrationEnvironment;

try {
    env = MigrationEnvironment.parse(process.env);
} catch (e) {
    console.error('One or more environment variables are missing');
    process.exit(1);
}

migrateDatabase(env);
