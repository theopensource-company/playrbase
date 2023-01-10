import React from 'react';
import dynamic from 'next/dynamic';
import { InitializeSurrealManager } from '../manager/Surreal';
const App = dynamic(() => import('../manager/App'), { ssr: false });

const ManagerPage = () => {
    return (
        <InitializeSurrealManager>
            <App />
        </InitializeSurrealManager>
    );
};

ManagerPage.hideNavbar = true;
export default ManagerPage;
