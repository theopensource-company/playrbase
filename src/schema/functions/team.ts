const team = /* surrealql */ `
    DEFINE FUNCTION fn::team::compute_players(
        $team: record<team | user>
    ) {
        RETURN IF meta::tb($team) == 'team' {
            RETURN $team.players;
        } ELSE {
            RETURN [$team];
        }
    };

    DEFINE FUNCTION fn::team::compute_eligable_players(
        $team: record<team | user>,
        $event: record<event>,
    ) {
        LET $min_age = $event.options.min_age;
        LET $max_age = $event.options.max_age;
        LET $players = fn::team::compute_players($team);
        
        -- Age check
        -- If $xxx is NONE, then pass (!$xxx)
        -- Otherwise, if there is no age, then invalid
        -- Now both are a number, so then check based on min/max age
        -- Lastly, filter out players who previously signed up to this event
        LET $players = $players[WHERE !$min_age OR (age AND age < $min_age)];
        LET $players = $players[WHERE !$max_age OR (age AND age > $max_age)];
        LET $players = $players[WHERE !fn::team::find_actor_registration(id, $event)];

        RETURN $players
    };

    DEFINE FUNCTION fn::team::eligable_to_play(
        $team: record<team | user>,
        $event: record<event>,
    ) {
        RETURN IF fn::team::find_actor_registration($team, $event) {
            RETURN false;
        } ELSE {
            LET $players = fn::team::compute_eligable_players($team, $event);
            LET $min_pool_size = $event.options.min_pool_size;
            LET $max_pool_size = $event.options.max_pool_size;

            // Not eligable if any of the checks do not pass
            LET $not_eligable = array::any([
                ($min_pool_size && array::len($players) < $min_pool_size),
                ($max_pool_size && array::len($players) > $max_pool_size),
            ]);

            RETURN !$not_eligable;
        }
    };

    DEFINE FUNCTION fn::team::find_actor_registration(
        $actor: record<team | user>,
        $event: record<event>,
    ) {
        RETURN ($actor->attends[?out=$event])[0]
            OR ($actor->plays_in->team->attends[?out=$event])[0]
    };
`;

export default team;
