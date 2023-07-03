import express from 'express';
import { EmailRoutes } from './devkit-routes/email.ts';
import { MigrateDatabaseRoute } from './devkit-routes/migrate-database.ts';
const app = express();
const port = 13004;

app.use(express.json());

MigrateDatabaseRoute(app);
EmailRoutes(app);

app.listen(port, () => {
    console.log(`DevKit API is listening on port ${port}`);
});
