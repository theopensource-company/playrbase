import { SupervisedUserCircleRounded } from '@mui/icons-material';
import React from 'react';
import {
    DateField,
    EmailField,
    Resource,
    Show,
    SimpleShowLayout,
    TextField,
    useRecordContext,
} from 'react-admin';

const ManagerTitle = () => {
    const ctx = useRecordContext();
    return <>{ctx ? `Manager: ${ctx.name}` : 'Loading'}</>;
};

export const ShowManager = () => {
    return (
        <Show title={<ManagerTitle />}>
            <SimpleShowLayout>
                <TextField source="id" />
                <TextField source="name" />
                <EmailField source="email" />
                <DateField source="created" />
                <DateField source="updated" />
            </SimpleShowLayout>
        </Show>
    );
};

export const ManagerResource = (
    <Resource
        name="manager"
        icon={SupervisedUserCircleRounded}
        show={ShowManager}
        recordRepresentation={(record) => `${record.name} (${record.email})`}
    />
);
