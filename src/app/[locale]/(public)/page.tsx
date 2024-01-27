'use client';

import { EventCarousel } from '@/components/data/events/cards';
import { useSurreal } from '@/lib/Surreal';
import { Event } from '@/schema/resources/event';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { z } from 'zod';

export default function Home() {
    const { data: events, isLoading } = useData();

    return (
        <div className="flex flex-grow flex-col justify-center gap-10">
            <div className="space-y-10">
                <h2 className="text-4xl font-bold">New events</h2>
                <EventCarousel
                    events={events ?? []}
                    carouselControls
                    viewButton
                    loading={isLoading}
                />
            </div>
        </div>
    );
}

function useData() {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['home', 'latest-events'],
        queryFn: async () => {
            const [result] = await surreal.query<[Event[]]>(/* surql */ `
                SELECT * FROM event 
                    WHERE !tournament
                    ORDER BY created DESC 
                    LIMIT 10;
            `);

            if (!result) return null;
            return z.array(Event).parse(result);
        },
    });
}
