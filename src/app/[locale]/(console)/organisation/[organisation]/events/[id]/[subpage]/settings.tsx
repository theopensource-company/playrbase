import { Avatar } from '@/components/cards/avatar';
import { Banner } from '@/components/cards/banner';
import { ProfileName } from '@/components/cards/profile';
import { EventEditor, useEventEditor } from '@/components/data/events/editor';
import UploadImage from '@/components/logic/UploadImage';
import { Button } from '@/components/ui/button';
import { useUpdateEvent } from '@/lib/Queries/Event';
import { promiseTimeout } from '@/lib/utils';
import { Actor } from '@/schema/resources/actor';
import { Event } from '@/schema/resources/event';
import React, { useCallback } from 'react';

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
            return promiseTimeout(
                mutateAsync(payload).then(() => refetch()),
                250
            );
        },
        [mutateAsync, refetch]
    );

    const eventEditor = useEventEditor({
        defaultValues: event,
        onSubmit: onSubmit,
    });

    return (
        <div className="space-y-8 pt-8">
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
    );
}
