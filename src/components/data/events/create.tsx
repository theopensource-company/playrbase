import { EventSelector } from '@/components/logic/EventSelector';
import { DD, DDContent, DDTrigger } from '@/components/ui-custom/dd';
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
import { useSurreal } from '@/lib/Surreal';
import { useRouter } from '@/locales/navigation';
import { Event } from '@/schema/resources/event';
import { Organisation } from '@/schema/resources/organisation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export const EventCreatorSchema = Event.pick({
    name: true,
    description: true,
    start: true,
    end: true,
    discoverable: true,
    published: true,
    options: true,
    tournament: true,
});

export type EventCreatorSchema = z.infer<typeof EventCreatorSchema>;

export const EventCreatorSchemaNoUndefined = EventCreatorSchema.extend({
    start: z.union([z.date(), z.literal('')]),
    end: z.union([z.date(), z.literal('')]),
    options: Event.shape.options.extend({
        min_age: z.union([z.coerce.number(), z.literal('')]),
        max_age: z.union([z.coerce.number(), z.literal('')]),
        min_pool_size: z.union([z.coerce.number(), z.literal('')]),
        max_pool_size: z.union([z.coerce.number(), z.literal('')]),
    }),
});

export type EventCreatorSchemaNoUndefined = z.infer<
    typeof EventCreatorSchemaNoUndefined
>;

export function useEventCreator({
    defaultValues,
    onSubmit,
}: {
    defaultValues: Partial<Event>;
    onSubmit: (payload: EventCreatorSchema) => Promise<unknown>;
}) {
    const form = useForm<EventCreatorSchemaNoUndefined>({
        resolver: zodResolver(EventCreatorSchemaNoUndefined),
        defaultValues: {
            description: '',
            discoverable: true,
            published: false,
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

export function EventCreator({
    form,
    onSubmit,
}: {
    form: UseFormReturn<EventCreatorSchemaNoUndefined>;
    onSubmit: (payload: EventCreatorSchema) => Promise<unknown>;
}) {
    const t = useTranslations('components.data.events.creator');
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
                <h2 className="text-3xl font-semibold">{t('title')}</h2>
                <div className="grid gap-8 max-sm:max-w-xl md:grid-cols-2 md:gap-12">
                    <div className="flex flex-col gap-8">
                        <h3 className="text-lg font-bold">
                            {t('fields.__category.required-settings')}
                        </h3>
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
                        <FormField
                            control={form.control}
                            name="tournament"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('fields.tournament.label')}
                                    </FormLabel>
                                    <FormDescription>
                                        {t('fields.tournament.description')}
                                    </FormDescription>
                                    <FormControl>
                                        <EventSelector
                                            event={field.value}
                                            setEvent={field.onChange}
                                            noLabel
                                            placeholder={t(
                                                'fields.tournament.placeholder'
                                            )}
                                            autoComplete="off"
                                            canManage
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                            // !form.formState.isValid ||
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

export const CreateEventSchema = Event.pick({
    name: true,
    tournament: true,
    description: true,
    discoverable: true,
    published: true,
});

export type CreateEventSchema = z.infer<typeof CreateEventSchema>;

export function useCreateEvent({
    onSubmit,
}: {
    onSubmit: (event: CreateEventSchema) => Promise<unknown>;
}) {
    const form = useForm<CreateEventSchema>({
        resolver: zodResolver(CreateEventSchema),
        defaultValues: {
            discoverable: true,
            published: false,
        },
    });

    return { form, onSubmit };
}

export function useSubmitCreateEvent({
    onSuccess,
    organiser,
}: {
    onSuccess?: () => Promise<unknown>;
    organiser: Organisation;
}) {
    const surreal = useSurreal();
    const router = useRouter();
    const t = useTranslations('components.data.events.create');

    return async function onSubmitCreateEvent({
        name,
        description,
        discoverable,
        published,
        tournament,
        start,
        end,
        options,
    }: EventCreatorSchema) {
        const result = (async () => {
            const [event] = await surreal.query<[Event]>(
                /* surql */ `
                    CREATE ONLY event CONTENT $content;
                `,
                {
                    content: {
                        name,
                        description,
                        discoverable,
                        published,
                        tournament,
                        organiser: organiser.id,
                        start,
                        end,
                        options,
                    },
                }
            );

            await onSuccess?.();
            return event;
        })();

        toast.promise(result, {
            loading: t('toast.creating-event'),
            success: t('toast.created-event'),
            error: (e) => t('errors.failed-create-event', { error: e.message }),
            action: {
                label: t('toast.buttons.view'),
                onClick: () =>
                    result.then(({ id }) =>
                        router.push(
                            `/organisation/${organiser.slug}/events/${id.slice(
                                6
                            )}/overview`
                        )
                    ),
            },
        });

        await result;
    };
}

export function RenderCreateEvent({
    form,
    onSubmit,
}: {
    form: UseFormReturn<EventCreatorSchemaNoUndefined>;
    onSubmit: (payload: EventCreatorSchema) => Promise<unknown>;
}) {
    const [open, setOpen] = useState(false);
    const t = useTranslations('components.data.events.create');

    return (
        <DD open={open} onOpenChange={setOpen}>
            <DDTrigger asChild>
                <Button>
                    {t('trigger')}
                    <Plus className="ml-2 h-6 w-6" />
                </Button>
            </DDTrigger>
            <DDContent className="max-w-6xl">
                <EventCreator form={form} onSubmit={onSubmit} />
            </DDContent>
        </DD>
    );
}

export function CreateEvent({
    onSuccess,
    organiser,
    defaultValues,
}: {
    onSuccess: () => Promise<unknown>;
    organiser: Organisation;
    defaultValues?: Partial<Event>;
}) {
    const onSubmit = useSubmitCreateEvent({ onSuccess, organiser });
    const createEvent = useEventCreator({
        onSubmit,
        defaultValues: defaultValues ?? {},
    });
    return <RenderCreateEvent {...createEvent} />;
}
