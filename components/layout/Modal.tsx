import { cva } from 'class-variance-authority';
import React from 'react';
import { default as ReactModal } from 'react-modal';

export const modalStyle = cva(['bg-zinc-800', 'outline-none', 'text-white'], {
    variants: {
        size: {
            '96': 'w-96 h-96',
            '1/2': 'w-1/2 h-1/2',
            unset: '',
        },
    },
    defaultVariants: {
        size: '96',
    },
    compoundVariants: [
        {
            size: ['96', '1/2'],
            className: 'min-w-min min-h-min',
        },
    ],
});

export const modalOverlayStyle = cva([
    'bg-black',
    'bg-opacity-20',
    'fixed',
    'w-screen',
    'h-screen',
    'top-0',
    'left-0',
    'flex',
    'justify-center',
    'items-center',
]);

export type ModalSize = Exclude<
    Exclude<Parameters<typeof modalStyle>[0], undefined>['size'],
    null | undefined
>;

export function Modal({
    className,
    overlayClassName,
    modalSize,
    ...props
}: ReactModal.Props & {
    modalSize?: ModalSize;
}) {
    overlayClassName = modalOverlayStyle({ className: overlayClassName });
    className = modalStyle({
        size: modalSize,
        className,
    });

    return <ReactModal {...{ className, overlayClassName, ...props }} />;
}
