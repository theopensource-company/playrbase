DEFINE SCOPE admin;
DEFINE SCOPE manager;
DEFINE SCOPE player;

-- DEFINE TOKEN admin   ON SCOPE manager TYPE HS512 VALUE "secret";
-- DEFINE TOKEN manager ON SCOPE manager TYPE HS512 VALUE "secret";
-- DEFINE TOKEN player  ON SCOPE manager TYPE HS512 VALUE "secret";

DEFINE TABLE auth_challenge SCHEMAFULL;

DEFINE FIELD subject    ON auth_challenge TYPE record<admin | manager | user>;
DEFINE FIELD method     ON auth_challenge TYPE string ASSERT $value IN ['magic-link']; 
DEFINE FIELD challenge  ON auth_challenge VALUE $before OR rand::string(40, 60);
DEFINE FIELD created    ON auth_challenge VALUE $before OR time::now();
