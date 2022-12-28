DEFINE TABLE log SCHEMALESS
    PERMISSIONS
        FOR select WHERE id = $auth.id OR $scope = 'admin'
        FOR update, delete, create NONE;

DEFINE FIELD created ON log TYPE datetime VALUE $before OR time::now();
DEFINE FIELD from ON TABLE log;
DEFINE FIELD to ON TABLE log;
DEFINE FIELD details ON TABLE log TYPE object VALUE $value OR $before OR {};
DEFINE FIELD event ON TABLE log TYPE string ASSERT $value != NONE AND $value = /^[a-zA-Z](?:[-_.]?[a-zA-Z0-9])+$/;
DEFINE FIELD field ON TABLE log TYPE string ASSERT $value != NONE AND $value = /.+:.+/;