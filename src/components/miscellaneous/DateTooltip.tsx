import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';

dayjs.extend(duration);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export function DateTooltip({ date }: { date: Date }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    {dayjs.duration(dayjs(date).diff()).humanize(true)}
                </TooltipTrigger>
                <TooltipContent>
                    <i>{dayjs(date).format('LLLL')}</i>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
