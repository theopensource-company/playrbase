import { EventEditor, useEventEditor } from '@/components/data/events/editor';
import UploadImage from '@/components/logic/UploadImage';
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
        <div className="space-y-16">
            <EventEditor {...eventEditor} />
            <UploadImage
                intent="logo"
                actor={event as unknown as Actor}
                title="Upload Logo"
                description="Upload Logo"
            />
            <UploadImage
                intent="banner"
                actor={event as unknown as Actor}
                title="Upload Banner"
                description="Upload banner"
            />
        </div>
    );
}
