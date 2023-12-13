import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DateTimePicker } from '@/components/ui/datetime';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateEvent } from '@/lib/Queries/Event';
import { cn, promiseTimeout } from '@/lib/utils';
import { Event } from '@/schema/resources/event';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { CalendarIcon, Loader2 } from 'lucide-react';
import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const Schema = Event.pick({
    name: true,
    description: true,
    start: true,
    end: true,
    discoverable: true,
    published: true,
});

type Schema = z.infer<typeof Schema>;

export function EventSettingsTab({
    event,
    refetch,
}: {
    event: Event;
    refetch: () => unknown;
}) {
    const { mutateAsync } = useUpdateEvent(event.id);

    const form = useForm<Schema>({
        resolver: zodResolver(Schema),
        defaultValues: event,
    });

    const onSubmit = useCallback(
        async (payload: Schema) => {
            return promiseTimeout(
                mutateAsync(payload).then(() => refetch()),
                250
            );
        },
        [mutateAsync, refetch]
    );

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-grow flex-col gap-8 pt-6"
            >
                <div className="grid gap-8 max-sm:max-w-xl md:grid-cols-2 md:gap-12">
                    <div className="flex flex-col gap-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} autoComplete="off" />
                                    </FormControl>
                                    <FormDescription>
                                        The name of the event that will be shown
                                        throughout Playrbase
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} rows={6} />
                                    </FormControl>
                                    <FormDescription>
                                        The description of the event that will
                                        be shown throughout Playrbase
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="discoverable"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Discoverable</FormLabel>
                                        <FormDescription>
                                            Is this event is publicly listed
                                            throughout Playrbase
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="published"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Published</FormLabel>
                                        <FormDescription>
                                            Is this event is published for
                                            non-organisational members
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex flex-col gap-8">
                        <FormField
                            control={form.control}
                            name="start"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex w-[240px] items-center justify-between gap-2">
                                        <FormLabel>Start</FormLabel>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                            type="button"
                                            onClick={() => {
                                                field.onChange(undefined);
                                                form.setValue(
                                                    'start',
                                                    undefined
                                                );
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={'outline'}
                                                    className={cn(
                                                        'flex w-[240px] pl-3 text-left font-normal',
                                                        !field.value &&
                                                            'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value ? (
                                                        dayjs(
                                                            field.value
                                                        ).format('LL - HH:mm')
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                        >
                                            <DateTimePicker
                                                date={field.value}
                                                setDate={field.onChange}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        The ending date of this event that will
                                        be shown in public listings
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="end"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex w-[240px] items-center justify-between gap-2">
                                        <FormLabel>End</FormLabel>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                            type="button"
                                            onClick={() =>
                                                form.setValue('end', undefined)
                                            }
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={'outline'}
                                                    className={cn(
                                                        'flex w-[240px] pl-3 text-left font-normal',
                                                        !field.value &&
                                                            'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value ? (
                                                        dayjs(
                                                            field.value
                                                        ).format('LL - HH:mm')
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                        >
                                            <DateTimePicker
                                                date={field.value}
                                                setDate={field.onChange}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        The ending date of this event that will
                                        be shown in public listings
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <div>
                    <Button
                        type="submit"
                        disabled={
                            !form.formState.isValid ||
                            form.formState.isSubmitting
                        }
                    >
                        {form.formState.isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save changes
                    </Button>
                </div>
            </form>
        </Form>
    );
}
