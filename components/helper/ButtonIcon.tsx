import { cva } from 'class-variance-authority';
import React, { ReactNode } from 'react';
import { ButtonSize } from '../form/Button';

export const buttonIconStyle = cva(['flex', 'items-center', 'justify-center'], {
    variants: {
        size: {
            small: ['w-4', 'h-4'],
            normal: ['w-6', 'w-6'],
        },
    },
    defaultVariants: {
        size: 'normal',
    },
});

export function ButtonIcon({
    size,
    icon,
}: {
    size?: ButtonSize;
    icon?: ReactNode;
}) {
    if (!icon) return null;
    return <div className={buttonIconStyle({ size })}>{icon}</div>;
}
