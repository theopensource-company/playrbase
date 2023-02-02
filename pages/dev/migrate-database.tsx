import React from 'react';
import { migrateDatabase } from '../../cli/_migratetool';
import DevLayout from './_layout';

export async function getStaticProps() {
    if (process.env.NODE_ENV == 'production')
        return {
            props: {
                notFound: true,
            },
        };

    console.log(process.cwd());

    await migrateDatabase(
        {
            SURREAL_HOST: 'http://127.0.0.1:13001',
            SURREAL_NAMESPACE: 'playrbase-deployment_local',
            SURREAL_DATABASE: 'playrbase',
            SURREAL_USERNAME: 'root',
            SURREAL_PASSWORD: 'root',
            PLAYRBASE_DEFAULT_ADMIN: JSON.stringify({
                name: 'Default admin',
                email: 'admin@playrbase.local',
                password: 'Password1!',
            }),
        },
        false,
        true,
        process.cwd()
    );

    return {
        props: {},
    };
}

export default function Page() {
    return (
        <DevLayout>
            <h1>Finished, check console for success state</h1>
        </DevLayout>
    );
}
