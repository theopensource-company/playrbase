import dynamic from 'next/dynamic';
import React from 'react';
import '../admin/Surreal';
const App = dynamic(() => import('../admin/App'), { ssr: false });

const AdminPage = () => {
    return <App />;
};

AdminPage.hideNavbar = true;
export default AdminPage;
