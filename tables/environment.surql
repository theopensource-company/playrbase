DEFINE TABLE environment SCHEMAFULL PERMISSIONS
        FOR select WHERE $scope = 'admin' OR public = true
        FOR update WHERE $scope = 'admin'
        FOR create, delete NONE;

DEFINE FIELD value ON TABLE environment TYPE string ASSERT $value != NONE;
DEFINE FIELD public ON TABLE environment TYPE bool ASSERT $value != NONE;

IF array::len((SELECT * FROM environment:sendgrid_key)) == 0 THEN
        ( CREATE environment:sendgrid_key SET value = "BLANK", public = false )
END;

IF array::len((SELECT * FROM environment:origin)) == 0 THEN
        ( CREATE environment:origin SET value = "", public = true )
END;