import { Event } from '@/schema/resources/event';
import Image from 'next/image';
import React from 'react';

export const EventModule = ({ event }: { event: Event }) => {
    return (
        <div className="flex w-full flex-col rounded-lg bg-zinc-700 text-white shadow-xl">
            <div className="hidden">
                <div>
                    <Image src={event.banner ?? ''} alt={``} />
                </div>
            </div>
            <div className="flex flex-row items-start gap-10 px-8 py-6">
                <div className="aspect-square w-16 flex-none">
                    <Image
                        src={'/LogoSmall.png'}
                        width={100}
                        height={100}
                        className="h-full w-full"
                        alt={``}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <span className="w-full text-2xl">{event.name}</span>
                    <span className="text-md">10 attendees</span>
                </div>
            </div>
        </div>
    );
};
