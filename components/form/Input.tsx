import { cva } from 'class-variance-authority';
import React, {
    DetailedHTMLProps,
    ForwardedRef,
    forwardRef,
    InputHTMLAttributes,
} from 'react';

export const inputStyle = cva(
    [
        'text-white',
        'border-none',
        'outline-none',
        'transition-all',
        'duration-100',
    ],
    {
        variants: {
            color: {
                default: [
                    'bg-zinc-700',
                    'hover:bg-zinc-600',
                    'focus:bg-zinc-600',
                    'shadow-sm',
                    'hover:shadow-2xl',
                    'focus:shadow-2xl',
                ],
                disabled: [
                    'bg-neutral-700',
                    'text-zinc-400',
                    'cursor-not-allowed',
                ],
            },
            size: {
                small: ['px-4', 'py-2', 'rounded-md', 'text-md'],
                normal: ['px-6', 'py-3', 'rounded-md', 'text-lg'],
            },
        },
        defaultVariants: {
            color: 'default',
            size: 'normal',
        },
    }
);

export type InputColor = Exclude<
    Exclude<Parameters<typeof inputStyle>[0], undefined>['color'],
    null | undefined
>;
export type InputSize = Exclude<
    Exclude<Parameters<typeof inputStyle>[0], undefined>['size'],
    null | undefined
>;

const Input = forwardRef(
    (
        {
            className,
            color,
            size,
            disabled,
            ...props
        }: DetailedHTMLProps<
            InputHTMLAttributes<HTMLInputElement>,
            HTMLInputElement
        > & {
            color?: Exclude<InputColor, 'disabled'>;
            size?: InputSize;
        },
        ref: ForwardedRef<HTMLInputElement>
    ) => {
        return (
            <>
                <input
                    className={`${inputStyle({
                        color: disabled ? 'disabled' : color,
                        size,
                    })} ${className ?? ''}`}
                    {...props}
                    disabled={disabled}
                    ref={ref}
                />
            </>
        );
    }
);

Input.displayName = 'Input';
export default Input;
