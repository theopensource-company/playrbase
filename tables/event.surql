DEFINE TABLE event SCHEMAFULL
  PERMISSIONS
    FOR select WHERE $scope = 'admin' 
      OR (discoverable = true && published = true)
      OR (published = true && id = $event_id)
      OR (
        $scope = 'manager' && 
        (SELECT VALUE id FROM organisation WHERE $parent.organiser = id AND managers.*.id CONTAINS $auth.id)[0]
      )
    FOR create, update, delete WHERE 
      $scope = 'admin'
      OR (
        $scope = 'manager' && 
        (SELECT VALUE id FROM organisation WHERE $parent.organiser = id AND managers[WHERE role IN ['owner', 'administrator', 'event_manager']].id CONTAINS $auth.id)[0]
      );

DEFINE FIELD name         ON event TYPE string;
DEFINE FIELD description  ON event TYPE string;
DEFINE FIELD banner       ON event TYPE option<string>;
DEFINE FIELD category     ON event TYPE string 
  ASSERT $value IN ['baseball']
  VALUE (SELECT VALUE category FROM event WHERE id = $parent.tournament)[0] OR $before OR $value;

DEFINE FIELD start        ON event TYPE option<datetime>;
DEFINE FIELD end          ON event TYPE option<datetime>;
DEFINE FIELD organiser    ON event TYPE record<organisation>
  VALUE $before OR $value OR (SELECT VALUE organiser FROM event WHERE id = $parent.tournament)[0];

DEFINE FIELD discoverable ON event TYPE bool;
DEFINE FIELD published    ON event TYPE bool;
DEFINE FIELD tournament   ON event TYPE option<record<event>>;
DEFINE FIELD root_for_org ON event 
    VALUE (SELECT VALUE organiser FROM $parent.tournament)[0] == organiser;

DEFINE FIELD created      ON event TYPE datetime VALUE $before OR time::now();
DEFINE FIELD updated      ON event TYPE datetime VALUE time::now();


////////////////////////////
/////////  EVENTS  /////////
////////////////////////////


DEFINE EVENT log_create ON event WHEN $event == "CREATE" THEN {
    CREATE log CONTENT {
        record: $after.id,
        event: $event
    };
};

DEFINE EVENT log_create ON event WHEN $event == "DELETE" THEN {
    CREATE log CONTENT {
        record: $before.id,
        event: $event
    };
};

DEFINE EVENT log_update ON event WHEN $event == "UPDATE" THEN {
    IF $before.name != $after.name THEN
        CREATE log CONTENT {
            record: $after.id,
            event: $event,
            change: {
                field: "name",
                value: { before: $before.name, after: $after.name }
            }
        }
    END;

    IF $before.description != $after.description THEN
        CREATE log CONTENT {
            record: $after.id,
            event: $event,
            change: {
                field: "description",
                value: { before: $before.description, after: $after.description }
            }
        }
    END;

    IF $before.published != $after.published THEN
        CREATE log CONTENT {
            record: $after.id,
            event: $event,
            change: {
                field: "published",
                value: { before: $before.published, after: $after.published }
            }
        }
    END;

    IF $before.discoverable != $after.discoverable THEN
        CREATE log CONTENT {
            record: $after.id,
            event: $event,
            change: {
                field: "discoverable",
                value: { before: $before.discoverable, after: $after.discoverable }
            }
        }
    END;

    IF $before.start != $after.start THEN
        CREATE log CONTENT {
            record: $after.id,
            event: $event,
            change: {
                field: "start",
                value: { before: $before.start, after: $after.start }
            }
        }
    END;

    IF $before.end != $after.end THEN
        CREATE log CONTENT {
            record: $after.id,
            event: $event,
            change: {
                field: "end",
                value: { before: $before.end, after: $after.end }
            }
        }
    END;
}