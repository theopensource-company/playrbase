import { surreal } from '@/app/(api)/lib/surreal';
import { extractUserTokenFromRequest } from '@/app/(api)/lib/token';
import { Challenge } from '@/schema/resources/challenge';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { decoded: token } = extractUserTokenFromRequest(req);

    const [challenge] = await surreal.create<Challenge, { user?: string }>(
        'challenge',
        token
            ? {
                  user: token.ID,
              }
            : undefined
    );

    if (!challenge) {
        return NextResponse.json(
            { success: false, error: 'unknown_error' },
            { status: 400 }
        );
    } else {
        return NextResponse.json({
            success: true,
            id: challenge.id,
            challenge: challenge.challenge,
        });
    }
}
