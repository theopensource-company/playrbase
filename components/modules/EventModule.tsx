import Image from 'next/image';
import React from 'react';
import { Event } from '../../shared/types/EventTypes';
import styles from '../../styles/components/Modules/Event.module.scss';

export const EventModule = ({
    event,
    variant = 'small',
}: {
    event: Event;
    variant?: 'smaller' | 'small' | 'large';
}) => {
    return (
        <div className={`${styles.default} ${styles[`variant-${variant}`]}`}>
            <div className={styles.top}>
                <div className={styles.bannerFrame}>
                    <Image src={event.banner ?? ''} alt={``} />
                </div>
            </div>
            <div className={styles.bottom}>
                <div className={styles.logoFrame}>
                    <Image src={event.logo ?? '/LogoSmall.png'} fill alt={``} />
                </div>
                <div className={styles.info}>
                    <span className={styles.title}>{event.title}</span>
                    <span className={styles.attendees}>
                        {event.attendeeCount} attendees
                    </span>
                </div>
            </div>
        </div>
    );
};
