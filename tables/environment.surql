DEFINE TABLE environment SCHEMAFULL PERMISSIONS
        FOR select WHERE $scope = 'admin' OR public = true
        FOR update WHERE $scope = 'admin'
        FOR create, delete NONE;

DEFINE FIELD value ON TABLE environment TYPE string ASSERT $value != NONE;
DEFINE FIELD public ON TABLE environment TYPE bool ASSERT $value != NONE;

IF not(environment:sendgrid_key.id) THEN
        CREATE environment:sendgrid_key SET value = "", public = false;
END;

IF not(environment:origin.id) THEN
        CREATE environment:origin SET value = "", public = true;
END;