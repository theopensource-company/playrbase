import React, { DetailedHTMLProps, ButtonHTMLAttributes } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/components/Button.module.scss';

export const Button = ({
    className,
    href,
    onClick,
    disabled,
    ...props
}: DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
> & {
    href?: string;
}) => {
    const router = useRouter();

return (
        <button
            className={`${styles.default} ${className ?? ''}`}
            onClick={(e) => {
                if (disabled) return;
                if (href) {
                    router.push(href);
                } else {
                    onClick?.(e);
                }
            }}
            disabled={disabled}
            {...props}
        />
    );
};
