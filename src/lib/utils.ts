import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export async function promiseTimeout<T = unknown>(
    promise: Promise<T>,
    timeout: number
) {
    const timeoutPromise = new Promise((r) => setTimeout(r, timeout));
    const [result] = await Promise.allSettled([promise, timeoutPromise]);
    return result;
}
