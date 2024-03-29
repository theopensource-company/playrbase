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
import { useTranslations } from 'next-intl';
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

export const EventEditorSchemaNoUndefined = Event.extend({
    start: z.union([z.date(), z.literal('')]),
    end: z.union([z.date(), z.literal('')]),
    options: Event.shape.options.extend({
        min_age: z.union([z.coerce.number(), z.literal('')]),
        max_age: z.union([z.coerce.number(), z.literal('')]),
        min_pool_size: z.union([z.coerce.number(), z.literal('')]),
        max_pool_size: z.union([z.coerce.number(), z.literal('')]),
    }),
});

export type EventEditorSchemaNoUndefined = z.infer<
    typeof EventEditorSchemaNoUndefined
>;

export function useEventEditor({
    defaultValues,
    onSubmit,
}: {
    defaultValues: Partial<Event>;
    onSubmit: (payload: EventEditorSchema) => Promise<unknown>;
}) {
    const form = useForm<EventEditorSchemaNoUndefined>({
        resolver: zodResolver(EventEditorSchemaNoUndefined),
        defaultValues: {
            ...defaultValues,
            start: defaultValues.start ?? '',
            end: defaultValues.end ?? '',
            options: {
                ...(defaultValues.options ?? {}),
                min_age: defaultValues.options?.min_age ?? '',
                max_age: defaultValues.options?.max_age ?? '',
                min_pool_size: defaultValues.options?.min_pool_size ?? '',
                max_pool_size: defaultValues.options?.max_pool_size ?? '',
            },
        },
    });

    return { form, onSubmit };
}

export function EventEditor({
    form,
    onSubmit,
}: {
    form: UseFormReturn<EventEditorSchemaNoUndefined>;
    onSubmit: (payload: EventEditorSchema) => Promise<unknown>;
}) {
    const t = useTranslations('components.data.events.editor');
    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit((changes) => {
                    onSubmit({
                        ...changes,
                        start: changes.start || undefined,
                        end: changes.end || undefined,
                        options: {
                            ...(changes.options ?? {}),
                            min_age: changes.options?.min_age || undefined,
                            max_age: changes.options?.max_age || undefined,
                            min_pool_size:
                                changes.options?.min_pool_size || undefined,
                            max_pool_size:
                                changes.options?.max_pool_size || undefined,
                        },
                    });
                })}
                className="flex flex-grow flex-col gap-8 pt-6"
            >
                <div className="grid gap-8 max-sm:max-w-xl md:grid-cols-2 md:gap-12">
                    <div className="flex flex-col gap-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('fields.name.label')}
                                    </FormLabel>
                                    <FormDescription>
                                        {t('fields.name.description')}
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
                                    <FormLabel>
                                        {t('fields.description.label')}
                                    </FormLabel>
                                    <FormDescription>
                                        {t('fields.description.description')}
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
                                        <FormLabel>
                                            {t('fields.discoverable.label')}
                                        </FormLabel>
                                        <FormDescription>
                                            {t(
                                                'fields.discoverable.description'
                                            )}
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
                                        <FormLabel>
                                            {t('fields.published.label')}
                                        </FormLabel>
                                        <FormDescription>
                                            {t('fields.published.description')}
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
                                        <FormLabel>
                                            {t('fields.manual-approval.label')}
                                        </FormLabel>
                                        <FormDescription>
                                            {t(
                                                'fields.manual-approval.description'
                                            )}
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex flex-col gap-8">
                        <h3 className="text-lg font-bold">
                            {t('fields.__category.optional-settings')}
                        </h3>
                        <div className="rounded-md border p-4">
                            <FormLabel>{t('fields.duration.label')}</FormLabel>
                            <FormDescription>
                                {t('fields.duration.description')}
                            </FormDescription>
                            <div className="mt-4 flex gap-6">
                                <FormField
                                    control={form.control}
                                    name="start"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <FormLabel>
                                                    {t(
                                                        'fields.duration.fields.start.label'
                                                    )}
                                                </FormLabel>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    type="button"
                                                    onClick={() => {
                                                        field.onChange('');
                                                        form.setValue(
                                                            'start',
                                                            ''
                                                        );
                                                    }}
                                                >
                                                    {t(
                                                        'fields.duration.fields.start.clear'
                                                    )}
                                                </Button>
                                            </div>
                                            <DateTimePickerField
                                                date={field.value || undefined}
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
                                                <FormLabel>
                                                    {t(
                                                        'fields.duration.fields.end.label'
                                                    )}
                                                </FormLabel>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    type="button"
                                                    onClick={() =>
                                                        form.setValue('end', '')
                                                    }
                                                >
                                                    {t(
                                                        'fields.duration.fields.end.clear'
                                                    )}
                                                </Button>
                                            </div>
                                            <DateTimePickerField
                                                date={field.value || undefined}
                                                setDate={field.onChange}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="rounded-md border p-4">
                            <FormLabel>
                                {t('fields.player-count.label')}
                            </FormLabel>
                            <FormDescription>
                                {t('fields.player-count.description')}
                            </FormDescription>
                            <div className="mt-4 flex gap-6">
                                <FormField
                                    control={form.control}
                                    name="options.min_pool_size"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <FormLabel>
                                                    {t(
                                                        'fields.player-count.fields.minimum.label'
                                                    )}
                                                </FormLabel>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    type="button"
                                                    onClick={() => {
                                                        field.onChange('');
                                                        form.setValue(
                                                            'options.min_pool_size',
                                                            ''
                                                        );
                                                    }}
                                                >
                                                    {t(
                                                        'fields.player-count.fields.minimum.clear'
                                                    )}
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
                                                <FormLabel>
                                                    {t(
                                                        'fields.player-count.fields.maximum.label'
                                                    )}
                                                </FormLabel>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    type="button"
                                                    onClick={() => {
                                                        field.onChange('');
                                                        form.setValue(
                                                            'options.max_pool_size',
                                                            ''
                                                        );
                                                    }}
                                                >
                                                    {t(
                                                        'fields.player-count.fields.maximum.clear'
                                                    )}
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
                            <FormLabel>
                                {t('fields.player-age.label')}
                            </FormLabel>
                            <FormDescription>
                                {t('fields.player-age.description')}
                            </FormDescription>
                            <div className="mt-4 flex gap-6">
                                <FormField
                                    control={form.control}
                                    name="options.min_age"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <FormLabel>
                                                    {t(
                                                        'fields.player-age.fields.minimum.label'
                                                    )}
                                                </FormLabel>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    type="button"
                                                    onClick={() => {
                                                        field.onChange('');
                                                        form.setValue(
                                                            'options.min_age',
                                                            ''
                                                        );
                                                    }}
                                                >
                                                    {t(
                                                        'fields.player-age.fields.minimum.clear'
                                                    )}
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
                                                <FormLabel>
                                                    {t(
                                                        'fields.player-age.fields.maximum.label'
                                                    )}
                                                </FormLabel>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 p-2 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                    type="button"
                                                    onClick={() => {
                                                        field.onChange('');
                                                        form.setValue(
                                                            'options.max_age',
                                                            ''
                                                        );
                                                    }}
                                                >
                                                    {t(
                                                        'fields.player-age.fields.maximum.clear'
                                                    )}
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
                        {t('button.save')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
