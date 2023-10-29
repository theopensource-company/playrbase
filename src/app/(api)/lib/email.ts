import { Deployed } from '@/config/Environment';
import { Email } from '@/schema/miscellaneous/email';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';

export async function sendEmail(email: Email) {
    email = Email.parse(email);
    const ses = new SESClient({
        region: process.env.SES_REGION,
        credentials: {
            accessKeyId: process.env.SES_KEY_ID ?? '',
            secretAccessKey: process.env.SES_KEY_SECRET ?? '',
        },
    });

    if (Deployed) {
        const command = new SendEmailCommand({
            Destination: {
                ToAddresses: [email.to],
            },
            Source: email.from,
            SourceArn: process.env.SES_SOURCE_ARN,
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: email.html,
                    },
                    Text: {
                        Charset: 'UTF-8',
                        Data: email.text,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: email.subject,
                },
            },
        });

        await ses.send(command);
    } else {
        await fetch('http://127.0.0.1:13004/email/store', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(email),
        });
    }
}
