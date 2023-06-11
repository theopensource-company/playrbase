// import { AwsClient } from 'aws4fetch';
import { NextResponse } from 'next/server';
// import sharp from 'sharp';
// import { Surreal } from 'surrealdb.js';

export const config = {
    api: {
        bodyParser: false,
    },
};

// const sizes = {
//     profile_picture: 512,
//     logo: 1024,
//     banner: 2048,
// };

export default async function PUT() {
    // req: Request,
    // { params: { claim: claim_token } }: { params: { claim: string } }
    return NextResponse.json(
        { success: false, error: 'not_implemented' },
        { status: 501 }
    );

    // const aws = new AwsClient({
    //     accessKeyId: process.env.S3_KEY_ID ?? '',
    //     secretAccessKey: process.env.S3_KEY_SECRET ?? '',
    //     service: 's3',
    // });

    // const surreal = new Surreal(
    //     process.env.NEXT_PUBLIC_SURREAL_ENDPOINT ?? '',
    //     {
    //         prepare: async (surreal) => {
    //             await surreal.use(
    //                 process.env.NEXT_PUBLIC_SURREAL_NAMESPACE ?? '',
    //                 process.env.NEXT_PUBLIC_SURREAL_DATABASE ?? ''
    //             );

    //             await surreal.signin({
    //                 user: process.env.SURREAL_USER ?? '',
    //                 pass: process.env.SURREAL_PASS ?? '',
    //             });
    //         },
    //     }
    // );

    // const claim = await surreal.query<[[ImageClaim]]>(
    //     `SELECT * FROM claim WHERE claim_token = $claim_token`,
    //     { claim_token }
    // );

    // if (!claim?.[0]?.result?.[0]) return;
    // const { target, type } = claim[0].result[0];

    // const formData = await req.formData();
    // const file = formData.get('file');

    // if (file instanceof File) {
    //     const compressed = await sharp(await file.arrayBuffer())
    //         .resize({ width: sizes[type], withoutEnlargement: true })
    //         .webp({ lossless: true })
    //         .toBuffer();
    //     const hash = compressed
    //         .toString('base64')
    //         .slice(0, 50)
    //         .replaceAll('/', '_');

    //     const base = process.env.S3_BUCKET;
    //     const key = `${hash}.webp`;
    //     const s3res = await aws.fetch(`${base}/${key}`, {
    //         method: 'PUT',
    //         headers: {
    //             'Content-Type': 'image/webp',
    //         },
    //         body: compressed,
    //     });

    //     const public_url = new URL(
    //         `/cdn/s3/${key}`,
    //         new URL(req.headers.get('referer') ?? '').origin
    //     );

    //     if (s3res.status === 200) {
    //         await surreal.change(target, {
    //             [type]: public_url,
    //         });

    //         NextResponse.json({
    //             success: true,
    //             url: public_url,
    //         });
    //     } else {
    //         NextResponse.json(
    //             { success: false, error: 'internal_error' },
    //             { status: 500 }
    //         );
    //     }
    // }
}

// type ImageClaim = {
//     id: string;
//     claim_token: string;
//     by: string;
//     target: string;
//     type: keyof typeof sizes;
// };
