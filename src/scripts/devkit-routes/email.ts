import { Express } from 'express';
import { Email } from '../../constants/Types/Email.types.ts';

export const EmailRoutes = (app: Express) => {
    const emails: Record<string, Email & { sent: Date }> = {};

    app.post('/email/store', async (req, res) => {
        const id = (Math.random() + 1).toString(36).substring(7);
        const email = Email.parse(req.body);
        emails[id] = {
            ...email,
            sent: new Date(),
        };

        res.json({
            success: true,
        });
    });

    app.get('/email/list', async (_req, res) => {
        res.json({
            success: true,
            emails,
        });
    });
};
