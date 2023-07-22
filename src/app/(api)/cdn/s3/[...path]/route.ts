import { AwsClient } from 'aws4fetch';

export async function GET(
    req: Request,
    { params: { path } }: { params: { path: string } }
) {
    const aws = new AwsClient({
        accessKeyId: process.env.S3_KEY_ID ?? '',
        secretAccessKey: process.env.S3_KEY_SECRET ?? '',
        service: 's3',
    });

    const base = process.env.S3_BUCKET;
    const key = Array.isArray(path) ? path.join('/') : path ?? '';
    return aws.fetch(`${base}/${key}`);
}
