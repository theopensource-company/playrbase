import * as React from 'react';
import Fetcher from './Fetcher';
import { Admin } from 'react-admin';
import authProvider from './Auth';
import { OrganisationResource } from './resources/Organisation';
import { EventResource } from './resources/Event';

const App = () => (
    <Admin dataProvider={Fetcher()} authProvider={authProvider}>
        {OrganisationResource}
        {EventResource}
    </Admin>
);

export default App;
