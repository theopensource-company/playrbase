import React from 'react';
import '../styles/global.scss';
import type { AppProps } from 'next/app';
import { Navbar } from '../components/layout/navbar';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <div className='base'>
            <Navbar />
            <div className="app-container">
                <Component {...pageProps} />
            </div>
        </div>
    );
}
