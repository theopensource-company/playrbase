import React from 'react';
import { Admin } from 'react-admin';
import authProvider from './Auth';
import Fetcher from './Fetcher';
import { AdminResource } from './resources/Admin';
import { EnvironmentResource } from './resources/Environment';
import { EventResource } from './resources/Event';
import { LogResource } from './resources/Log';
import { ManagerResource } from './resources/Manager';
import { OrganisationResource } from './resources/Organisation';

const App = () => (
    <Admin dataProvider={Fetcher()} authProvider={authProvider}>
        {ManagerResource}
        {OrganisationResource}
        {EventResource}
        {AdminResource}
        {EnvironmentResource}
        {LogResource}
    </Admin>
);

export default App;
