import { TableCell, TableHead, TableRow } from '@mui/material';
import { RichTextInput } from 'ra-input-rich-text';
import React, { useState } from 'react';
import {
    BooleanInput,
    Create,
    Datagrid,
    DateField,
    DateTimeInput,
    Edit,
    EditButton,
    FunctionField,
    List,
    ListContextProvider,
    Pagination,
    ReferenceField,
    ReferenceInput,
    Resource,
    SelectInput,
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
import {
    EventCategories,
    TEventCategories,
} from '../../constants/Types/Events.types';

export const EventList = () => (
    <List sort={{ field: 'created', order: 'DESC' }}>
        <Datagrid rowClick="show">
            <TextField source="id" />
            <TextField source="name" />
            <FunctionField
                render={({ category }: { category: TEventCategories }) =>
                    EventCategories[category]
                }
            />
            <ReferenceField
                reference="organisation"
                source="organiser"
                link="show"
            >
                <TextField source="name" />
            </ReferenceField>
            <DateField source="start" />
            <DateField source="end" />
            <ReferenceField reference="event" source="tournament" link="show">
                <TextField source="name" />
            </ReferenceField>
            <DateField source="created" />
            <DateField source="updated" />
            <EditButton />
        </Datagrid>
    </List>
);

const EventTitle = () => {
    const ctx = useRecordContext();
    return <>{ctx ? `Event: ${ctx.name}` : 'Loading'}</>;
};

export const ShowEvent = () => {
    return (
        <Show title={<EventTitle />}>
            <TabbedShowLayout>
                <Tab label="details">
                    <TextField source="id" />
                    <TextField source="name" />
                    <TextField source="description" />
                    <TextField source="category" />
                    <ReferenceField
                        reference="organisation"
                        source="organiser"
                        link="show"
                    >
                        <TextField source="name" />
                    </ReferenceField>
                    <DateField source="start" emptyText="None" />
                    <DateField source="end" emptyText="None" />
                    <ReferenceField
                        reference="event"
                        source="tournament"
                        link="show"
                    >
                        <TextField source="name" />
                    </ReferenceField>
                    <DateField source="created" />
                    <DateField source="updated" />
                </Tab>
                <Tab label="logs">
                    <ShowEventLogs />
                </Tab>
            </TabbedShowLayout>
        </Show>
    );
};

export const ShowEventLogs = () => {
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

export const EditEvent = () => (
    <Edit title={<EventTitle />}>
        <SimpleForm>
            <TextInput disabled source="id" />
            <TextInput source="name" />
            <RichTextInput source="description" />
            <BooleanInput source="discoverable" />
            <BooleanInput source="published" />
            <ReferenceInput source="tournament" reference="event" />
            <DateTimeInput source="start" />
            <DateTimeInput source="end" />
        </SimpleForm>
    </Edit>
);

export const CreateEvent = () => (
    <Create>
        <SimpleForm>
            <TextInput source="name" />
            <TextInput
                source="description"
                multiline
                fullWidth
                helperText="Press enter to create more lines"
            />
            <SelectInput
                source="category"
                choices={Object.keys(EventCategories).map((id) => ({
                    id,
                    name: EventCategories[id as TEventCategories],
                }))}
            />
            <ReferenceInput source="organiser" reference="organisation" />
            <BooleanInput source="discoverable" defaultValue />
            <BooleanInput source="published" />
            <ReferenceInput
                source="tournament"
                reference="event"
                emptyText="Part of tournament"
            />
            <DateTimeInput source="start" />
            <DateTimeInput source="end" />
        </SimpleForm>
    </Create>
);

export const EventResource = (
    <Resource
        name="event"
        list={EventList}
        edit={EditEvent}
        show={ShowEvent}
        create={CreateEvent}
        recordRepresentation={(record) => `${record.name}`}
    />
);
