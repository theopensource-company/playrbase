import React, {DetailedHTMLProps, ButtonHTMLAttributes} from 'react';
import styles from '../styles/components/Button.module.scss';

export const Button = ({
    className,
    ...props
}: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
    return (
        <button className={`${styles.default} ${className ?? ""}`} {...props} />
    )
}