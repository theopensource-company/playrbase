import React, { useState } from 'react';
import Input from '../components/form/Input';
import Container from '../components/helper/Container';
import { EventModule } from '../components/modules/EventModule';
import { TEventRecord } from '../constants/Types/Events.types';

export default function StorybookAlternative() {
    const [name, setName] = useState('Test Event');
    const [attendeeCount, setAttendeeCount] = useState(0);

    return (
        <Container className="flex flex-grow gap-12 pb-24">
            <div className="flex flex-col items-center justify-center gap-6 rounded-lg bg-zinc-800 p-8">
                <h3 className="w-full text-lg font-semibold text-white">
                    Module options
                </h3>
                <Input
                    name="name"
                    value={name}
                    type="text"
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    name="attendeeCount"
                    value={attendeeCount}
                    type="number"
                    disabled
                    onChange={(e) =>
                        setAttendeeCount(e.target.value as unknown as number)
                    }
                />
            </div>
            <div className="grid w-full grid-rows-6 gap-4 xl:grid-cols-2">
                <EventModule
                    event={
                        {
                            name: name,
                        } as TEventRecord
                    }
                />
                <EventModule
                    event={
                        {
                            name: name,
                        } as TEventRecord
                    }
                />
                <EventModule
                    event={
                        {
                            name: name,
                        } as TEventRecord
                    }
                />
                <EventModule
                    event={
                        {
                            name: name,
                        } as TEventRecord
                    }
                />
                <EventModule
                    event={
                        {
                            name: name,
                        } as TEventRecord
                    }
                />
            </div>
        </Container>
    );
}
