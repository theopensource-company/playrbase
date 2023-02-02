import React from 'react';
import Button from '../components/form/Button';
import { useEvents } from '../hooks/Queries/Event';
import stylesPublic from '../styles/pages/PublicLanding.module.scss';

export default function Home() {
    const { data } = useEvents({
        organiser: 'organisation:4ti2kk3jrekwbvvi2575',
    });

    console.log(data);

    return (
        <div className={stylesPublic.default}>
            <div className="text">
                <h1>
                    Play with <span>ease</span>
                </h1>
                <h2>
                    Create <span>joy</span> that <span>lasts</span>
                </h2>
                <h2>Time to ditch the sheets 📚</h2>
            </div>
            <div>
                <Button disabled>Releasing soon</Button>
            </div>
        </div>
    );
}
