import { NextResponse } from 'next/server';

export function handler() {
    return NextResponse.json(
        {
            success: false,
            error: 'not_found',
        },
        { status: 404 }
    );
}
