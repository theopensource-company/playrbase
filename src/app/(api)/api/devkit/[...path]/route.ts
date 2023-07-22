import { Deployed, Environment } from '@/config/Environment';
import { handler as not_found } from '../../route';

function handler(req: Request, { params }: { params: { path: string } }) {
    if (Deployed || Environment !== 'dev') return not_found();

    const path = Array.isArray(params.path)
        ? params.path.join('/')
        : params.path ?? '';

    const oldUrl = new URL(req.url);
    const url = new URL(`http://127.0.0.1:13004/${path}${oldUrl.search}`);

    return fetch(url, req);
}

export {
    handler as DELETE,
    handler as GET,
    handler as HEAD,
    handler as OPTIONS,
    handler as PATCH,
    handler as POST,
    handler as PUT,
};
