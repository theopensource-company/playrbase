import { s3 } from '@api/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

export async function GET(
    _req: Request,
    { params: { path } }: { params: { path: string } }
) {
    const key = Array.isArray(path) ? path.join('/') : path ?? '';

    const retrieved = await s3.send(
        new GetObjectCommand({
            Key: key,
            Bucket: process.env.S3_BUCKET,
        })
    );

    if (retrieved.Body) {
        return new NextResponse(await retrieved.Body.transformToByteArray(), {
            headers: {
                'Content-Type': 'image/webp',
            },
        });
    }

    return NextResponse.json(
        {
            success: false,
            error: 'not_found',
        },
        { status: 404 }
    );
}
