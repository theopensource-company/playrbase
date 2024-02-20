import { EventCard } from '@/components/data/events/cards';
import { Event } from '@/schema/resources/event';
import React from 'react';

export function EventOverviewTab({ event }: { event: Event }) {
    return <EventCard event={event} />;
}
