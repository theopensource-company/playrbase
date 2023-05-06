import React from 'react';
import { Admin, Login } from 'react-admin';
import authProvider from './Auth';
import Fetcher from './Fetcher';
import { EventResource } from './resources/Event';
import { ManagerResource } from './resources/Manager';
import { OrganisationResource } from './resources/Organisation';

const LoginPage = () => <Login backgroundImage="/bgnoise-1080.png" />;
const App = () => (
    <Admin
        dataProvider={Fetcher()}
        authProvider={authProvider}
        loginPage={LoginPage}
    >
        {OrganisationResource}
        {EventResource}
        {ManagerResource}
    </Admin>
);

export default App;
