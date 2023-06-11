DEFINE TABLE admin SCHEMAFULL
  PERMISSIONS
    FOR select, update, delete, create WHERE $scope = 'admin';

DEFINE FIELD name     ON TABLE admin TYPE string    ASSERT array::len(string::words($value)) > 1;
DEFINE FIELD email    ON TABLE admin TYPE string    ASSERT is::email($value);
DEFINE FIELD password ON TABLE admin TYPE string 
  PERMISSIONS 
    FOR select NONE;

DEFINE FIELD created  ON TABLE admin TYPE datetime  VALUE $before OR time::now();
DEFINE FIELD updated  ON TABLE admin TYPE datetime  VALUE time::now();

DEFINE INDEX email ON TABLE admin COLUMNS email UNIQUE;