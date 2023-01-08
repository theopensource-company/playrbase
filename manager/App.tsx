import * as React from 'react';
import Fetcher from './Fetcher';
import { Admin } from 'react-admin';
import authProvider from './Auth';
import { OrganisationResource } from './resources/Organisation';

const App = () => (
    <Admin dataProvider={Fetcher()} authProvider={authProvider}>
        {OrganisationResource}
    </Admin>
);

export default App;
