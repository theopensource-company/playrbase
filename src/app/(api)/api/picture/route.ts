import { surreal } from '@api/lib/surreal';
import { extractUserTokenFromRequest } from '@api/lib/token';
import { AwsClient } from 'aws4fetch';
import { Blob, File } from 'buffer';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { z } from 'zod';

const Intent = z.literal('profile_picture');
const sizeByIntent = {
    profile_picture: 512,
    logo: 1024,
    banner: 2048,
};

export async function PUT(req: NextRequest) {
    const { decoded: token } = extractUserTokenFromRequest(req);
    if (!token)
        return NextResponse.json(
            { success: false, error: 'not_authenticated' },
            { status: 403 }
        );

    const aws = new AwsClient({
        accessKeyId: process.env.S3_KEY_ID ?? '',
        secretAccessKey: process.env.S3_KEY_SECRET ?? '',
        service: 's3',
    });

    const formData = await req.formData();
    const intent = (() => {
        const unvalidated = formData.get('intent');
        const parsed = Intent.safeParse(unvalidated);
        if (parsed.success) return parsed.data;
    })();

    if (!intent)
        return NextResponse.json(
            { success: false, error: 'missing_intent' },
            { status: 400 }
        );

    const target = token.ID;

    const file = formData.get('file');
    if (!(file instanceof Blob || file instanceof File))
        return NextResponse.json(
            { success: false, error: 'file_not_a_file' },
            { status: 400 }
        );

    const compressed = await sharp(await file.arrayBuffer())
        .resize({ width: sizeByIntent[intent], withoutEnlargement: true })
        .webp({ lossless: true })
        .toBuffer();
    const hash = compressed
        .toString('base64')
        .slice(0, 50)
        .replaceAll('/', '_');

    const base = process.env.S3_BUCKET;
    const key = `${hash}.webp`;
    const s3res = await aws.fetch(`${base}/${key}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'image/webp',
            'Content-Length': Buffer.byteLength(compressed).toString(),
        },
        body: compressed,
    });

    const public_url = new URL(
        `/cdn/s3/${key}`,
        new URL(req.headers.get('referer') ?? '').origin
    );

    if (s3res.status === 200) {
        await surreal.merge(target, {
            [intent]: public_url,
        });

        return NextResponse.json({
            success: true,
            url: public_url,
        });
    } else {
        return NextResponse.json(
            { success: false, error: 'internal_error' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    const { decoded: token } = extractUserTokenFromRequest(req);
    if (!token)
        return NextResponse.json(
            { success: false, error: 'not_authenticated' },
            { status: 403 }
        );

    const body = await req.json();
    const intent = (() => {
        const unvalidated = body.intent;
        const parsed = Intent.safeParse(unvalidated);
        if (parsed.success) return parsed.data;
    })();

    if (!intent)
        return NextResponse.json(
            { success: false, error: 'missing_intent' },
            { status: 400 }
        );

    const target = token.ID;

    await surreal.merge(target, {
        [intent]: null,
    });

    return NextResponse.json({
        success: true,
    });
}
