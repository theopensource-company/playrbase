import React from 'react';
import { Admin } from 'react-admin';
import authProvider from './Auth';
import Fetcher from './Fetcher';
import { EventResource } from './resources/Event';
import { OrganisationResource } from './resources/Organisation';

const App = () => (
    <Admin dataProvider={Fetcher()} authProvider={authProvider}>
        {OrganisationResource}
        {EventResource}
    </Admin>
);

export default App;
