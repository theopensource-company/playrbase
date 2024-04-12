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

export function DateTooltip({
    date,
    forceTime,
}: {
    date: Date;
    forceTime?: boolean;
}) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                    <span>
                        {date.getTime() > new Date().getTime()
                            ? dayjs(date).format(forceTime ? 'lll' : 'll')
                            : dayjs.duration(dayjs(date).diff()).humanize(true)}
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <i>{dayjs(date).format('LLLL')}</i>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
