DEFINE TABLE organisation SCHEMAFULL
    PERMISSIONS
        FOR create WHERE $scope IN ['admin', 'manager']
        FOR select WHERE 
          $scope = 'admin' OR 
          ($scope = 'manager' && managers.*.id CONTAINS $auth.id)
        FOR update WHERE 
          $scope = 'admin' OR 
          ($scope = 'manager' && managers[WHERE role IN ["owner", "adminstrator"]].id CONTAINS $auth.id);
        FOR delete WHERE 
          $scope = 'admin' OR 
          ($scope = 'manager' && managers[WHERE role IN ["owner", "adminstrator"] AND org != NONE].id CONTAINS $auth.id);

DEFINE TABLE puborg AS SELECT name, description, website, email, created, url FROM organisation;

DEFINE FIELD name                 ON organisation TYPE string;
DEFINE FIELD description          ON organisation TYPE option<string>;
DEFINE FIELD website              ON organisation TYPE option<string>;
DEFINE FIELD email                ON organisation TYPE string           
    ASSERT is::email($value);
DEFINE FIELD url                  ON organisation TYPE string
    VALUE 
        IF not($value) THEN
            RETURN meta::id(id);
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
            ($scope = 'manager' && managers[WHERE role IN ["owner"] OR (role IN ["administrator"] AND org != NONE)].id CONTAINS $auth.id);
DEFINE FIELD manager_roles.*      ON organisation TYPE object;
DEFINE FIELD manager_roles.*.id   ON organisation TYPE record<manager>;
DEFINE FIELD manager_roles.*.role ON organisation TYPE string 
    ASSERT $value IN ['owner', 'administrator', 'event_manager', 'event_viewer'];

// ABOUT RECURSIVE NESTING OF ORGANISATIONS
// Tested it, utter limit is 16 levels of recursion which is overkill for this scenario :)
// There is no usecase for this, nobody will reach this limit
// If they do, they break their own management interface.
// It will still work fine for admins because they don't have a subquery in the permission clause :)

DEFINE FIELD part_of              ON organisation TYPE option<record<organisation>>
    VALUE
        IF $scope = 'admin' OR not($scope) THEN
            $value
        ELSE IF (SELECT VALUE id FROM $value WHERE managers[WHERE role IN ["owner", "adminstrator"]].id CONTAINS $auth.id)[0] THEN
            $value
        ELSE 
            false
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