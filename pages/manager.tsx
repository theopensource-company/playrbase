import dynamic from 'next/dynamic';
import React from 'react';
import { Seo } from '../components/layout/Seo';
const App = dynamic(() => import('../manager/App'), { ssr: false });

const ManagerPage = () => {
    return (
        <Seo robots="noindex, nofollow">
            <App />
        </Seo>
    );
};

ManagerPage.hideNavbar = true;
export default ManagerPage;
