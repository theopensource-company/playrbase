import React from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';

export function CutTextTooltip({
    text,
    maxLength,
}: {
    text?: string;
    maxLength: number;
}) {
    const cut = (text ?? '').slice(0, maxLength - 3);

    return text && cut != text ? (
        <TooltipProvider>
            <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                    <span>{cut}...</span>
                </TooltipTrigger>
                <TooltipContent>
                    <span>{text}</span>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    ) : (
        <span>{text}</span>
    );
}
