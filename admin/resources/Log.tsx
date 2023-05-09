import { Article } from '@mui/icons-material';
import React from 'react';
import { Datagrid, DateField, List, Resource, TextField } from 'react-admin';
import { JsonField } from 'react-admin-json-view';

export const LogList = () => (
    <List sort={{ field: 'created', order: 'DESC' }}>
        <Datagrid>
            <TextField source="id" />
            <TextField source="record" />
            <TextField source="event" />
            <TextField source="change.field" title="Field" />
            <TextField source="change.value.before" title="Before" />
            <TextField source="change.value.after" title="After" />
            <JsonField
                source="details"
                reactJsonOptions={{
                    // Props passed to react-json-view
                    name: null,
                    collapsed: true,
                    enableClipboard: false,
                    displayDataTypes: false,
                }}
            />
            <DateField source="created" />
        </Datagrid>
    </List>
);

export const LogResource = (
    <Resource name="log" icon={Article} list={LogList} />
);
