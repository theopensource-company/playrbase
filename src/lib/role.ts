export const ordered_roles = [
    'owner',
    'administrator',
    'event_manager',
    'event_viewer',
] as const;

export type Role = (typeof ordered_roles)[number];

export function sort_roles(roles: Role[], order: 'asc' | 'desc' = 'desc') {
    return roles.sort((a, b) =>
        order === 'asc'
            ? ordered_roles.indexOf(b) - ordered_roles.indexOf(a)
            : ordered_roles.indexOf(a) - ordered_roles.indexOf(b)
    );
}
