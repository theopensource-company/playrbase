import React from 'react';
import LinkButton from '../components/form/LinkButton';
import Container from '../components/helper/Container';
import { Seo } from '../components/layout/Seo';

export default function FourOhFour() {
    return (
        <Seo title="Page not found">
            <Container className="flex flex-grow flex-col justify-center gap-10 pb-48 text-5xl text-white">
                <div className="flex flex-col gap-7">
                    <h1>
                        Oh no, <span className="text-blue-500">404</span>
                    </h1>
                    <h2>This page could not be found 🔍</h2>
                </div>
                <div>
                    <LinkButton href="/">Go back to the home page</LinkButton>
                </div>
            </Container>
        </Seo>
    );
}
