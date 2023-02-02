import React, { useState } from 'react';
import {
    List,
    Datagrid,
    TextField,
    EmailField,
    Resource,
    DateField,
    Edit,
    TextInput,
    Show,
    TabbedShowLayout,
    Tab,
    ShowButton,
    useRecordContext,
    Create,
    ListContextProvider,
    useGetManyReference,
    useList,
    Pagination,
    RichTextField,
    ArrayInput,
    SimpleFormIterator,
    SelectInput,
    ReferenceInput,
    TabbedForm,
    FormTab,
    ReferenceField,
    FunctionField,
    EditButton,
} from 'react-admin';
import { RichTextInput } from 'ra-input-rich-text';
import { TableHead, TableRow, TableCell } from '@mui/material';
import {
    OrganisationManagerRoles,
    TOrganisationManagerRoles,
    TOrganisationRecord,
} from '../../constants/Types/Organisation.types';
import { TLogRecord } from '../../constants/Types/Log.types';

export const OrganisationList = () => (
    <List sort={{ field: 'created', order: 'DESC' }}>
        <Datagrid rowClick="show">
            <TextField source="id" />
            <TextField source="name" />
            <EmailField source="email" />
            <TextField source="website" />
            <FunctionField
                label="Managers"
                render={({ manager_roles }: TOrganisationRecord) =>
                    manager_roles.length
                }
            />
            <DateField source="created" />
            <DateField source="updated" />
            <EditButton />
        </Datagrid>
    </List>
);

const OrganisationTitle = () => {
    const ctx = useRecordContext<TOrganisationRecord>();
    return <>{ctx ? `Organisation: ${ctx.name}` : 'Loading'}</>;
};

export const ShowOrganisation = () => {
    return (
        <Show title={<OrganisationTitle />}>
            <TabbedShowLayout>
                <Tab label="details">
                    <TextField source="id" />
                    <TextField source="name" />
                    <RichTextField source="description" />
                    <TextField source="website" />
                    <EmailField source="email" />
                    <DateField source="created" />
                    <DateField source="updated" />
                </Tab>
                <Tab label="logs">
                    <ShowOrganisationLogs />
                </Tab>
                <Tab label="managers">
                    <ShowOrganisationManagers />
                </Tab>
            </TabbedShowLayout>
        </Show>
    );
};

export const ShowOrganisationLogs = () => {
    const ctx = useRecordContext();
    const [perPage, setPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const logs = useGetManyReference<TLogRecord>('log', {
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

export const ShowOrganisationManagers = () => {
    const ctx = useRecordContext<TOrganisationRecord>();
    const Header = () => (
        <TableHead>
            <TableRow>
                <TableCell />
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
            </TableRow>
        </TableHead>
    );

    return (
        <ListContextProvider
            value={useList({
                data: ctx.manager_roles,
            })}
        >
            <Datagrid isRowSelectable={() => false} header={<Header />}>
                <ReferenceField source="id" reference="manager" link={false}>
                    <TextField source="name" />
                </ReferenceField>
                <ReferenceField source="id" reference="manager" link={false}>
                    <TextField source="email" />
                </ReferenceField>
                <FunctionField
                    render={({ role }: { role: TOrganisationManagerRoles }) =>
                        OrganisationManagerRoles[role]
                    }
                />
                <ReferenceField source="id" reference="manager" link="show">
                    <ShowButton />
                </ReferenceField>
            </Datagrid>
        </ListContextProvider>
    );
};

export const ManageOrganisationManagers = () => (
    <ArrayInput source="manager_roles">
        <SimpleFormIterator inline>
            <ReferenceInput
                source="id"
                reference="manager"
                queryOptions={{
                    meta: {
                        fields: ['id', 'name', 'email'],
                    },
                }}
            />
            <SelectInput
                source="role"
                choices={Object.keys(OrganisationManagerRoles).map((id) => ({
                    id,
                    name: OrganisationManagerRoles[
                        id as TOrganisationManagerRoles
                    ],
                }))}
            />
        </SimpleFormIterator>
    </ArrayInput>
);

export const EditOrganisation = () => (
    <Edit title={<OrganisationTitle />}>
        <TabbedForm>
            <FormTab label="Basic">
                <TextInput disabled source="id" />
                <TextInput source="name" />
                <TextInput source="email" type="email" />
            </FormTab>
            <FormTab label="Managers">
                <ManageOrganisationManagers />
            </FormTab>
        </TabbedForm>
    </Edit>
);

export const CreateOrganisation = () => (
    <Create>
        <TabbedForm>
            <FormTab label="Basic">
                <TextInput source="name" />
                <TextInput source="email" type="email" />
                <TextInput source="website" />
                <RichTextInput source="description" />
            </FormTab>
            <FormTab label="Managers">
                <ManageOrganisationManagers />
            </FormTab>
        </TabbedForm>
    </Create>
);

export const OrganisationResource = (
    <Resource
        name="organisation"
        list={OrganisationList}
        edit={EditOrganisation}
        show={ShowOrganisation}
        create={CreateOrganisation}
        recordRepresentation={(record) => `${record.name} (${record.email})`}
    />
);
