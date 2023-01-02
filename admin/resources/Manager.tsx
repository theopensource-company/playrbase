import React, { useState } from 'react';
import {
    List,
    Datagrid,
    TextField,
    EmailField,
    Resource,
    DateField,
    Edit,
    SimpleForm,
    TextInput,
    Show,
    TabbedShowLayout,
    Tab,
    useRecordContext,
    Create,
    ListContextProvider,
    useGetManyReference,
    useList,
    Pagination,
    EditButton,
} from 'react-admin';
import { TableHead, TableRow, TableCell } from '@mui/material';

export const ManagerList = () => (
    <List sort={{ field: 'created', order: 'DESC' }}>
        <Datagrid rowClick="show">
            <TextField source="id" />
            <TextField source="name" />
            <EmailField source="email" />
            <DateField source="created" />
            <DateField source="updated" />
            <EditButton />
        </Datagrid>
    </List>
);

const ManagerTitle = () => {
    const ctx = useRecordContext();
    return <>{ctx ? `Manager: ${ctx.name}` : 'Loading'}</>;
};

export const ShowManager = () => {
    return (
        <Show title={<ManagerTitle />}>
            <TabbedShowLayout>
                <Tab label="details">
                    <TextField source="id" />
                    <TextField source="name" />
                    <EmailField source="email" />
                    <DateField source="created" />
                    <DateField source="updated" />
                </Tab>
                <Tab label="logs">
                    <ShowManagerLogs />
                </Tab>
            </TabbedShowLayout>
        </Show>
    );
};

export const ShowManagerLogs = () => {
    const ctx = useRecordContext();
    const [perPage, setPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const logs = useGetManyReference('log', {
        target: 'field',
        id: ctx.id,
        pagination: { page, perPage },
        sort: { field: 'created', order: 'DESC' },
    });

    const Header = () => (
        <TableHead>
            <TableRow>
                <TableCell />
                <TableCell>Id</TableCell>
                <TableCell>Event</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
            </TableRow>
        </TableHead>
    );

    return (
        <ListContextProvider value={useList(logs)}>
            <Datagrid isRowSelectable={() => false} header={<Header />}>
                <TextField source="id" />
                <TextField source="event" />
                <TextField source="from" />
                <TextField source="to" />
            </Datagrid>
            <Pagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                perPage={perPage}
                setPerPage={setPerPage}
                page={page}
                setPage={setPage}
                total={logs.total}
            />
        </ListContextProvider>
    );
};

export const EditManager = () => (
    <Edit title={<ManagerTitle />}>
        <SimpleForm>
            <TextInput disabled source="id" />
            <TextInput source="name" />
            <TextInput source="email" type="email" />
            <TextInput source="password" type="password" label="New password" />
        </SimpleForm>
    </Edit>
);

export const CreateManager = () => (
    <Create>
        <SimpleForm>
            <TextInput source="name" />
            <TextInput source="email" type="email" />
            <TextInput source="password" type="password" label="Password" />
        </SimpleForm>
    </Create>
);

export const ManagerResource = (
    <Resource
        name="manager"
        list={ManagerList}
        edit={EditManager}
        show={ShowManager}
        create={CreateManager}
        recordRepresentation={(record) => `${record.name} (${record.email})`}
    />
);
