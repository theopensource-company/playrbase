DEFINE TABLE image_claim SCHEMAFULL
    PERMISSIONS
        FOR create WHERE $scope IN ['admin', 'manager', 'player'] AND count((SELECT by FROM image_claim WHERE by = $auth.id AND created + 30d > time::now())) < 30
        FOR select WHERE $scope = 'admin' OR by = $auth.id;

DEFINE FIELD claim_token ON image_claim TYPE string VALUE meta::id(id);
DEFINE FIELD by ON image_claim TYPE record<player | manager | admin> VALUE $before OR $auth.id;
DEFINE FIELD target ON image_claim TYPE record<player | organisation>
    VALUE 
        IF $before THEN
            RETURN $before;
        ELSE IF ($scope = 'user') THEN  
            RETURN $auth.id;
        ELSE IF ($scope = 'manager') THEN 
            RETURN (SELECT VALUE id FROM organisation WHERE managers[WHERE role IN ["owner", "adminstrator"]].id CONTAINS $auth.id)[0];
        ELSE IF ($scope = 'admin') THEN
            RETURN $input;
        ELSE 
            RETURN false;
        END;

DEFINE FIELD type ON image_claim TYPE string 
    VALUE $before OR $value
    ASSERT 
        IF ($scope = 'player') THEN 
            RETURN $value IN ['profile_picture'];
        ELSE IF ($scope = 'manager') THEN
            RETURN $value IN ['banner', 'logo'];
        ELSE IF ($scope = 'admin') THEN
            RETURN $value IN ['profile_picture', 'banner', 'logo'];
        ELSE 
            RETURN false;
        END;

DEFINE FIELD created ON image_claim TYPE datetime VALUE $before OR time::now();