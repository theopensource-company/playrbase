import * as React from 'react';
import Fetcher from './Fetcher';
import { Admin } from 'react-admin';
import authProvider from './Auth';
import { AdminResource } from './resources/Admin';
import { LogResource } from './resources/Log';
import { EnvironmentResource } from './resources/Environment';

const App = () => (
    <Admin dataProvider={Fetcher()} authProvider={authProvider}>
        {AdminResource}
        {EnvironmentResource}
        {LogResource}
    </Admin>
);

export default App;
