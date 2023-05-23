import React from 'react';
import Button from '../components/form/Button';
import LinkButton from '../components/form/LinkButton';
import Container from '../components/helper/Container';
import { featureFlags } from '../lib/Environment';

export default function Home() {
    return (
        <Container className="flex flex-grow flex-col justify-center gap-10 pb-48 text-5xl text-white">
            <div className="flex flex-col gap-7">
                <h1>
                    Play with <span className="text-blue-500">ease</span>
                </h1>
                <h2>
                    Create <span className="text-blue-500">joy</span> that{' '}
                    <span className="text-blue-500">lasts</span>
                </h2>
                <h2>Time to ditch the sheets 📚</h2>
            </div>
            <div>
                {featureFlags.preLaunchPage ? (
                    <Button disabled>Releasing soon</Button>
                ) : (
                    <LinkButton href="/get-started">Get started</LinkButton>
                )}
            </div>
        </Container>
    );
}
