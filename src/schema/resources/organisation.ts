import { z } from 'zod';
import { record } from '../../lib/zod.ts';

const organisation = /* surrealql */ `
    DEFINE TABLE organisation SCHEMAFULL
        PERMISSIONS
            FOR select FULL
            FOR create WHERE $scope = 'user'
            FOR update WHERE 
                $scope = 'user' && managers[WHERE role IN ["owner", "adminstrator"]].user CONTAINS $auth.id
            FOR delete WHERE 
                $scope = 'user' && managers[WHERE role IN ["owner", "adminstrator"] AND org != NONE].user CONTAINS $auth.id;

    DEFINE FIELD name               ON organisation TYPE string
        ASSERT string::len($value) > 0 && string::len($value) <= 32;
    DEFINE FIELD description        ON organisation TYPE option<string>;
    DEFINE FIELD website            ON organisation TYPE option<string>;
    DEFINE FIELD email              ON organisation TYPE string           
        ASSERT string::is::email($value);
    DEFINE FIELD type               ON organisation VALUE meta::tb(id) DEFAULT meta::tb(id);

    DEFINE FIELD logo               ON organisation TYPE option<string>
        PERMISSIONS
            FOR update WHERE $scope = 'admin';
    DEFINE FIELD banner             ON organisation TYPE option<string>
        PERMISSIONS
            FOR update WHERE $scope = 'admin';
    DEFINE FIELD slug               ON organisation TYPE string
        VALUE 
            IF tier IN ["business", "enterprise"] {
                RETURN $value;
            } ELSE {
                RETURN meta::id(id);
            }
        DEFAULT meta::id(id);

    DEFINE FIELD tier               ON organisation TYPE string
        ASSERT $value IN ["free", "basic", "business", "enterprise"]
        DEFAULT "free"
        VALUE IF $scope { $before OR 'free' } ELSE { $value }
        PERMISSIONS 
            FOR select WHERE $scope = 'user' && managers.*.user CONTAINS $auth.id
            FOR update NONE;

    -- ABOUT RECURSIVE NESTING OF ORGANISATIONS
    -- Tested it, utter limit is 16 levels of recursion which is overkill for this scenario :)
    -- There is no usecase for this, nobody will reach this limit
    -- If they do, they break their own management interface.
    -- It will still work fine for admins because they don't have a subquery in the permission clause :)

    DEFINE FIELD part_of            ON organisation TYPE option<record<organisation>>
        VALUE
            IF !$scope THEN
                $value
            ELSE IF $value && (SELECT VALUE id FROM $value WHERE managers[WHERE role IN ["owner", "adminstrator"]].user CONTAINS $auth.id)[0] THEN
                $value
            ELSE 
                $before
            END
        PERMISSIONS
            FOR update NONE;

    DEFINE FIELD managers           ON organisation
        VALUE <future> {
            -- Find all confirmed managers of this org
            LET $local = SELECT <-manages[?confirmed] AS managers FROM ONLY $parent.id;
            -- Grab the role and user ID
            LET $local = SELECT role, in AS user, id as edge FROM $local.managers;

            -- Select all managers from the org we are a part of, if any
            LET $inherited = SELECT managers FROM ONLY $parent.part_of;
            -- Add an org field describing from which org these members are inherited, if not already inherited before
            LET $inherited = SELECT *, org OR $parent.part_of AS org FROM ($inherited.managers || []);

            -- Return the combined result
            RETURN array::concat($local, $inherited);
        };
    
    DEFINE FIELD created_by         ON organisation TYPE record<user>
        DEFAULT $auth.id
        VALUE $before OR $auth.id
        PERMISSIONS FOR select NONE;

    DEFINE FIELD created            ON organisation TYPE datetime VALUE $before OR time::now()    DEFAULT time::now();
    DEFINE FIELD updated            ON organisation TYPE datetime VALUE time::now()               DEFAULT time::now()
        PERMISSIONS FOR select WHERE $scope = 'user' && managers.*.user CONTAINS $auth.id;

    DEFINE INDEX unique_slug        ON organisation FIELDS slug UNIQUE;
`;

export const Organisation = z.object({
    id: record('organisation'),
    name: z.string().min(1).max(32),
    description: z.string().optional(),
    website: z.string().url().optional(),
    email: z.string().email(),
    type: z.literal('organisation'),
    logo: z.string().optional(),
    banner: z.string().optional(),
    slug: z.string(),
    tier: z.union([
        z.literal('free'),
        z.literal('basic'),
        z.literal('business'),
        z.literal('enterprise'),
    ]),
    part_of: record('organisation').optional(),
    managers: z.array(
        z.object({
            user: record('user'),
            role: z.union([
                z.literal('owner'),
                z.literal('administrator'),
                z.literal('event_manager'),
                z.literal('event_viewer'),
            ]),
            edge: record('manages'),
            org: record('organisation').optional(),
        })
    ),
    created: z.coerce.date(),
    updated: z.coerce.date(),
});

export type Organisation = z.infer<typeof Organisation>;

export const OrganisationSafeParse = Organisation.partial({
    tier: true,
    updated: true,
});

export type OrganisationSafeParse = z.infer<typeof OrganisationSafeParse>;

/* Events */

const relate_creator = /* surrealql */ `
    DEFINE EVENT relate_creator ON organisation WHEN $event = "CREATE" THEN {
        RELATE ($value.created_by)->manages->($value.id) SET confirmed = true, role = 'owner';
    };
`;

const log = /* surrealql */ `
    DEFINE EVENT log ON organisation THEN {
        LET $fields = ["name", "description", "website", "email"];
        fn::log::generate::any::batch($event, $before, $after, $fields, false);
    };
`;

const removal_cleanup = /* surrealql */ `
    DEFINE EVENT removal_cleanup ON organisation WHEN $event = "DELETE" THEN {
        DELETE $before<-manages;
    };
`;

export default [organisation, relate_creator, log, removal_cleanup].join(
    '\n\n'
);
