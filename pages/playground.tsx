import React, { useState } from 'react';
import { Input } from '../components/Input';
import { EventModule } from '../components/modules/EventModule';
import styles from '../styles/pages/Playground.module.scss';

export default function StorybookAlternative() {
    const [title, setTitle] = useState('Test Event');
    const [attendeeCount, setAttendeeCount] = useState(0);

    return (
        <div className={styles.default}>
            <div className={styles.variables}>
                <Input
                    name="title"
                    value={title}
                    type="text"
                    onChange={(e) => setTitle(e.target.value)}
                />
                <Input
                    name="attendeeCount"
                    value={attendeeCount}
                    type="number"
                    onChange={(e) =>
                        setAttendeeCount(e.target.value as unknown as number)
                    }
                />
            </div>
            <div className={styles.result}>
                <div className={styles.column}>
                    <EventModule
                        event={{
                            url: 'test',
                            title: title,
                            attendeeCount: attendeeCount,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
