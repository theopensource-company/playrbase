import { z } from 'zod';
import { record, role } from '../../lib/zod.ts';

const organisation = /* surrealql */ `
    DEFINE TABLE organisation SCHEMAFULL
        PERMISSIONS
            FOR select FULL
            FOR create WHERE 
                $scope = 'user' AND (
                    $auth.platform OR
                    !!part_of.id
                )
            FOR update WHERE 
                managers[WHERE role IN ["owner", "administrator"]].user CONTAINS $auth.id
            FOR delete WHERE 
                managers[WHERE role = "owner" OR (role = "administrator" AND org != NONE)].user CONTAINS $auth.id;

    DEFINE FIELD name               ON organisation TYPE string
        ASSERT string::len($value) > 0 && string::len($value) <= 32;
    DEFINE FIELD description        ON organisation TYPE option<string>;
    DEFINE FIELD website            ON organisation TYPE option<string>;
    DEFINE FIELD email              ON organisation TYPE string           
        ASSERT string::is::email($value);
    DEFINE FIELD type               ON organisation VALUE meta::tb(id) DEFAULT meta::tb(id);

    DEFINE FIELD logo               ON organisation TYPE option<string>
        PERMISSIONS FOR update NONE;
    DEFINE FIELD banner             ON organisation TYPE option<string>
        PERMISSIONS FOR update NONE;
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
            FOR select WHERE managers.*.user CONTAINS $auth.id
            FOR update NONE;

    -- ABOUT RECURSIVE NESTING OF ORGANISATIONS
    -- Tested it, utter limit is 16 levels of recursion which is overkill for this scenario :)
    -- There is no usecase for this, nobody will reach this limit
    -- If they do, they break their own management interface.

    DEFINE FIELD part_of            ON organisation TYPE option<record<organisation>>
        VALUE
            IF !$scope THEN
                $value
            ELSE IF $value && (SELECT VALUE id FROM $value WHERE managers[WHERE role IN ["owner", "administrator"]].user CONTAINS $auth.id)[0] THEN
                $value
            ELSE 
                $before
            END
        PERMISSIONS
            FOR update NONE;

    DEFINE FIELD managers           ON organisation
        FLEXIBLE TYPE array<object>
        DEFAULT [] 
        PERMISSIONS FOR update NONE;
    
    DEFINE FIELD created_by         ON organisation TYPE record<user>
        DEFAULT $auth.id
        VALUE $before OR $auth.id
        PERMISSIONS FOR select NONE;

    DEFINE FIELD created            ON organisation TYPE datetime VALUE $before OR time::now()    DEFAULT time::now();
    DEFINE FIELD updated            ON organisation TYPE datetime VALUE time::now()               DEFAULT time::now()
        PERMISSIONS FOR select WHERE managers.*.user CONTAINS $auth.id;

    DEFINE INDEX unique_slug        ON organisation FIELDS slug UNIQUE;
    DEFINE INDEX compound_email     ON organisation FIELDS email;
    DEFINE INDEX compound_part_of   ON organisation FIELDS part_of;
    DEFINE INDEX compound_managers  ON organisation FIELDS managers;
`;

export const Organisation = z.object({
    id: record('organisation'),
    name: z.string().min(1).max(32),
    description: z.string().optional(),
    website: z.union([z.string().url(), z.literal('')]).optional(),
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
            role,
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
        IF !$value.part_of.id {
            LET $origin = $value.created_by;
            LET $target = $value.id;

            CREATE invite CONTENT {
                origin: $origin,
                target: $target,
                role: 'owner',
                invited_by: $origin,
            };

            RELATE $origin->manages->$target;
        };
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

const update_dependant_managers = /* surrealql */ `
    DEFINE EVENT update_dependant_managers ON organisation WHEN $event = "UPDATE" && $before.managers != $after.managers THEN {
        UPDATE organisation SET managers = fn::recursion::organisation::managers(id, part_of) WHERE part_of = $value.id;
    };
`;

const populate_initial_managers = /* surrealql */ `
    DEFINE EVENT populate_initial_managers ON organisation WHEN $event = "CREATE" THEN {
        UPDATE $value.id SET managers = fn::recursion::organisation::managers($value.id, $value.part_of);
    };
`;

export default [
    organisation,
    relate_creator,
    log,
    removal_cleanup,
    update_dependant_managers,
    populate_initial_managers,
].join('\n\n');
