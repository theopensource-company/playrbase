import { useIsMobileState } from '@/lib/scrolled';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import React from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerPortal,
    DrawerTitle,
    DrawerTrigger,
} from '../ui/drawer';
import { Separator } from '../ui/separator';

export function DD(props: Parameters<typeof Dialog>[0]) {
    const isMobile = useIsMobileState();
    if (isMobile) return <Drawer shouldScaleBackground {...props} />;
    return <Dialog {...props} />;
}

export function DDPortal(props: Parameters<typeof DialogPortal>[0]) {
    const isMobile = useIsMobileState();
    if (isMobile) return <DrawerPortal {...props} />;
    return <DialogPortal {...props} />;
}

export function DDOverlay(props: Parameters<typeof DialogOverlay>[0]) {
    const isMobile = useIsMobileState();
    if (isMobile) return <DrawerOverlay {...props} />;
    return <DialogOverlay {...props} />;
}

export function DDTrigger(props: Parameters<typeof DialogTrigger>[0]) {
    const isMobile = useIsMobileState();
    if (isMobile) return <DrawerTrigger {...props} />;
    return <DialogTrigger {...props} />;
}

export function DDClose(props: Parameters<typeof DialogClose>[0]) {
    const isMobile = useIsMobileState();
    if (isMobile) return <DrawerClose {...props} />;
    return <DialogClose {...props} />;
}

export function DDContent({
    children,
    className,
    ...props
}: Parameters<typeof DrawerContent>[0]) {
    const isMobile = useIsMobileState();
    if (isMobile)
        return (
            <DrawerContent
                {...props}
                className={cn('will-change-transform', className)}
            >
                <div className="mx-8 mb-6 mt-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
                    {children}
                </div>
            </DrawerContent>
        );

    return (
        <DialogContent
            className={cn(
                'max-h-[95vh] overflow-y-auto will-change-transform',
                className
            )}
            {...props}
        >
            {children}
        </DialogContent>
    );
}

export function DDHeader(props: Parameters<typeof DialogHeader>[0]) {
    const isMobile = useIsMobileState();
    if (isMobile) return <DrawerHeader {...props} />;
    return <DialogHeader {...props} />;
}

export function DDFooter({
    children,
    className,
    closeText,
    closeDisabled,
    ...props
}: Parameters<typeof DialogFooter>[0] & {
    closeText?: string;
    closeDisabled?: boolean;
}) {
    const t = useTranslations('components.ui-custom.dd.footer');
    const isMobile = useIsMobileState();
    if (isMobile)
        return (
            <DrawerFooter
                className={cn('flex flex-col gap-8 p-0 pt-8', className)}
            >
                <Separator orientation="horizontal" />
                <div className="flex flex-col gap-4">
                    {children}
                    <DrawerClose className="pt-2" disabled={closeDisabled}>
                        {closeText ?? t('button-close')}
                    </DrawerClose>
                </div>
            </DrawerFooter>
        );
    return (
        <DialogFooter className={cn('pt-3', className)} {...props}>
            {children}
        </DialogFooter>
    );
}

export function DDTitle(props: Parameters<typeof DialogTitle>[0]) {
    const isMobile = useIsMobileState();
    if (isMobile) return <DrawerTitle {...props} />;
    return <DialogTitle {...props} />;
}

export function DDDescription(props: Parameters<typeof DialogDescription>[0]) {
    const isMobile = useIsMobileState();
    if (isMobile) return <DrawerDescription {...props} />;
    return <DialogDescription {...props} />;
}
