import Head from 'next/head';
import React, { ReactNode } from 'react';

export function Seo({
    title,
    description,
    robots,
    children,
}: {
    title?: string;
    description?: string;
    robots?: string;
    children: ReactNode;
}) {
    title = title
        ? `${title} - Playrbase`
        : 'Playrbase - Event and player management solution';
    description =
        description ??
        'Playrbase is an all-in-one event and player management solution. Get started for free!';

    return (
        <>
            <Head>
                <title>{title}</title>

                <link
                    rel="manifest"
                    href="/app.webmanifest"
                    type="application/manifest+json"
                />

                <meta name="application-name" content="Playrbase" />

                <link rel="apple-touch-icon" href="/images/icon_192x192.png" />

                <meta name="charset" content="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, minimum-scale=1"
                />
                <meta name="robots" content={robots ?? 'index, follow'} />

                <meta name="title" content={title} />

                <meta name="og:title" content={title} />
                <meta name="og:type" content="website" />
                <meta name="og:url" content="https://playrbase.app/" />
                <meta
                    name="og:image"
                    itemProp="image primaryImageOfPage"
                    content="https://playrbase.app/LogoSmall.png"
                />
                <meta name="og:site_name" content={title} />

                <meta name="twitter:title" content={title} />
                <meta name="twitter:card" content="summary" />

                <meta name="description" content={description} />
                <meta name="og:description" content={description} />
                <meta name="twitter:description" content={description} />
            </Head>
            {children}
        </>
    );
}
