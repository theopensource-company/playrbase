import { StaticImageData } from "next/image";

export type Event = {
    url: string; // The URL of the event
    title: string; // The title of the event
    logo?: string | StaticImageData; // The URL or image data of the event's logo.
    banner?: string | StaticImageData; // The URL or image data of the event's banner.
    attendeeCount?: number; // The amount of attendees registered to the event.
}