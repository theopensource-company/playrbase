import {
    OrganisationManagerRolesHierarchy,
    TOrganisationRecord,
} from '../constants/Types/Organisation.types';

export const FilterOrganisationManagers = (
    managers: TOrganisationRecord['managers']
) =>
    managers
        .filter(
            (manager) =>
                !managers.find(
                    (m) =>
                        m.id == manager.id &&
                        OrganisationManagerRolesHierarchy[manager.role] >
                            OrganisationManagerRolesHierarchy[m.role]
                )
        )
        .sort((a, b) =>
            OrganisationManagerRolesHierarchy[a.role] >
            OrganisationManagerRolesHierarchy[b.role]
                ? 1
                : -1
        );
