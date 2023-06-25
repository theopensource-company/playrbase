import { NextResponse } from 'next/server';

function handler() {
    return NextResponse.json(
        {
            success: false,
            error: 'not_found',
        },
        { status: 404 }
    );
}

export {
    handler as DELETE,
    handler as GET,
    handler as HEAD,
    handler as OPTIONS,
    handler as PATCH,
    handler as POST,
    handler as PUT,
    handler,
};
