import { AwsClient } from 'aws4fetch';
import formidable from 'formidable';
import { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
import { Writable } from 'stream';
import { Surreal } from 'surrealdb.js';

export const config = {
    api: {
        bodyParser: false,
    },
};

const sizes = {
    profile_picture: 512,
    logo: 1024,
    banner: 2048,
};

const fileConsumer = <T = unknown>(acc: T[]) => {
    const writable = new Writable({
        write: (chunk, _enc, next) => {
            acc.push(chunk);
            next();
        },
    });

    return writable;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    res.status(501).json({ success: false, error: 'not_implemented' });

    const aws = new AwsClient({
        accessKeyId: process.env.S3_KEY_ID ?? '',
        secretAccessKey: process.env.S3_KEY_SECRET ?? '',
        service: 's3',
    });

    const surreal = new Surreal(
        process.env.NEXT_PUBLIC_SURREAL_ENDPOINT ?? '',
        {
            prepare: async (surreal) => {
                await surreal.use(
                    process.env.NEXT_PUBLIC_SURREAL_NAMESPACE ?? '',
                    process.env.NEXT_PUBLIC_SURREAL_DATABASE ?? ''
                );

                await surreal.signin({
                    user: process.env.SURREAL_USER ?? '',
                    pass: process.env.SURREAL_PASS ?? '',
                });
            },
        }
    );

    const claim_token = Array.isArray(req.query.claim)
        ? req.query.claim[0] ?? ''
        : req.query.claim ?? '';

    const claim = await surreal.query<[[ImageClaim]]>(
        `SELECT * FROM claim WHERE claim_token = $claim_token`,
        { claim_token }
    );

    if (!claim?.[0]?.result?.[0]) return;
    const { target, type } = claim[0].result[0];

    const chunks: never[] = [];
    await new Promise((resolve, reject) => {
        const form = new formidable.IncomingForm({
            fileWriteStreamHandler: () => fileConsumer(chunks),
        });

        form.parse(req, (err, fields, files) => {
            if (err) reject({ err });
            resolve({ fields, files });
        });
    });

    const file = await sharp(Buffer.concat(chunks))
        .resize({ width: sizes[type], withoutEnlargement: true })
        .webp({ lossless: true })
        .toBuffer();
    const hash = file.toString('base64').slice(0, 50).replaceAll('/', '_');

    const base = process.env.S3_BUCKET;
    const key = `${hash}.webp`;
    const s3res = await aws.fetch(`${base}/${key}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'image/webp',
        },
        body: file,
    });

    const public_url = new URL(
        `/cdn/s3/${key}`,
        new URL(req.headers.referer ?? '').origin
    );

    if (s3res.status === 200) {
        await surreal.change(target, {
            [type]: public_url,
        });

        res.status(200).json({
            success: true,
            url: public_url,
        });
    } else {
        res.status(500).json({ success: false, error: 'internal_error' });
    }
}

type ImageClaim = {
    id: string;
    claim_token: string;
    by: string;
    target: string;
    type: keyof typeof sizes;
};
