import { Event as EventIcon } from '@mui/icons-material';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { RichTextInput } from 'ra-input-rich-text';
import React, { ReactNode, useState } from 'react';
import {
    BooleanInput,
    CloneButton,
    Create,
    CreateButton,
    Datagrid,
    DatagridConfigurable,
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
    SelectColumnsButton,
    SelectInput,
    Show,
    ShowButton,
    SimpleForm,
    SortButton,
    Tab,
    TabbedShowLayout,
    TextField,
    TextInput,
    TopToolbar,
    useGetIdentity,
    useGetManyReference,
    useGetOne,
    useList,
    useRecordContext,
} from 'react-admin';
import {
    EventCategories,
    TEventCategories,
    TEventRecord,
} from '../../constants/Types/Events.types';
import { TOrganisationRecord } from '../../constants/Types/Organisation.types';

const EventListActions = () => (
    <TopToolbar>
        <SortButton fields={['created', 'updated', 'start', 'end']} />
        <SelectColumnsButton />
        <CreateButton />
    </TopToolbar>
);

const eventListFilters = [
    <ReferenceInput
        label="Organiser"
        key="org"
        source="organiser"
        reference="organisation"
    />,
];

const CanWriteOrganisation = ({
    children,
    fallback,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) => {
    const ctx = useRecordContext<TEventRecord>();
    const { data: identity, isLoading: identityLoading } = useGetIdentity();
    const { data: organisation, isLoading: organisationLoading } =
        useGetOne<TOrganisationRecord>('organisation', { id: ctx.organiser });
    if (identityLoading || organisationLoading)
        return fallback ? <>{fallback}</> : null;
    if (
        organisation?.manager_roles.find(
            (r) => r.id == identity?.id && r.role !== 'event_viewer'
        )
    ) {
        return <>{children}</>;
    }

    return fallback ? <>{fallback}</> : null;
};

export const EventList = () => (
    <List
        sort={{ field: 'created', order: 'DESC' }}
        actions={<EventListActions />}
        filters={eventListFilters}
    >
        <DatagridConfigurable rowClick="show">
            <TextField source="id" />
            <TextField source="name" />
            <FunctionField
                label="Category"
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
            <CloneButton />
            <CanWriteOrganisation fallback={<ShowButton />}>
                <EditButton />
            </CanWriteOrganisation>
        </DatagridConfigurable>
    </List>
);

const EventTitle = () => {
    const ctx = useRecordContext();
    return <>{ctx ? `Event: ${ctx.name}` : 'Loading'}</>;
};

const ShowEventActions = () => (
    <div
        style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: '30px',
            paddingBottom: '5px',
        }}
    >
        <CanWriteOrganisation fallback={<CloneButton />}>
            <EditButton />
        </CanWriteOrganisation>
    </div>
);

export const ShowEvent = () => {
    return (
        <Show title={<EventTitle />} actions={<ShowEventActions />}>
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
        icon={EventIcon}
        list={EventList}
        edit={EditEvent}
        show={ShowEvent}
        create={CreateEvent}
        recordRepresentation={(record) => `${record.name}`}
    />
);
