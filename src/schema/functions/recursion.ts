const recursion = /* surrealql */ `
    DEFINE FUNCTION fn::recursion::event::computed(
        $doc: object
    ) {
        RETURN {
            description: $doc.description OR $doc.tournament.computed.description OR "",
            logo: $doc.logo OR $doc.tournament.computed.logo,
            banner: $doc.banner OR $doc.tournament.computed.banner,
            tournament: $doc.tournament.computed.tournament OR $doc.tournament,
        }
    };

    DEFINE FUNCTION fn::recursion::organisation::managers(
        $org: record<organisation>,
        $part_of: option<record<organisation>>
    ) {
        -- Grab the role and user ID
        LET $local = SELECT role, in AS user, id as edge FROM $org<-manages.*;

        -- Add an org field describing from which org these members are inherited, if not already inherited before
        LET $inherited = SELECT *, org OR $parent.part_of AS org FROM ($part_of.managers || []);

        -- Return the combined result
        RETURN array::concat($local, $inherited);
    };

    DEFINE FUNCTION fn::recursion::team::players(
        $team: record<team>
    ) {
        -- Find all confirmed players of this team
        RETURN $team<-plays_in<-user;
    };
`;

export default recursion;
