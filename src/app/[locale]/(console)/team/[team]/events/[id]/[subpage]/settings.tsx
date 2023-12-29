import { useUpdateEvent } from '@/lib/Queries/Event';
import { promiseTimeout } from '@/lib/utils';
import { Event } from '@/schema/resources/event';
import React, { useCallback } from 'react';
import { EventEditor } from '../../../components/event-editor';

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

    return <EventEditor defaultValues={event} onSubmit={onSubmit} />;
}
