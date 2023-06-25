DEFINE TABLE player SCHEMAFULL 
  PERMISSIONS 
    FOR select, update, delete WHERE 
      ($scope = 'player' && id = $auth.id)
      OR $scope = 'admin'
    FOR create WHERE $scope = 'admin'
;

DEFINE FIELD name               ON player TYPE string ASSERT array::len(string::words($value)) > 1;
DEFINE FIELD email              ON player TYPE string ASSERT is::email($value);

DEFINE FIELD properties         ON player TYPE object VALUE $value OR $before OR {};
DEFINE FIELD properties.height  ON player TYPE option<number>;
DEFINE FIELD properties.gender  ON player TYPE option<string> 
  ASSERT $value IN ['male', 'female', 'other', NONE];

DEFINE FIELD profile_picture    ON player TYPE string
    VALUE 
        IF not($scope) OR $scope = 'admin' THEN
            RETURN $input;
        ELSE IF $input == 'remove' THEN
            RETURN NONE;
        ELSE
            RETURN $before OR NULL;
        END;
        
DEFINE FIELD birthdate          ON player TYPE datetime;
DEFINE FIELD created            ON player TYPE datetime VALUE $before OR time::now();
DEFINE FIELD updated            ON player TYPE datetime VALUE time::now();

DEFINE INDEX email              ON player COLUMNS email UNIQUE;


////////////////////////////
/////////  EVENTS  /////////
////////////////////////////


DEFINE EVENT log_create ON player WHEN $event == "CREATE" THEN {
    CREATE log CONTENT {
        record: $after.id,
        event: $event
    };
};

DEFINE EVENT log_create ON player WHEN $event == "DELETE" THEN {
    CREATE log CONTENT {
        record: $before.id,
        event: $event
    };
};

DEFINE EVENT log_update ON player WHEN $event == "UPDATE" THEN {
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