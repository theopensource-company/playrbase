import React, { DetailedHTMLProps, InputHTMLAttributes } from 'react';
import styles from '../styles/components/Input.module.scss';

export const Input = ({
    className,
    ...props
}: DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
> & {
    href?: string;
}) => {
    return (
        <input className={`${styles.default} ${className ?? ''}`} {...props} />
    );
};
