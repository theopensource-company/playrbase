import dynamic from 'next/dynamic';
import React from 'react';
const App = dynamic(() => import('../manager/App'), { ssr: false });

const ManagerPage = () => {
    return <App />;
};

ManagerPage.hideNavbar = true;
export default ManagerPage;
