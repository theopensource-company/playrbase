const log = /* surrealql */ `
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
    }
`;

export default log;
