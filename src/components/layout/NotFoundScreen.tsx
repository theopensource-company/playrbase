import { FileSearch, LucideIcon } from 'lucide-react';
import React from 'react';

export function NotFoundScreen({
    icon,
    text,
}: {
    icon?: LucideIcon;
    text?: string;
}) {
    const Icon = icon ?? FileSearch;

    return (
        <div className="flex flex-grow items-center justify-center">
            <h1 className="flex select-none items-center gap-2 text-xl font-semibold opacity-50">
                <Icon />
                {text ?? 'Resource not found'}
            </h1>
        </div>
    );
}
