import Link, { LinkProps } from 'next/link';
import React, { ForwardedRef, forwardRef, ReactNode } from 'react';
import { ButtonIcon } from '../helper/ButtonIcon';
import { ButtonColor, ButtonSize, buttonStyle } from './Button';

const LinkButton = forwardRef(
    (
        {
            className,
            color,
            size,
            children,
            icon,
            ...props
        }: LinkProps & {
            children?: ReactNode;
            className?: string;
            color?: Exclude<ButtonColor, 'disabled'>;
            size?: ButtonSize;
            disabled?: boolean;
            icon?: ReactNode;
        },
        ref: ForwardedRef<HTMLAnchorElement>
    ) => {
        return (
            <Link
                {...props}
                ref={ref}
                className={`${buttonStyle({ color, size })} ${className ?? ''}`}
            >
                <ButtonIcon icon={icon} size={size} />
                {children}
            </Link>
        );
    }
);

LinkButton.displayName = 'LinkButton';
export default LinkButton;
