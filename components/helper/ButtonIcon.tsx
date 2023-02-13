import * as HeroIcon from '@heroicons/react/24/solid';
import { cva } from 'class-variance-authority';
import React, { ReactNode } from 'react';
import { THeroIcon } from '../../constants/Types/Common.types';
import { ButtonSize } from '../form/Button';

export const buttonIconStyle = cva([], {
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

export type ButtonIcon = ReactNode | THeroIcon;

export function ButtonIcon({
    size,
    icon,
}: {
    size?: ButtonSize;
    icon?: ButtonIcon;
}) {
    if (!icon) return null;
    console.log(HeroIcon);

    icon =
        (icon && typeof icon == 'string' && HeroIcon && icon in HeroIcon
            ? HeroIcon[icon as keyof typeof HeroIcon]({
                  className: buttonIconStyle({
                      size,
                  }),
              })
            : icon) ?? null;
    return <div className="flex items-center justify-center">{icon}</div>;
}
