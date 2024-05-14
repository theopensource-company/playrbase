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
        $team: record<team | user> | array<record<user>>,
        $event: record<event>,
        $ignore_existing_registrations: option<bool>
    ) {
        LET $min_age = $event.options.min_age;
        LET $max_age = $event.options.max_age;
        LET $players = IF type::is::record($team) THEN fn::team::compute_players($team) ELSE $team END;
        
        -- Age check
        -- If $xxx is NONE, then pass (!$xxx)
        -- Otherwise, if there is no age, then invalid
        -- Now both are a number, so then check based on min/max age
        -- Lastly, filter out players who previously signed up to this event
        LET $players = $players[WHERE !$min_age OR (birthdate AND (duration::years(time::now() - birthdate) >= $min_age))];
        LET $players = $players[WHERE !$max_age OR (birthdate AND (duration::years(time::now() - birthdate) <= $max_age))];
        LET $players = $players[WHERE $ignore_existing_registrations OR !fn::team::find_actor_registration(id, $event)];

        RETURN $players
    };

    DEFINE FUNCTION fn::team::eligable_to_play(
        $team: record<team | user>,
        $event: record<event>,
    ) {
        RETURN IF fn::team::find_actor_registration($team, $event) {
            RETURN false;
        } ELSE {
            LET $players = fn::team::compute_players($team);
            LET $eligable = fn::team::compute_eligable_players($players, $event);
            LET $min_pool_size = $event.options.min_pool_size;
            LET $max_pool_size = $event.options.max_pool_size;
            LET $min_team_size = $event.options.min_team_size;
            LET $max_team_size = $event.options.max_team_size;

            // Not eligable if any of the checks do not pass
            LET $not_eligable = array::any([
                ($min_pool_size && (array::len($eligable) < $min_pool_size)),
                ($min_team_size && (array::len($players) < $min_team_size)),
                ($max_team_size && (array::len($players) > $max_team_size)),
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
