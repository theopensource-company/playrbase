DEFINE TABLE organisation SCHEMAFULL
    PERMISSIONS
        FOR create, delete WHERE $scope = 'admin'
        FOR select WHERE $scope = 'admin' OR ($scope = 'manager' && manager_roles.*.id CONTAINS $auth.id)
        FOR update WHERE $scope = 'admin' OR ($scope = 'manager' && manager_roles[WHERE role="owner" OR role="adminstrator"].id CONTAINS $auth.id);

DEFINE FIELD name ON TABLE organisation TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON TABLE organisation TYPE string;
DEFINE FIELD website ON TABLE organisation TYPE string;
DEFINE FIELD email ON TABLE organisation TYPE string ASSERT is::email($value);
DEFINE FIELD manager_roles ON TABLE organisation TYPE array;
DEFINE FIELD manager_roles.* ON TABLE organisation TYPE object ASSERT $value != NONE;
DEFINE FIELD manager_roles.*.id ON TABLE organisation TYPE string ASSERT $value = /^manager:.*/;
DEFINE FIELD manager_roles.*.role ON TABLE organisation TYPE string ASSERT $value = 'owner' OR $value = 'administrator' OR $value = 'event_manager' OR $value = 'event_viewer';
DEFINE FIELD master_organisation ON TABLE organisation TYPE string ASSERT $value = /^organisation:.*/ OR $value = NONE;
DEFINE FIELD managers ON TABLE organisation VALUE <future> {
  function(
    (SELECT id, name, email FROM manager WHERE $parent.manager_roles.*.id CONTAINS id), 
    (SELECT id, name, managers FROM organisation WHERE [$parent.master_organisation] CONTAINS id)
  ) {
    return [
      ...((arguments[1][0] ?? []).managers ?? [])
        .map(
          (manager) => ({
            ...manager,
            org: (manager.org ?? {
              id: arguments[1][0].id,
              name: arguments[1][0].name
            }),
          })
        ),

      ...arguments[0]
        .map(
          (manager) => ({
            ...manager,
            role: this.manager_roles.find((r) => r.id == manager.id).role,
          })
        ),
    ]
  }
};

DEFINE FIELD created ON TABLE organisation TYPE datetime VALUE $before OR time::now();
DEFINE FIELD updated ON TABLE organisation TYPE datetime VALUE time::now();

DEFINE EVENT name ON TABLE organisation WHEN $before.name != $after.name AND $before.name != NONE AND $after.name != NONE THEN ( 
  CREATE log SET from=$before.name, to=$after.name, event="organisation_name_changed", field=$after.id
);

DEFINE EVENT description ON TABLE organisation WHEN $before.description != $after.description AND $before.description != NONE AND $after.description != NONE THEN ( 
  CREATE log SET from=$before.description, to=$after.description, event="organisation_description_changed", field=$after.id
);

DEFINE EVENT website ON TABLE website WHEN $before.website != $after.website AND $before.website != NONE AND $after.website != NONE THEN ( 
  CREATE log SET from=$before.website, to=$after.website, event="organisation_website_changed", field=$after.id
);

DEFINE EVENT email ON TABLE email WHEN $before.email != $after.email AND $before.email != NONE AND $after.email != NONE THEN ( 
  CREATE log SET from=$before.email, to=$after.email, event="organisation_email_changed", field=$after.id
);