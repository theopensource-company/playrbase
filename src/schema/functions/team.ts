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
`;

export default team;
