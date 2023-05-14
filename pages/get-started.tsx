import React from 'react';
import Button from '../components/form/Button';
import Input from '../components/form/Input';
import Container from '../components/helper/Container';

export default function Home() {
    return (
        <div className="mx-24 flex flex-grow flex-col items-center justify-end">
            <Container className="mt-12 w-full flex-grow rounded-t-3xl bg-noise-modal py-24">
                <form className="flex h-full w-full flex-col items-center gap-20">
                    <h1 className="py-12 text-5xl">Get Started</h1>
                    <div className="flex w-full max-w-3xl flex-col gap-8">
                        <Input placeholder="Name of organisation" />
                        <Input type="email" placeholder="Email address" />
                    </div>
                    <Button color="blue" className="mt-8">
                        Confirm my Email
                    </Button>
                </form>
            </Container>
        </div>
    );
}
