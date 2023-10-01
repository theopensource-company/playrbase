import Container from '@/components/layout/Container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React from 'react';

export default function Home() {
    return (
        <div className="mx-24 flex flex-grow flex-col items-center justify-end">
            <Container className="bg-noise-modal mt-12 w-full flex-grow rounded-t-3xl py-24">
                <form className="flex h-full w-full flex-col items-center gap-20">
                    <h1 className="py-12 text-5xl">Get Started</h1>
                    <div className="flex w-full max-w-3xl flex-col gap-8">
                        <Input placeholder="Name of organisation" />
                        <Input type="email" placeholder="Email address" />
                    </div>
                    <Button className="mt-8" size="lg">
                        Confirm my Email
                    </Button>
                </form>
            </Container>
        </div>
    );
}
