DEFINE TABLE manager SCHEMAFULL 
  PERMISSIONS 
    FOR select, update, delete WHERE 
         ($scope = 'manager' && id = $auth.id) 
      OR $scope = 'admin'
    FOR create WHERE $scope = 'admin'
;

DEFINE FIELD name ON TABLE manager TYPE string ASSERT $value != NONE AND array::len(string::words($value)) > 1;
DEFINE FIELD email ON TABLE manager TYPE string ASSERT is::email($value);
DEFINE FIELD password ON TABLE manager TYPE string ASSERT $value != NONE
  PERMISSIONS FOR select NONE FOR update WHERE $scope = 'admin' OR string::length(<string> (select * from manager where id = $auth.id and crypto::argon2::compare(password, $oldpassword))) > 2;

DEFINE FIELD created ON TABLE manager TYPE datetime VALUE $before OR time::now();
DEFINE FIELD updated ON TABLE manager TYPE datetime VALUE time::now();

REMOVE INDEX email ON TABLE manager;
DEFINE INDEX email ON TABLE manager COLUMNS email UNIQUE;

DEFINE EVENT name ON TABLE manager WHEN $before.name != $after.name AND $before.name != NONE AND $after.name != NONE THEN ( 
  CREATE log SET from=$before.name, to=$after.name, event="manager_name_changed", field=$after.id
);

DEFINE EVENT email ON TABLE manager WHEN $before.email != $after.email AND $before.email != NONE AND $after.email != NONE THEN ( 
  CREATE log SET from=$before.email, to=$after.email, event="manager_email_changed", field=$after.id
);

DEFINE EVENT password ON TABLE manager WHEN $before.password != $after.password AND $before.password != NONE AND $after.id != NONE THEN ( 
  CREATE log SET event="manager_password_changed", field=$after.id
);

create manager:john content {
  name: "John Doe",
  email: 'john@email.tld',
  password: crypto::argon2::generate("Password1!")
};

create manager:mary content {
  name: "Mary Doe",
  email: 'mary@email.tld',
  password: crypto::argon2::generate("Password1!")
};