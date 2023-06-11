import express from 'express';
import { MigrateDatabaseRoute } from './devkit-routes/migrate-database.ts';
const app = express();
const port = 13004;

MigrateDatabaseRoute(app);

app.listen(port, () => {
    console.log(`DevKit API is listening on port ${port}`);
});
