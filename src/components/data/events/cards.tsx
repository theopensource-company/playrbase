import { Banner } from '@/components/cards/banner';
import { DateTooltip } from '@/components/miscellaneous/DateTooltip';
import { MarkdownInline } from '@/components/miscellaneous/Markdown';
import { buttonVariants } from '@/components/ui/button';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Link } from '@/locales/navigation';
import { Event } from '@/schema/resources/event';
import { Baby, CalendarDays, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

export function EventGrid({
    events,
    viewButton,
    manageButton,
    narrow,
    loading,
}: {
    events?: Event[];
    viewButton?: boolean;
    manageButton?: boolean;
    narrow?: boolean;
    loading?: boolean;
}) {
    return (
        <div
            className={cn(
                'grid gap-6',
                narrow
                    ? 'grid-cols-1 xl:grid-cols-2'
                    : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
            )}
        >
            {loading ? (
                <EventCard
                    loading
                    viewButton={viewButton}
                    manageButton={manageButton}
                />
            ) : (
                (events ?? []).map((event) => (
                    <EventCard
                        key={event.id}
                        event={event}
                        viewButton={viewButton}
                        manageButton={manageButton}
                    />
                ))
            )}
        </div>
    );
}

export function EventCarousel({
    events,
    viewButton,
    manageButton,
    narrow,
    carouselControls,
    loading,
}: {
    events?: Event[];
    viewButton?: boolean;
    manageButton?: boolean;
    narrow?: boolean;
    carouselControls?: boolean;
    loading?: boolean;
}) {
    return (
        <Carousel>
            {carouselControls && <CarouselPrevious />}
            <CarouselContent>
                {loading ? (
                    <CarouselItem
                        className={cn(
                            narrow
                                ? 'xl:basis-1/2'
                                : 'lg:basis-1/2 xl:basis-1/3'
                        )}
                    >
                        <EventCard
                            loading
                            viewButton={viewButton}
                            manageButton={manageButton}
                        />
                    </CarouselItem>
                ) : (
                    (events ?? []).map((event) => (
                        <CarouselItem
                            key={event.id}
                            className={cn(
                                narrow
                                    ? 'xl:basis-1/2'
                                    : 'lg:basis-1/2 xl:basis-1/3'
                            )}
                        >
                            <EventCard
                                event={event}
                                viewButton={viewButton}
                                manageButton={manageButton}
                            />
                        </CarouselItem>
                    ))
                )}
            </CarouselContent>
            {carouselControls && <CarouselNext />}
        </Carousel>
    );
}

export function EventCard({
    event,
    loading,
    viewButton,
    manageButton,
}: {
    event?: Event;
    loading?: boolean;
    viewButton?: boolean;
    manageButton?: boolean;
}) {
    const t = useTranslations('components.data.events.cards.card');
    return (
        <div className="flex flex-col overflow-hidden rounded border">
            <Banner
                loading={loading}
                profile={event}
                className="aspect-auto h-40 w-full"
            />
            <div className="flex flex-grow flex-col justify-between gap-8 border-t p-6">
                <div className="flex flex-col justify-between gap-6 sm:flex-row sm:gap-8">
                    <div className="max-w-[48rem] space-y-3">
                        {loading || !event ? (
                            <>
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-10 w-48" />
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-semibold">
                                    {event.name}
                                </h2>
                                {event.description && (
                                    <p className="line-clamp-3 overflow-y-hidden text-ellipsis text-sm text-card-foreground/75">
                                        <MarkdownInline>
                                            {event.description}
                                        </MarkdownInline>
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                    {!loading && event && (
                        <div className="flex flex-wrap gap-6 whitespace-pre text-sm capitalize text-card-foreground/75 sm:flex-col sm:gap-3">
                            {event.start && (
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={16} />
                                    <DateTooltip date={event.start} />
                                </div>
                            )}
                            {(event.options.min_pool_size ||
                                event.options.max_pool_size) && (
                                <div className="flex items-center gap-2">
                                    <Users size={16} />
                                    {event.options.min_pool_size &&
                                    event.options.max_pool_size ? (
                                        event.options.min_pool_size ==
                                        event.options.max_pool_size ? (
                                            <span>
                                                {event.options.min_pool_size}
                                            </span>
                                        ) : (
                                            <span>
                                                {event.options.min_pool_size} -{' '}
                                                {event.options.max_pool_size}
                                            </span>
                                        )
                                    ) : event.options.min_pool_size ? (
                                        <span>
                                            &gt; {event.options.min_pool_size}
                                        </span>
                                    ) : (
                                        <span>
                                            &lt; {event.options.max_pool_size}
                                        </span>
                                    )}
                                </div>
                            )}
                            {(event.options.min_age ||
                                event.options.max_age) && (
                                <div className="flex items-center gap-2">
                                    <Baby size={16} />
                                    {event.options.min_age &&
                                    event.options.max_age ? (
                                        event.options.min_age ==
                                        event.options.max_age ? (
                                            <span>{event.options.min_age}</span>
                                        ) : (
                                            <span>
                                                {event.options.min_age} -{' '}
                                                {event.options.max_age}
                                            </span>
                                        )
                                    ) : event.options.min_age ? (
                                        <span>
                                            &gt; {event.options.min_age}
                                        </span>
                                    ) : (
                                        <span>
                                            &lt; {event.options.max_age}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-4">
                    {loading || !event ? (
                        <>
                            {viewButton && <Skeleton className="h-9 w-16" />}
                            {viewButton && <Skeleton className="h-9 w-20" />}
                        </>
                    ) : (
                        <>
                            {viewButton && (
                                <Link
                                    href={`/e/${event.id.slice(6)}`}
                                    className={buttonVariants({ size: 'sm' })}
                                >
                                    {t('view')}
                                </Link>
                            )}
                            {manageButton && (
                                <Link
                                    href={`/e/${event.id.slice(
                                        6
                                    )}/manage/overview`}
                                    className={buttonVariants({
                                        size: 'sm',
                                        variant: 'outline',
                                    })}
                                >
                                    {t('manage')}
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
