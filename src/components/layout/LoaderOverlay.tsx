import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import React from 'react';
import Container from './Container';

export function LoaderOverlay({ show }: { show?: boolean }) {
    return (
        <Container
            className={cn(
                'fixed left-0 top-0 z-50 flex h-screen w-screen items-center justify-center bg-background transition-all',
                typeof show != 'boolean' || show
                    ? 'pointer-events-all backdrop-blur-sm'
                    : 'pointer-events-none bg-transparent opacity-0 backdrop-blur-none'
            )}
        >
            <Loader2 size={50} className="animate-spin" />
        </Container>
    );
}
