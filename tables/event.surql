DEFINE TABLE event SCHEMAFULL
  PERMISSIONS
    FOR select WHERE $scope = 'admin' 
      OR (discoverable = true && published = true)
      OR (published = true && id = $event_id)
      OR ($scope = 'manager' && 
        array::len((SELECT id FROM organisation WHERE id IN [$parent.organiser] AND manager_roles.*.id CONTAINS $auth.id)) > 0
      )
    FOR create, update, delete WHERE 
      $scope = 'admin'
      OR ($scope = 'manager' && 
        array::len((SELECT id FROM organisation WHERE id IN [$parent.organiser] AND manager_roles[WHERE role = 'owner' OR role = 'administrator' OR role = 'event_manager'].id CONTAINS $auth.id)) > 0
      );

DEFINE FIELD name ON TABLE event TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON TABLE event TYPE string ASSERT $value != NONE;
DEFINE FIELD banner ON TABLE event TYPE string;
DEFINE FIELD category ON TABLE event TYPE string ASSERT $value = 'baseball' OR $value = 'bla'
  VALUE string::slice((select category from event where id = $parent.tournament), 2, -2) OR $before OR $value;
DEFINE FIELD start ON TABLE event TYPE datetime;
DEFINE FIELD end ON TABLE event TYPE datetime;
DEFINE FIELD organiser ON TABLE event TYPE string ASSERT $value = /^organisation:.*/ VALUE $before OR $value;
DEFINE FIELD discoverable ON TABLE event TYPE bool ASSERT $value != NONE;
DEFINE FIELD published ON TABLE event TYPE bool ASSERT $value != NONE;
DEFINE FIELD tournament ON TABLE event TYPE string ASSERT $value = /^event:.*/ OR $value = NONE;

DEFINE FIELD created ON TABLE event TYPE datetime VALUE $before OR time::now();
DEFINE FIELD updated ON TABLE event TYPE datetime VALUE time::now();

DEFINE EVENT name ON TABLE event WHEN $before.name != $after.name AND $before.name != NONE AND $after.name != NONE THEN ( 
  CREATE log SET from=$before.name, to=$after.name, event="event_name_changed", field=$after.id
);

DEFINE EVENT description ON TABLE event WHEN $before.description != $after.description AND $before.description != NONE AND $after.description != NONE THEN ( 
  CREATE log SET from=$before.description, to=$after.description, event="event_description_changed", field=$after.id
);

DEFINE EVENT published ON TABLE event WHEN $before.published != $after.published AND $before.published != NONE AND $after.published != NONE THEN ( 
  CREATE log SET from=$before.published, to=$after.published, event="event_published_changed", field=$after.id
);

DEFINE EVENT discoverable ON TABLE event WHEN $before.discoverable != $after.discoverable AND $before.discoverable != NONE AND $after.discoverable != NONE THEN ( 
  CREATE log SET from=$before.discoverable, to=$after.discoverable, event="event_discoverable_changed", field=$after.id
);

DEFINE EVENT start ON TABLE event WHEN $before.start != $after.start AND $before.start != NONE AND $after.start != NONE THEN ( 
  CREATE log SET from=$before.start, to=$after.start, event="event_start_changed", field=$after.id
);

DEFINE EVENT end ON TABLE event WHEN $before.end != $after.end AND $before.end != NONE AND $after.end != NONE THEN ( 
  CREATE log SET from=$before.end, to=$after.end, event="event_end_changed", field=$after.id
);