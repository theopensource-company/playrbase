import React from 'react';
import { Button } from '../components/Button';
import stylesPublic from '../styles/pages/PublicLanding.module.scss';

export default function Home() {
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
