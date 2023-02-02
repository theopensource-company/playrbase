import Link, { LinkProps } from 'next/link';
import React, { ForwardedRef, forwardRef, ReactNode } from 'react';
import { ButtonColor, ButtonSize, buttonStyle } from './Button';

const LinkButton = forwardRef(
    (
        {
            className,
            color,
            size,
            ...props
        }: LinkProps & {
            children?: ReactNode;
            className?: string;
            color?: Exclude<ButtonColor, 'disabled'>;
            size?: ButtonSize;
            disabled?: boolean;
        },
        ref: ForwardedRef<HTMLAnchorElement>
    ) => {
        return (
            <Link
                {...props}
                ref={ref}
                className={`${buttonStyle({ color, size })} ${className ?? ''}`}
            />
        );
    }
);

LinkButton.displayName = 'LinkButton';
export default LinkButton;
