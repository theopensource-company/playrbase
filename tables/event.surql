DEFINE TABLE event SCHEMAFULL
    PERMISSIONS
        FOR select WHERE $scope = 'admin' OR (discoverable = true && published = true);

DEFINE FIELD name ON TABLE event TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON TABLE event TYPE string ASSERT $value != NONE;
DEFINE FIELD banner ON TABLE event TYPE string;
DEFINE FIELD category ON TABLE event TYPE string ASSERT $value = 'baseball' VALUE $before OR $value;
DEFINE FIELD organiser ON TABLE event TYPE string ASSERT $value = /^organisation:.*/ VALUE $before OR $value;
DEFINE FIELD discoverable ON TABLE event TYPE bool ASSERT $value OR $before OR false;
DEFINE FIELD published ON TABLE event TYPE bool ASSERT $value OR $before OR false;
DEFINE FIELD tournament ON TABLE event TYPE string ASSERT $value = /^event:.*/ OR $value = NONE;
DEFINE FIELD events ON TABLE event TYPE array VALUE <future> {(SELECT * FROM event WHERE [tournament] CONTAINS $parent.id)};
DEFINE FIELD created ON TABLE event TYPE datetime VALUE $before OR time::now();
DEFINE FIELD updated ON TABLE event TYPE datetime VALUE time::now();

DEFINE EVENT name ON TABLE event WHEN $before.name != $after.name AND $before.name != NONE AND $after.name != NONE THEN ( 
  CREATE log SET from=$before.name, to=$after.name, event="event_name_changed", field=$after.id
);

DEFINE EVENT description ON TABLE event WHEN $before.description != $after.description AND $before.description != NONE AND $after.description != NONE THEN ( 
  CREATE log SET from=$before.description, to=$after.description, event="event_description_changed", field=$after.id
);

DEFINE EVENT description ON TABLE event WHEN $before.description != $after.description AND $before.description != NONE AND $after.description != NONE THEN ( 
  CREATE log SET from=$before.description, to=$after.description, event="event_description_changed", field=$after.id
);