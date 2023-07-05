import { z } from 'zod';
import { record } from '../lib/zod.ts';

const organisation = /* surrealql */ `
    DEFINE TABLE organisation SCHEMAFULL
        PERMISSIONS
            FOR create WHERE $scope IN ['admin', 'user']
            FOR select WHERE 
                $scope = 'admin' OR 
                ($scope = 'user' && managers.*.id CONTAINS $auth.id)
            FOR update WHERE 
                $scope = 'admin' OR 
                ($scope = 'user' && managers[WHERE role IN ["owner", "adminstrator"]].id CONTAINS $auth.id)
            FOR delete WHERE 
                $scope = 'admin' OR 
                ($scope = 'user' && managers[WHERE role IN ["owner", "adminstrator"] AND org != NONE].id CONTAINS $auth.id);

    DEFINE TABLE puborg AS SELECT name, description, website, email, created, slug FROM organisation;

    DEFINE FIELD name                 ON organisation TYPE string;
    DEFINE FIELD description          ON organisation TYPE option<string>;
    DEFINE FIELD website              ON organisation TYPE option<string>;
    DEFINE FIELD email                ON organisation TYPE string           
        ASSERT is::email($value);
    DEFINE FIELD logo                 ON organisation TYPE string
        VALUE 
            IF not($scope) OR $scope = 'admin' THEN
                RETURN $input;
            ELSE IF $input == 'remove' THEN
                RETURN NONE;
            ELSE
                RETURN $before OR NULL;
            END;
    DEFINE FIELD banner               ON organisation TYPE string
        VALUE 
            IF not($scope) OR $scope = 'admin' THEN
                RETURN $input;
            ELSE IF $input == 'remove' THEN
                RETURN NONE;
            ELSE
                RETURN $before OR NULL;
            END;
    DEFINE FIELD slug                 ON organisation TYPE string
        VALUE 
            IF $value == NONE THEN
                RETURN meta::id(id);
            ELSE IF not($value) THEN
                RETURN $before ?? meta::id(id);
            ELSE IF $scope = 'admin' OR not($scope) THEN
                RETURN $value;
            ELSE IF tier IN ["business", "enterprise"] THEN
                RETURN $value;
            ELSE
                RETURN meta::id(id);
            END;
    DEFINE FIELD tier                 ON organisation TYPE string
        ASSERT $value IN ["free", "basic", "business", "enterprise"]
        PERMISSIONS 
            FOR create, update WHERE
                $scope = 'admin'
        VALUE $value OR $before OR "free";

    DEFINE FIELD manager_roles        ON organisation TYPE array
        PERMISSIONS
            FOR update WHERE
                $scope = 'admin' OR 
                ($scope = 'user' && managers[WHERE role IN ["owner"] OR (role IN ["administrator"] AND org != NONE)].id CONTAINS $auth.id);
    DEFINE FIELD manager_roles.*      ON organisation TYPE object;
    DEFINE FIELD manager_roles.*.id   ON organisation TYPE record<user>;
    DEFINE FIELD manager_roles.*.role ON organisation TYPE string 
        ASSERT $value IN ['owner', 'administrator', 'event_manager', 'event_viewer'];

    -- ABOUT RECURSIVE NESTING OF ORGANISATIONS
    -- Tested it, utter limit is 16 levels of recursion which is overkill for this scenario :)
    -- There is no usecase for this, nobody will reach this limit
    -- If they do, they break their own management interface.
    -- It will still work fine for admins because they don't have a subquery in the permission clause :)

    DEFINE FIELD part_of              ON organisation TYPE option<record<organisation>>
        VALUE
            IF $scope = 'admin' OR not($scope) THEN
                $value ?? $before
            ELSE IF (SELECT VALUE id FROM $value WHERE managers[WHERE role IN ["owner", "adminstrator"]].id CONTAINS $auth.id)[0] THEN
                $value ?? $before
            ELSE 
                $before
            END
        PERMISSIONS
            FOR update WHERE
                $scope = 'admin';

    DEFINE FIELD managers             ON organisation
        VALUE <future> {
            LET $part_of = type::thing(part_of);
            LET $inherited_raw = (SELECT VALUE managers FROM $part_of)[0] ?? [];
            LET $inherited = SELECT *, (org OR $part_of) AS org FROM $inherited_raw;
            LET $combined  = array::concat(manager_roles ?? [], $inherited ?? []);
            RETURN $combined;
        };

    DEFINE FIELD created              ON organisation TYPE datetime VALUE $before OR time::now();
    DEFINE FIELD updated              ON organisation TYPE datetime VALUE time::now();
`;

export const Organisation = z.object({
    id: record('organisation'),
    name: z.string(),
    description: z.string().optional(),
    website: z.string().url().optional(),
    email: z.string().email(),
    logo: z.string().optional(),
    banner: z.string().optional(),
    slug: z.string(),
    tier: z.union([
        z.literal('free'),
        z.literal('basic'),
        z.literal('business'),
        z.literal('enterprise'),
    ]),
    manager_roles: z.array(
        z.object({
            id: record('user'),
            role: z.union([
                z.literal('owner'),
                z.literal('administrator'),
                z.literal('event_manager'),
                z.literal('event_viewer'),
            ]),
        })
    ),
    part_of: record('organisation').optional(),
    managers: z.array(
        z.object({
            id: record('manager'),
            role: z.union([
                z.literal('owner'),
                z.literal('administrator'),
                z.literal('event_manager'),
                z.literal('event_viewer'),
            ]),
            org: record('organisation').optional(),
        })
    ),
    created: z.coerce.date(),
    updated: z.coerce.date(),
});

export type Organisation = z.infer<typeof Organisation>;

/* Events */

const organisation_create = /* surrealql */ `
    DEFINE EVENT organisation_create ON organisation WHEN $event == "CREATE" THEN {
        CREATE log CONTENT {
            record: $after.id,
            event: $event
        };
    };
`;

const organisation_delete = /* surrealql */ `
    DEFINE EVENT organisation_delete ON organisation WHEN $event == "DELETE" THEN {
        CREATE log CONTENT {
            record: $before.id,
            event: $event
        };
    };
`;

const organisation_update = /* surrealql */ `
    DEFINE EVENT organisation_update ON organisation WHEN $event == "UPDATE" THEN {
        IF $before.name != $after.name THEN
            CREATE log CONTENT {
                record: $after.id,
                event: $event,
                change: {
                    field: "name",
                    value: { before: $before.name, after: $after.name }
                }
            }
        END;

        IF $before.description != $after.description THEN
            CREATE log CONTENT {
                record: $after.id,
                event: $event,
                change: {
                    field: "description",
                    value: { before: $before.description, after: $after.description }
                }
            }
        END;

        IF $before.website != $after.website THEN
            CREATE log CONTENT {
                record: $after.id,
                event: $event,
                change: {
                    field: "website",
                    value: { before: $before.website, after: $after.website }
                }
            }
        END;

        IF $before.email != $after.email THEN
            CREATE log CONTENT {
                record: $after.id,
                event: $event,
                change: {
                    field: "email",
                    value: { before: $before.email, after: $after.email }
                }
            }
        END;
    };
`;

export default [
    organisation,
    organisation_create,
    organisation_delete,
    organisation_update,
].join('\n\n');
