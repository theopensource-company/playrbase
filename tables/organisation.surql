DEFINE TABLE organisation SCHEMAFULL
    PERMISSIONS
        FOR create, delete WHERE $scope = 'admin'
        FOR select WHERE 
          $scope = 'admin' OR 
          ($scope = 'manager' && managers.*.id CONTAINS $auth.id)
        FOR update WHERE 
          $scope = 'admin' OR 
          ($scope = 'manager' && managers[WHERE role IN ["owner", "adminstrator"]].id CONTAINS $auth.id);

DEFINE TABLE puborg AS SELECT name, description, website, email, created FROM organisation;

DEFINE FIELD name                 ON organisation TYPE string;
DEFINE FIELD description          ON organisation TYPE option<string>;
DEFINE FIELD website              ON organisation TYPE option<string>;
DEFINE FIELD email                ON organisation TYPE string           
    ASSERT is::email($value);

DEFINE FIELD manager_roles        ON organisation TYPE array;
DEFINE FIELD manager_roles.*      ON organisation TYPE object;
DEFINE FIELD manager_roles.*.id   ON organisation TYPE record<manager>;
DEFINE FIELD manager_roles.*.role ON organisation TYPE string 
    ASSERT $value IN ['owner', 'administrator', 'event_manager', 'event_viewer'];

DEFINE FIELD part_of              ON organisation TYPE option<record<organisation>>;
DEFINE FIELD managers             ON organisation
    VALUE <future> {
        LET $inherited = (SELECT VALUE managers FROM type::thing(part_of))[0] ?? [];
        LET $combined  = array::concat(manager_roles ?? [], $inherited ?? []);
        RETURN $combined;
    };

DEFINE FIELD created              ON organisation TYPE datetime VALUE $before OR time::now();
DEFINE FIELD updated              ON organisation TYPE datetime VALUE time::now();


////////////////////////////
/////////  EVENTS  /////////
////////////////////////////


DEFINE EVENT log_create ON organisation WHEN $event == "CREATE" THEN {
    CREATE log CONTENT {
        record: $after.id,
        event: $event
    };
};

DEFINE EVENT log_create ON organisation WHEN $event == "DELETE" THEN {
    CREATE log CONTENT {
        record: $before.id,
        event: $event
    };
};

DEFINE EVENT log_update ON organisation WHEN $event == "UPDATE" THEN {
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
}