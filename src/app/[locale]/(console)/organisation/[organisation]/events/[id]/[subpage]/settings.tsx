import { EventEditor, useEventEditor } from '@/components/data/events/editor';
import { useUpdateEvent } from '@/lib/Queries/Event';
import { promiseTimeout } from '@/lib/utils';
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

    return <EventEditor {...eventEditor} />;
}
