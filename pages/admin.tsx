import dynamic from 'next/dynamic';
import React from 'react';
import '../admin/Surreal';
import { Seo } from '../components/layout/Seo';
const App = dynamic(() => import('../admin/App'), { ssr: false });

const AdminPage = () => {
    return (
        <Seo robots="noindex, nofollow">
            <App />
        </Seo>
    );
};

AdminPage.hideNavbar = true;
export default AdminPage;
