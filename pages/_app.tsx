import React from 'react';
import '../styles/global.scss';
import type { AppProps } from 'next/app';
import { Navbar } from '../components/layout/navbar';
import { I18nextProvider } from 'react-i18next';
import { InitializeSurreal } from '../hooks/Surreal';
import { FeatureFlagContext, FeatureFlagProvider } from '../hooks/Environment';
import { i18n } from '../locales';
import { DevButton } from '../components/DevButton';
import { TFeatureFlagOptions, TFeatureFlags } from '../constants/Types';
import { NextPage } from 'next';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <I18nextProvider i18n={i18n}>
            <InitializeSurreal>
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
            </InitializeSurreal>
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
