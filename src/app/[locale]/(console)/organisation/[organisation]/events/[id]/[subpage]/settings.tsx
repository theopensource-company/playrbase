import { Avatar } from '@/components/cards/avatar';
import { Banner } from '@/components/cards/banner';
import { ProfileName } from '@/components/cards/profile';
import { EventEditor, useEventEditor } from '@/components/data/events/editor';
import UploadImage from '@/components/logic/UploadImage';
import { DD, DDContent, DDFooter, DDTrigger } from '@/components/ui-custom/dd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateEvent } from '@/lib/Queries/Event';
import { useSurreal } from '@/lib/Surreal';
import { promiseTimeout } from '@/lib/utils';
import { useRouter } from '@/locales/navigation';
import { Actor } from '@/schema/resources/actor';
import { Event } from '@/schema/resources/event';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertOctagon, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export function EventSettingsTab({
    event,
    refetch,
}: {
    event: Event;
    refetch: () => unknown;
}) {
    const { mutateAsync } = useUpdateEvent(event.id);
    const onSubmit = useCallback(
        async (payload: Partial<Event>) => {
            const prom = promiseTimeout(
                mutateAsync(payload).then(() => refetch()),
                250
            );

            toast.promise(prom, {
                loading: 'Saving event',
                success: 'Saved event',
                error: (e) =>
                    `Failed to save event: ${'message' in e ? e.message : e}`,
            });

            return prom;
        },
        [mutateAsync, refetch]
    );

    const eventEditor = useEventEditor({
        defaultValues: event,
        onSubmit: onSubmit,
    });

    return (
        <div className="flex flex-grow flex-col justify-between gap-16">
            <div className="pt-8 md:space-y-8">
                <div className="relative w-full">
                    <Banner
                        profile={event}
                        className="absolute z-0 aspect-auto h-full w-full rounded-xl"
                    />
                    <div className="relative z-[1] flex w-full flex-wrap items-center justify-between gap-8 bg-gradient-to-t from-black to-transparent p-6 pb-8 pt-36">
                        <div className="flex flex-wrap items-center gap-4">
                            <Avatar
                                profile={event}
                                renderBadge={false}
                                className="h-10 w-10 md:h-14 md:w-14"
                            />
                            <h1 className="text-xl font-semibold md:text-2xl">
                                <ProfileName profile={event} />
                            </h1>
                        </div>
                        <div className="flex gap-4">
                            <UploadImage
                                intent="logo"
                                actor={event as unknown as Actor}
                                title="Upload Logo"
                                description="Upload Logo"
                                triggerRefresh={refetch}
                                trigger={
                                    <Button
                                        variant="ghost"
                                        className="bg-white/10 backdrop-blur-lg hover:bg-white/20"
                                    >
                                        Change logo
                                    </Button>
                                }
                            />
                            <UploadImage
                                intent="banner"
                                actor={event as unknown as Actor}
                                title="Upload Banner"
                                description="Upload banner"
                                triggerRefresh={refetch}
                                trigger={
                                    <Button
                                        variant="ghost"
                                        className="bg-white/10 backdrop-blur-lg hover:bg-white/20"
                                    >
                                        Change banner
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                </div>
                <EventEditor {...eventEditor} />
            </div>
            <DangerZone event={event} />
        </div>
    );
}

function DangerZone({ event }: { event: Event }) {
    const surreal = useSurreal();
    const router = useRouter();
    const params = useParams();
    const organisation = Array.isArray(params.organisation)
        ? params.organisation[0]
        : params.organisation;

    const Schema = z.object({
        name: z.literal(event.name),
    });

    type Schema = z.infer<typeof Schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitting },
    } = useForm<Schema>({
        resolver: zodResolver(Schema),
    });

    const handler = handleSubmit(async () => {
        await surreal.query(/* surql */ `DELETE $id`, { id: event.id });
        router.push(`/organisation/${organisation}/events`);
    });

    return (
        <div className="flex w-full flex-col gap-6 rounded-lg border border-red-600 border-opacity-40 p-6">
            <div className="space-y-2">
                <h2 className="text-xl font-bold">Delete event</h2>
                <p>
                    Deleting this event will <b>permanently</b> delete all
                    registrations and information about this event.
                </p>
            </div>
            <div className="flex items-center gap-4">
                <DD>
                    <DDTrigger asChild>
                        <Button
                            variant="destructive"
                            className="opacity-70 transition-all hover:opacity-100"
                        >
                            <AlertOctagon className="mr-2 h-4 w-4" />
                            Delete event
                        </Button>
                    </DDTrigger>
                    <DDContent>
                        <form onSubmit={handler}>
                            <h2 className="mb-4 text-2xl font-bold">
                                Delete event
                            </h2>
                            <p>
                                Deleting this event will <b>permanently</b>{' '}
                                delete all registrations and information about
                                this event.
                            </p>

                            <div className="mb-5 mt-3 space-y-5">
                                <div className="space-y-3">
                                    <Label htmlFor="name_delete">
                                        <b>Repeat:</b>{' '}
                                        <i className="select-none">
                                            {event.name}
                                        </i>
                                    </Label>
                                    <Input
                                        id="name_delete"
                                        autoFocus
                                        autoComplete="off"
                                        {...register('name')}
                                    />
                                </div>
                            </div>

                            <DDFooter>
                                <Button
                                    variant="destructive"
                                    disabled={!isValid}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <AlertOctagon className="mr-2 h-4 w-4" />
                                    )}
                                    Permanently delete this event
                                </Button>
                                {errors?.root && (
                                    <p className="text-red-600">
                                        {errors.root.message}
                                    </p>
                                )}
                            </DDFooter>
                        </form>
                    </DDContent>
                </DD>
            </div>
        </div>
    );
}
