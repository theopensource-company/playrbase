import { Team, TeamAnonymous } from '@/schema/resources/team';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { buildTableFilters, isNoneValue, useSurreal } from '../Surreal';

export const buildTeamFilters = buildTableFilters<Team>(
    async (property, filters) => {
        const computeValue = () =>
            isNoneValue(property, filters) ? 'NONE' : `$filters.${property}`;

        switch (property) {
            default:
                return `${property} = ${computeValue()}`;
        }
    }
);

export const useTeams = (filters: Partial<Team> = {}) => {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['teams', filters],
        queryFn: async () => {
            const result = await surreal.query<[Team[]]>(
                `SELECT * FROM team ${await buildTeamFilters(
                    filters
                )} ORDER BY created ASC`,
                { filters }
            );

            if (!result?.[0]) return null;
            return z.array(Team).parse(result[0]);
        },
    });
};

export const useTeam = <T extends TeamAnonymous = TeamAnonymous>(filters: {
    id?: Team['id'];
    slug?: Team['slug'];
}) => {
    const surreal = useSurreal();
    return useQuery({
        queryKey: ['team', filters],
        queryFn: async () => {
            const result = await surreal.query<[T[]]>(
                `SELECT * FROM team ${await buildTeamFilters(filters)}`,
                { filters }
            );

            if (!result?.[0]?.[0]) return null;
            return TeamAnonymous.parse(result[0][0]) as T;
        },
    });
};

export const useUpdateTeam = (id: Team['id']) => {
    const surreal = useSurreal();
    return useMutation({
        mutationKey: ['team', id],
        mutationFn: async (
            changes: Partial<
                Pick<Team, 'name' | 'description' | 'logo' | 'banner' | 'slug'>
            >
        ) => {
            const result = await surreal.merge<Team, typeof changes>(
                id,
                changes
            );

            if (!result?.[0]) return null;
            return Team.parse(result[0]);
        },
    });
};
