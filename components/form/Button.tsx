import { cva } from 'class-variance-authority';
import React, {
    ButtonHTMLAttributes,
    DetailedHTMLProps,
    ForwardedRef,
    forwardRef,
    ReactNode,
} from 'react';
import { ButtonIcon } from '../helper/ButtonIcon';

export const buttonStyle = cva(
    ['text-white', 'flex', 'items-center', 'gap-4'],
    {
        variants: {
            color: {
                blue: ['bg-blue-600'],
                red: ['bg-red-600'],
                black: ['bg-black'],
                muted: ['bg-gray-800'],
                disabled: [
                    'bg-gray-700',
                    'text-gray-400',
                    'cursor-not-allowed',
                ],
            },
            size: {
                small: ['px-4', 'py-2', 'rounded-md'],
                normal: ['px-6', 'py-2.5', 'rounded-md', 'text-lg'],
            },
        },
        defaultVariants: {
            color: 'blue',
            size: 'normal',
        },
    }
);

export type ButtonColor = Exclude<
    Exclude<Parameters<typeof buttonStyle>[0], undefined>['color'],
    null | undefined
>;
export type ButtonSize = Exclude<
    Exclude<Parameters<typeof buttonStyle>[0], undefined>['size'],
    null | undefined
>;

const Button = forwardRef(
    (
        {
            className,
            color,
            size,
            disabled,
            children,
            icon,
            ...props
        }: DetailedHTMLProps<
            ButtonHTMLAttributes<HTMLButtonElement>,
            HTMLButtonElement
        > & {
            color?: Exclude<ButtonColor, 'disabled'>;
            size?: ButtonSize;
            icon?: ReactNode;
        },
        ref: ForwardedRef<HTMLButtonElement>
    ) => {
        return (
            <button
                className={`${buttonStyle({
                    color: disabled ? 'disabled' : color,
                    size,
                })} ${className ?? ''}`}
                {...props}
                disabled={disabled}
                ref={ref}
            >
                <ButtonIcon icon={icon} size={size} />
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
export default Button;
