import Link from 'next/link';
import React from 'react';
import Container from '../../components/helper/Container';

export function getStaticProps() {
    return {
        props: {
            notFound: process.env.NODE_ENV === 'production',
        },
    };
}

export default function DevLayout({
    children,
    home,
}: {
    children: React.ReactNode;
    home?: boolean;
}) {
    return (
        <Container className="py-8 text-white">
            {home ? (
                <Link
                    href="/"
                    className="text-xl font-semibold hover:underline"
                >
                    back to home
                </Link>
            ) : (
                <Link
                    href="/dev"
                    className="text-xl font-semibold hover:underline"
                >
                    back to devtools
                </Link>
            )}
            <br />
            <br />
            {children}
        </Container>
    );
}
