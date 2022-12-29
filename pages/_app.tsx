import React from 'react';
import '../styles/global.scss';
import type { AppProps } from 'next/app';
import { Navbar } from '../components/layout/navbar';
import { I18nextProvider } from 'react-i18next';
import { InitializeSurreal } from '../hooks/Surreal';
import { FeatureFlagContext, FeatureFlagProvider } from '../hooks/Environment';
import { i18n } from '../locales';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <I18nextProvider i18n={i18n}>
            <InitializeSurreal>
                <FeatureFlagProvider>
                    <FeatureFlagContext.Consumer>
                        {() => (
                            <div className="base">
                                <Navbar />
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
