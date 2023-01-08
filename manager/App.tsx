import * as React from 'react';
import Fetcher from './Fetcher';
import { Admin } from 'react-admin';
import authProvider from './Auth';
import { OrganisationResource } from './resources/Organisation';
import { ManagerResource } from './resources/Manager';

const App = () => (
    <Admin dataProvider={Fetcher()} authProvider={authProvider}>
        {OrganisationResource}
        {ManagerResource}
    </Admin>
);

export default App;
