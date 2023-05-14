import React from 'react';
import Button from '../components/form/Button';
import Container from '../components/helper/Container';

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
                <Button disabled>Releasing soon</Button>
            </div>
        </Container>
    );
}
