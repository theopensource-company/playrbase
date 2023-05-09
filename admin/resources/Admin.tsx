import { ManageAccountsRounded } from '@mui/icons-material';
import { TableCell, TableHead, TableRow } from '@mui/material';
import React, { useState } from 'react';
import {
    Create,
    Datagrid,
    DateField,
    Edit,
    EditButton,
    EmailField,
    List,
    ListContextProvider,
    Pagination,
    Resource,
    Show,
    SimpleForm,
    Tab,
    TabbedShowLayout,
    TextField,
    TextInput,
    useGetManyReference,
    useList,
    useRecordContext,
} from 'react-admin';

export const AdminList = () => (
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

const AdminTitle = () => {
    const ctx = useRecordContext();
    return <>{ctx ? `Admin: ${ctx.name}` : 'Loading'}</>;
};

export const ShowAdmin = () => {
    return (
        <Show title={<AdminTitle />}>
            <TabbedShowLayout>
                <Tab label="details">
                    <TextField source="id" />
                    <TextField source="name" />
                    <EmailField source="email" />
                    <DateField source="created" />
                    <DateField source="updated" />
                </Tab>
                <Tab label="logs">
                    <ShowAdminLogs />
                </Tab>
            </TabbedShowLayout>
        </Show>
    );
};

export const ShowAdminLogs = () => {
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

export const EditAdmin = () => (
    <Edit title={<AdminTitle />}>
        <SimpleForm>
            <TextInput disabled source="id" />
            <TextInput source="name" />
            <TextInput source="email" type="email" />
            <TextInput source="password" type="password" label="New password" />
        </SimpleForm>
    </Edit>
);

export const CreateAdmin = () => (
    <Create>
        <SimpleForm>
            <TextInput source="name" />
            <TextInput source="email" type="email" />
            <TextInput source="password" type="password" label="Password" />
        </SimpleForm>
    </Create>
);

export const AdminResource = (
    <Resource
        name="admin"
        icon={ManageAccountsRounded}
        list={AdminList}
        edit={EditAdmin}
        show={ShowAdmin}
        create={CreateAdmin}
    />
);
