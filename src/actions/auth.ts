'use server';

import { cookies } from 'next/headers';

export async function token() {
    return cookies().get('playrbase-token')?.value;
}

export async function signout() {
    return cookies().delete('playrbase-token');
}
