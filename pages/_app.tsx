import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextPage } from 'next';
import type { AppProps } from 'next/app';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { DevButton } from '../components/DevButton';
import { Navbar } from '../components/layout/navbar';
import {
    TFeatureFlagOptions,
    TFeatureFlags,
} from '../constants/Types/FeatureFlags.types';
import { FeatureFlagContext, FeatureFlagProvider } from '../hooks/Environment';
import { i18n } from '../locales';
import '../styles/global.scss';
import '../styles/tailwind.css';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
    return (
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={queryClient}>
                <FeatureFlagProvider>
                    <FeatureFlagContext.Consumer>
                        {(fflags) => (
                            <div className="base">
                                <DevButton />
                                {willShowNavbar({ Component, fflags }) && (
                                    <Navbar />
                                )}
                                <div className="app-container">
                                    <Component {...pageProps} />
                                </div>
                            </div>
                        )}
                    </FeatureFlagContext.Consumer>
                </FeatureFlagProvider>
            </QueryClientProvider>
        </I18nextProvider>
    );
}

export type PageComponent = NextPage & {
    hideNavbar?:
        | boolean
        | `withFeatureFlag:${TFeatureFlagOptions}`
        | `withoutFeatureFlag:${TFeatureFlagOptions}`;
};

const willShowNavbar = ({
    Component,
    fflags,
}: {
    Component: PageComponent;
    fflags: TFeatureFlags;
}) => {
    if (Component.hideNavbar === undefined) return true;
    if (typeof Component.hideNavbar === 'boolean') return !Component.hideNavbar;

    if (Component.hideNavbar.startsWith('withFeatureFlag:'))
        return !fflags[
            Component.hideNavbar.split(':')[1] as TFeatureFlagOptions
        ];

    return fflags[Component.hideNavbar.split(':')[1] as TFeatureFlagOptions];
};
