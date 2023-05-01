DEFINE TABLE manager SCHEMAFULL 
    PERMISSIONS 
        FOR select, update, delete WHERE 
            $scope = 'admin' OR
            ($scope = 'manager' && id = $auth.id) OR 
            (
                $scope = 'manager' && 
                id != $auth.id &&
                (SELECT VALUE id FROM organisation_managers WHERE [$parent.id, $auth.id] ALLINSIDE managers.*.id)[0]
            )
        FOR create WHERE $scope = 'admin'
;

DEFINE FIELD name       ON TABLE manager TYPE string    ASSERT array::len(string::words($value)) > 1;
DEFINE FIELD email      ON TABLE manager TYPE string    ASSERT is::email($value);
DEFINE FIELD password   ON TABLE manager TYPE string
  PERMISSIONS 
    FOR select NONE 
    FOR update WHERE 
      $scope = 'admin' OR 
      array::len((SELECT * FROM manager WHERE id = $auth.id AND crypto::argon2::compare(password, $oldpassword))) > 0;

DEFINE FIELD created    ON TABLE manager TYPE datetime  VALUE $before OR time::now();
DEFINE FIELD updated    ON TABLE manager TYPE datetime  VALUE time::now();

DEFINE INDEX email      ON TABLE manager COLUMNS email UNIQUE;


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

    IF $before.password != $after.password THEN
        CREATE log CONTENT {
            record: $after.id,
            event: $event,
            change: { field: "password" }
        }
    END;
}