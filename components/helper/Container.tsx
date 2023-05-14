import React, { ReactNode } from 'react';

export default function Container({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            className={['mx-auto w-full max-w-screen-2xl px-24', className]
                .filter((a) => !!a)
                .join(' ')}
        >
            {children}
        </div>
    );
}
