import { type NextRequest } from 'next/server';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: NextRequest) {
    const base = process.env.S3_BUCKET;
    const path = req.nextUrl.searchParams.getAll('path');
    const key = Array.isArray(path) ? path.join('/') : path ?? '';
    return fetch(`${base}/${key}`);
}
