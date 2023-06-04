import { AwsClient } from 'aws4fetch';
import { type NextRequest } from 'next/server';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: NextRequest) {
    const aws = new AwsClient({
        accessKeyId: process.env.S3_KEY_ID ?? '',
        secretAccessKey: process.env.S3_KEY_SECRET ?? '',
        service: 's3',
    });

    const base = process.env.S3_BUCKET;
    const path = req.nextUrl.searchParams.getAll('path');
    const key = Array.isArray(path) ? path.join('/') : path ?? '';
    return aws.fetch(`${base}/${key}`);
}
