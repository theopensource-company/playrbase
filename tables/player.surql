DEFINE TABLE player SCHEMAFULL 
  PERMISSIONS 
    FOR select, update, delete WHERE 
      ($scope = 'player' && id = $auth.id)
      OR $scope = 'admin'
    FOR create WHERE $scope = 'admin'
;

DEFINE FIELD name ON TABLE player TYPE string ASSERT $value != NONE AND array::len(string::words($value)) > 1;
DEFINE FIELD email ON TABLE player TYPE string ASSERT is::email($value);
DEFINE FIELD password ON TABLE player TYPE string ASSERT $value != NONE
  PERMISSIONS FOR select NONE FOR update WHERE $scope = 'admin' OR string::length(<string> (select * from player where id = $auth.id and crypto::argon2::compare(password, $oldpassword))) > 2;

DEFINE FIELD properties ON TABLE player TYPE object VALUE $value OR $before OR {};
DEFINE FIELD properties.height ON TABLE player TYPE number;
DEFINE FIELD properties.gender ON TABLE player TYPE string 
  ASSERT $value = 'male' OR $value = 'female' OR $value = 'other' OR $value = NONE;

DEFINE FIELD birthdate ON TABLE player TYPE datetime ASSERT $value != NONE;
DEFINE FIELD created ON TABLE player TYPE datetime VALUE $before OR time::now();
DEFINE FIELD updated ON TABLE player TYPE datetime VALUE time::now();

REMOVE INDEX email ON TABLE player;
DEFINE INDEX email ON TABLE player COLUMNS email UNIQUE;

DEFINE EVENT name ON TABLE player WHEN $before.name != $after.name AND $before.name != NONE AND $after.name != NONE THEN ( 
  CREATE log SET from=$before.name, to=$after.name, event="player_name_changed", field=$after.id
);

DEFINE EVENT email ON TABLE player WHEN $before.email != $after.email AND $before.email != NONE AND $after.email != NONE THEN ( 
  CREATE log SET from=$before.email, to=$after.email, event="player_email_changed", field=$after.id
);

DEFINE EVENT password ON TABLE player WHEN $before.password != $after.password AND $before.password != NONE AND $after.id != NONE THEN ( 
  CREATE log SET event="player_password_changed", field=$after.id
);