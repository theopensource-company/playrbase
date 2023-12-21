import dayjs, { Dayjs } from 'dayjs';
import * as React from 'react';
import { SelectSingleEventHandler } from 'react-day-picker';
import { Calendar } from './calendar';
import { Input } from './input';
import { Label } from './label';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

interface DateTimePickerProps {
    date?: Date;
    setDate: (date: Date) => void;
}

export function DateTimePickerField({ date, setDate }: DateTimePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={'outline'}
                    className={cn(
                        'flex pl-3 text-left font-normal gap-12 w-full',
                        !date && 'text-muted-foreground'
                    )}
                >
                    {date ? (
                        dayjs(date).format('LL - HH:mm')
                    ) : (
                        <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <DateTimePicker date={date} setDate={setDate} />
            </PopoverContent>
        </Popover>
    );
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
    const [selectedDateTime, setSelectedDateTime] = React.useState<Dayjs>(
        dayjs(date)
    );

    const handleDateChange: SelectSingleEventHandler = (_, selected) => {
        const processed = dayjs(selected)
            .set('hours', selectedDateTime.hour() ?? 0)
            .set('minutes', selectedDateTime.minute() ?? 0);

        setSelectedDateTime(processed);
        setDate(processed.toDate());
    };

    const handleTimeChange: React.ChangeEventHandler<HTMLInputElement> = ({
        target: { value },
    }) => {
        const [hours, minutes] = value.split(':').map(Number);
        const processed = dayjs(selectedDateTime)
            .set('hours', hours)
            .set('minutes', minutes);

        setSelectedDateTime(processed);
        setDate(processed.toDate());
    };

    return (
        <div>
            <Calendar
                mode="single"
                selected={selectedDateTime.toDate()}
                onSelect={handleDateChange}
                initialFocus
            />
            {!date ? (
                <p className="p-4 pt-0 text-sm">Please pick a day.</p>
            ) : (
                <div className="space-y-2 p-4 pt-0">
                    <Label>Choose a time</Label>
                    <Input
                        type="time"
                        onChange={handleTimeChange}
                        value={selectedDateTime.format('HH:mm')}
                    />
                </div>
            )}
        </div>
    );
}
