import { Users } from 'lucide-react';
import React from 'react';

export function TinyTeamName({ name }: { name: string }) {
    return (
        <p className="flex items-center gap-1.5 pb-2 text-sm opacity-50">
            <Users className="h-4 w-4" />
            {name}
        </p>
    );
}
