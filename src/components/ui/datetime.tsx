import dayjs, { Dayjs } from 'dayjs';
import * as React from 'react';
import { SelectSingleEventHandler } from 'react-day-picker';
import { Calendar } from './calendar';
import { Input } from './input';
import { Label } from './label';

interface DateTimePickerProps {
    date?: Date;
    setDate: (date: Date) => void;
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
                <p className='text-sm p-4 pt-0'>Please pick a day.</p>
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
