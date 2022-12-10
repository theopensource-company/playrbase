import React, { DetailedHTMLProps, ButtonHTMLAttributes } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/components/Button.module.scss';
import { Color } from '../constants/Colors';

export const Button = ({
    className,
    href,
    color,
    onClick,
    disabled,
    ...props
}: DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
> & {
    href?: string;
    color?: Color;
}) => {
    const router = useRouter();

    const buttonStyles = [
        styles.default,
        color ? styles[`color${color}`] : null,
        className,
    ]
        .filter((a) => !!a)
        .join(' ');

    return (
        <button
            className={buttonStyles}
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
