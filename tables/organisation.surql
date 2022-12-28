DEFINE TABLE organisation SCHEMAFULL
    PERMISSIONS
        FOR create, delete WHERE $scope = 'admin'
        FOR select WHERE $scope = 'admin' OR ($scope = 'manager' && manager_roles.*.id CONTAINS $auth.id)
        FOR update WHERE $scope = 'admin' OR ($scope = 'manager' && manager_roles[WHERE role="owner" OR role="adminstrator"].id CONTAINS $auth.id);

DEFINE FIELD name ON TABLE organisation TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON TABLE organisation TYPE string;
DEFINE FIELD website ON TABLE organisation TYPE string;
DEFINE FIELD email ON TABLE organistion TYPE string ASSERT is::email($value);
DEFINE FIELD manager_roles ON TABLE organisation TYPE array;
DEFINE FIELD manager_roles.* ON TABLE organisation TYPE object ASSERT $value != NONE;
DEFINE FIELD manager_roles.*.id ON TABLE organisation TYPE string ASSERT $value = /^manager:.*/;
DEFINE FIELD manager_roles.*.role ON TABLE organisation TYPE string ASSERT $value = 'owner' OR $value = 'administrator' OR $value = 'event_manager' OR $value = 'event_viewer';
DEFINE FIELD master_organisation ON TABLE organisation TYPE string ASSERT $value = /^organisation:.*/ OR $value = NONE;
DEFINE FIELD managers ON TABLE organisation VALUE <future> {
  function(
    (SELECT id, name, email FROM manager WHERE $parent.manager_roles.*.id CONTAINS id), 
    (SELECT managers FROM organisation WHERE [$parent.master_organisation] CONTAINS id)
  ) {
    const hierarchy = {
      owner: 0,
      administrator: 100,
      event_manager: 200,
      event_viewer: 300,
    };

    const unfiltered = [
      ...((arguments[1][0])[0] ?? [])
        .map(
          (manager) => ({
            ...manager,
            inherited: true,
          })
        ),

      ...arguments[0][0]
        .map(
          (manager) => ({
            ...manager,
            role: this.manager_roles.find((r) => r.id == manager.id).role,
          })
        ),
    ];

    const filtered = [];
    unfiltered.forEach(manager => {
      const inherited = !managers.find(
        (m) =>
          m.id == manager.id &&
          manager.inherited
        );

      const passed = !managers.find(
        (m) =>
          m.id == manager.id &&
          hierarchy[manager.role] > hierarchy[m.role]
        ));

      if (passed) filtered.push({
        ...manager,
        inherited
      });
    })

    return filtered;
  }
};

DEFINE FIELD tournaments ON TABLE organisation VALUE <future> {(SELECT name, description, banner, category, organiser, created, updated FROM tournament WHERE organiser = $parent.id AND published = true)};
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

create organisation:org content {
  name: 'org',
  description: 'top of the org tree',
  website: 'https://org.com',
  email: 'info@org.com',
  manager_roles: [
    {
      id: 'manager:john',
      role: 'owner'
    },
    {
      id: 'manager:mary',
      role: 'event_viewer'
    }
  ]
};

create organisation:org_branched content {
  name: 'org but branched',
  description: 'is a branch, so inherits managers from top level org',
  website: 'https://branch.org.com',
  email: 'branch@org.com',
  master_organisation: organisation:org,
  manager_roles: [
    {
      id: 'manager:mary',
      role: 'event_manager'
    }
  ]
};

create organisation:org_branched_club content {
  name: 'club within org that is branched',
  description: 'is a club in branch, so inherits managers from all top level orgs',
  website: 'https://branch.org.com',
  email: 'branch_club@org.com',
  master_organisation: organisation:org_branched,
  manager_roles: [
    {
      id: 'manager:mary',
      role: 'owner'
    },
    {
      id: 'manager:john',
      role: 'event_viewer'
    }
  ]
};