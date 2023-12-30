import { EventSelector } from '@/components/logic/EventSelector';
import { DD, DDContent, DDFooter, DDTrigger } from '@/components/ui-custom/dd';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
    }: CreateEventSchema) {
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
                            `/organisation/${organiser.slug}/event/${id.slice(
                                6
                            )}`
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
    form: UseFormReturn<CreateEventSchema>;
    onSubmit: (event: CreateEventSchema) => Promise<unknown>;
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
            <DDContent className="max-w-2xl">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <h3 className="mb-4 text-2xl font-bold">
                            {t('title')}
                        </h3>
                        <div className="mb-3 mt-6 grid gap-8 sm:grid-cols-2 sm:gap-16">
                            <div className="space-y-8">
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
                                                <Input
                                                    {...field}
                                                    autoFocus
                                                    autoComplete="off"
                                                />
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
                                                {t(
                                                    'fields.description.description'
                                                )}
                                            </FormDescription>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    autoComplete="off"
                                                    rows={6}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="space-y-8">
                                <FormField
                                    control={form.control}
                                    name="tournament"
                                    render={({ field }) => (
                                        <EventSelector
                                            event={field.value}
                                            setEvent={field.onChange}
                                            label={t('fields.tournament.label')}
                                            placeholder={t(
                                                'fields.tournament.placeholder'
                                            )}
                                            autoComplete="off"
                                            canManage
                                        />
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
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                    {t(
                                                        'fields.discoverable.label'
                                                    )}
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
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>
                                                    {t(
                                                        'fields.published.label'
                                                    )}
                                                </FormLabel>
                                                <FormDescription>
                                                    {t(
                                                        'fields.published.description'
                                                    )}
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <DDFooter>
                            <Button disabled={!form.formState.isValid}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('submit')}
                            </Button>
                            {form.formState.errors?.root &&
                                !form.formState.isSubmitSuccessful && (
                                    <p className="text-red-600">
                                        {form.formState.errors.root.message}
                                    </p>
                                )}
                        </DDFooter>
                    </form>
                </Form>
            </DDContent>
        </DD>
    );
}

export function CreateEvent({
    onSuccess,
    organiser,
}: {
    onSuccess: () => Promise<unknown>;
    organiser: Organisation;
}) {
    const onSubmit = useSubmitCreateEvent({ onSuccess, organiser });
    const createEvent = useCreateEvent({ onSubmit });
    return <RenderCreateEvent {...createEvent} />;
}
