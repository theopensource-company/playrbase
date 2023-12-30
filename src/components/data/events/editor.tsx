import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DateTimePickerField } from '@/components/ui/datetime';
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
import { Textarea } from '@/components/ui/textarea';
import { Event } from '@/schema/resources/event';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';

export const EventEditorSchema = Event.pick({
    name: true,
    description: true,
    start: true,
    end: true,
    discoverable: true,
    published: true,
    options: true,
});

export type EventEditorSchema = z.infer<typeof EventEditorSchema>;

export function useEventEditor({
    defaultValues,
    onSubmit,
}: {
    defaultValues: Partial<Event>;
    onSubmit: (payload: EventEditorSchema) => Promise<unknown>;
}) {
    const form = useForm<EventEditorSchema>({
        resolver: zodResolver(EventEditorSchema),
        defaultValues,
    });

    return { form, onSubmit };
}

export function EventEditor({
    form,
    onSubmit,
}: {
    form: UseFormReturn<EventEditorSchema>;
    onSubmit: (payload: EventEditorSchema) => Promise<unknown>;
}) {
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
                                    <FormDescription>
                                        The name of the event that will be shown
                                        throughout Playrbase
                                    </FormDescription>
                                    <FormControl>
                                        <Input {...field} autoComplete="off" />
                                    </FormControl>
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
                                    <FormDescription>
                                        The description of the event that will
                                        be shown throughout Playrbase
                                    </FormDescription>
                                    <FormControl>
                                        <Textarea {...field} rows={6} />
                                    </FormControl>
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
                        <FormField
                            control={form.control}
                            name="options.manual_approval"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Manual approval</FormLabel>
                                        <FormDescription>
                                            Members who signup for this event
                                            need to be manually approved
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex flex-col gap-8">
                        <h3 className="text-lg font-bold">Optional settings</h3>
                        <div className="rounded-md border p-4">
                            <FormLabel>Event duration</FormLabel>
                            <FormDescription>
                                When does this event start and end
                            </FormDescription>
                            <div className="mt-4 flex gap-6">
                                <FormField
                                    control={form.control}
                                    name="start"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <FormLabel>Start</FormLabel>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    type="button"
                                                    onClick={() => {
                                                        field.onChange(
                                                            undefined
                                                        );
                                                        form.setValue(
                                                            'start',
                                                            undefined
                                                        );
                                                    }}
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                            <DateTimePickerField
                                                date={field.value}
                                                setDate={field.onChange}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="end"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <FormLabel>End</FormLabel>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    type="button"
                                                    onClick={() =>
                                                        form.setValue(
                                                            'end',
                                                            undefined
                                                        )
                                                    }
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                            <DateTimePickerField
                                                date={field.value}
                                                setDate={field.onChange}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="rounded-md border p-4">
                            <FormLabel>Number of players</FormLabel>
                            <FormDescription>
                                Controls the minimum and maximum amount of
                                players per signup
                            </FormDescription>
                            <div className="mt-4 flex gap-6">
                                <FormField
                                    control={form.control}
                                    name="options.min_pool_size"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <FormLabel>Minimum</FormLabel>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    type="button"
                                                    onClick={() => {
                                                        field.onChange(
                                                            undefined
                                                        );
                                                        form.setValue(
                                                            'options.min_pool_size',
                                                            undefined
                                                        );
                                                    }}
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min="1"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="options.max_pool_size"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <FormLabel>Maximum</FormLabel>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    type="button"
                                                    onClick={() => {
                                                        field.onChange(
                                                            undefined
                                                        );
                                                        form.setValue(
                                                            'options.max_pool_size',
                                                            undefined
                                                        );
                                                    }}
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min="1"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="rounded-md border p-4">
                            <FormLabel>Player age</FormLabel>
                            <FormDescription>
                                Controls the minimum and maximum age that
                                players need to be to join the event
                            </FormDescription>
                            <div className="mt-4 flex gap-6">
                                <FormField
                                    control={form.control}
                                    name="options.min_age"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <FormLabel>Minimum</FormLabel>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    type="button"
                                                    onClick={() => {
                                                        field.onChange(
                                                            undefined
                                                        );
                                                        form.setValue(
                                                            'options.min_age',
                                                            undefined
                                                        );
                                                    }}
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min="1"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="options.max_age"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <FormLabel>Maximum</FormLabel>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    type="button"
                                                    onClick={() => {
                                                        field.onChange(
                                                            undefined
                                                        );
                                                        form.setValue(
                                                            'options.max_age',
                                                            undefined
                                                        );
                                                    }}
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min="1"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
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
