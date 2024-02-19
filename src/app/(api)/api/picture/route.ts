import { Intent, intentProperties } from '@/lib/image';
import { record } from '@/lib/zod';
import { Event } from '@/schema/resources/event';
import { Organisation } from '@/schema/resources/organisation';
import { s3 } from '@api/lib/s3';
import { surreal } from '@api/lib/surreal';
import { extractUserTokenFromRequest } from '@api/lib/token';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Blob, File } from 'buffer';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

async function findValidTarget({
    intent,
    target,
    user,
}: {
    intent: Intent;
    target?: string;
    user: string;
}) {
    if (!target) {
        if (intent == 'profile_picture') return user;
    } else {
        if (target.startsWith('organisation:')) {
            if (!['logo', 'banner'].includes(intent as string)) return;
            const [res] = await surreal.query<[Organisation | null]>(
                /* surrealql */ `
                    SELECT id FROM ONLY type::thing('organisation', $target) WHERE type::thing('user', $user) IN managers[?role IN ['owner', 'administrator']].user;
                `,
                { target, user }
            );

            return res?.id;
        }

        if (target.startsWith('event:')) {
            if (!['logo', 'banner'].includes(intent as string)) return;
            const [res] = await surreal.query<[Event | null]>(
                /* surrealql */ `
                    SELECT id FROM ONLY type::thing('event', $target) WHERE type::thing('user', $user) IN organiser.managers[?role IN ['owner', 'administrator', 'event_manager']].user;
                `,
                { target, user }
            );

            return res?.id;
        }

        if (target.startsWith('team:')) {
            if (!['logo', 'banner'].includes(intent as string)) return;
            const [res] = await surreal.query<[Organisation | null]>(
                /* surrealql */ `
                    SELECT id FROM ONLY type::thing('team', $target) WHERE type::thing('user', $user) IN players
                `,
                { target, user }
            );

            return res?.id;
        }
    }
}

export async function PUT(req: NextRequest) {
    const { decoded: token } = extractUserTokenFromRequest(req);
    if (!token) {
        return NextResponse.json(
            { success: false, error: 'not_authenticated' },
            { status: 403 }
        );
    }

    const formData = await req.formData();
    const intent = (() => {
        const unvalidated = formData.get('intent');
        const parsed = Intent.safeParse(unvalidated);
        if (parsed.success) return parsed.data;
    })();

    if (!intent) {
        return NextResponse.json(
            { success: false, error: 'missing_intent' },
            { status: 400 }
        );
    }

    const target = await findValidTarget({
        intent,
        target: record()
            .optional()
            .parse(formData.get('target') ?? undefined),
        user: token.ID,
    });
    if (!target) {
        return NextResponse.json(
            { success: false, error: 'invalid_target' },
            { status: 400 }
        );
    }

    const file = formData.get('file');
    if (!(file instanceof Blob || file instanceof File)) {
        return NextResponse.json(
            { success: false, error: 'file_not_a_file' },
            { status: 400 }
        );
    }

    const compressed = await sharp(await file.arrayBuffer())
        .resize({
            width: intentProperties[intent].width,
            height: intentProperties[intent].height,
            withoutEnlargement: true,
            fit: 'cover',
        })
        .webp({ lossless: true })
        .toBuffer();
    const hash = compressed
        .toString('base64')
        .slice(0, 50)
        .replaceAll('/', '_');

    const key = `${hash}.webp`;
    const s3res = await s3
        .send(
            new PutObjectCommand({
                Key: key,
                Body: compressed,
                Bucket: process.env.S3_BUCKET,
            })
        )
        .catch(() => false);

    const public_url = new URL(
        `/cdn/s3/${key}`,
        new URL(
            process.env.PLAYRBASE_ENV_ORIGIN ?? req.headers.get('referer') ?? ''
        ).origin
    );

    if (s3res) {
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
    if (!token) {
        return NextResponse.json(
            { success: false, error: 'not_authenticated' },
            { status: 403 }
        );
    }

    const body = await req.json();
    const intent = (() => {
        const unvalidated = body.intent;
        const parsed = Intent.safeParse(unvalidated);
        if (parsed.success) return parsed.data;
    })();

    if (!intent) {
        return NextResponse.json(
            { success: false, error: 'missing_intent' },
            { status: 400 }
        );
    }

    const target = await findValidTarget({
        intent,
        target: record()
            .optional()
            .parse(body.target ?? undefined),
        user: token.ID,
    });
    if (!target) {
        return NextResponse.json(
            { success: false, error: 'invalid_target' },
            { status: 400 }
        );
    }

    await surreal.query(
        /* surrealql */ `
        UPDATE type::thing($target) MERGE {
            "${intent}": NONE
        }
    `,
        { target }
    );

    return NextResponse.json({
        success: true,
    });
}
