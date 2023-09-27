const manages = /* surrealql */ `
    DEFINE TABLE manages SCHEMAFULL
        PERMISSIONS
            // One can manage other managers if:
            // - They are an owner at any level
            // - They are an administrator, except for top-level.
            FOR create 
                WHERE   $auth.id IN out.managers[WHERE role = "owner" OR (role = "administrator" AND org != NONE)].id
            FOR update, delete
                WHERE   $auth.id = in.id
                OR      $auth.id IN out.managers[WHERE role = "owner" OR (role = "administrator" AND org != NONE)].id
            FOR select
                WHERE   public = true AND confirmed = true
                OR      $auth.id = in.id
                OR      $auth.id IN out.managers.*.id;

    DEFINE FIELD in         ON manages TYPE record<user>;
    DEFINE FIELD out        ON manages TYPE record<organisation>;

    DEFINE FIELD confirmed  ON manages TYPE bool        DEFAULT false VALUE $before || IF in.id == $auth.id { $value } ELSE { false }; 
    DEFINE FIELD public     ON manages TYPE bool        DEFAULT false;
    DEFINE FIELD role       ON manages TYPE string      
        ASSERT $value IN ['owner', 'administrator', 'event_manager', 'event_viewer']
        PERMISSIONS
            FOR update WHERE $auth.id IN out.managers[WHERE role = "owner" OR (role = "administrator" AND org != NONE)].id;

    DEFINE FIELD created    ON manages TYPE datetime    VALUE $before OR time::now()  DEFAULT time::now();
    DEFINE FIELD updated    ON manages TYPE datetime    VALUE time::now()             DEFAULT time::now();

    DEFINE INDEX unique_relation ON manages COLUMNS in, out UNIQUE;
`;

export default manages;
