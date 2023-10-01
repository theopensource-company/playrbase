const log = /* surrealql */ `
    DEFINE FUNCTION fn::log::generate::create(
        $after: object
    ) {
        RETURN CREATE log CONTENT {
            record: $after.id,
            event: "CREATE"
        };
    };

    DEFINE FUNCTION fn::log::generate::update(
        $before: object, 
        $after: object, 
        $field: string, 
        $redacted: option<bool>
    ) {
        RETURN IF $before[$field] != $after[$field] {
            RETURN CREATE log CONTENT {
                record: $after.id,
                event: "UPDATE",
                change: {
                    field: $field,
                    value: {
                        RETURN IF $redacted {} ELSE {{ 
                            before: $before[$field], 
                            after: $after[$field] 
                        }}
                    }
                }
            };
        };
    };

    DEFINE FUNCTION fn::log::generate::update::batch(
        $before: object, 
        $after: object, 
        $field: array<string>, 
        $redacted: option<bool>
    ) {
        FOR $field IN $field {
            fn::log::generate::update($before, $after, $field, $redacted);
        }
    };

    DEFINE FUNCTION fn::log::generate::delete(
        $before: object
    ) {
        RETURN CREATE log CONTENT {
            record: $before.id,
            event: "DELETE"
        };
    };

    DEFINE FUNCTION fn::log::generate::any(
        $event: string,
        $before: object, 
        $after: object, 
        $field: string, 
        $redacted: option<bool>
    ) {
        RETURN 
            IF $event == "CREATE" {
                RETURN fn::log::generate::create($after);
            } ELSE IF $event == "UPDATE" {
                RETURN fn::log::generate::update($before, $after, $field, $redacted);
            } ELSE IF $event == "DELETE" {
                RETURN fn::log::generate::delete($before);
            };
    };

    DEFINE FUNCTION fn::log::generate::any::batch(
        $event: string,
        $before: option<object>, 
        $after: option<object>, 
        $fields: array<string>, 
        $redacted: option<bool>
    ) {
        RETURN 
            IF $event == "CREATE" {
                RETURN fn::log::generate::create($after);
            } ELSE IF $event == "UPDATE" {
                RETURN fn::log::generate::update::batch($before, $after, $fields, $redacted);
            } ELSE IF $event == "DELETE" {
                RETURN fn::log::generate::delete($before);
            };
    };
`;

export default log;
