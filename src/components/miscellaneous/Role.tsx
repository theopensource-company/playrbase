import { Role } from '@/lib/role';
import { useTranslations } from 'next-intl';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';

export function RoleName({ role }: { role: Role }) {
    const t = useTranslations('components.miscellaneous.role.name');
    return t(role);
}

export function RoleDescription({ role }: { role: Role }) {
    const t = useTranslations('components.miscellaneous.role.description');
    return t(role);
}

export function SelectRole({
    role,
    defaultRole,
    onRoleUpdate,
    disabled,
    className,
}: {
    role?: Role;
    defaultRole?: Role;
    onRoleUpdate?: (role: Role) => unknown;
    disabled?: boolean;
    className?: string;
}) {
    const t = useTranslations('components.miscellaneous.role.select');

    return (
        <Select
            value={role}
            onValueChange={onRoleUpdate}
            defaultValue={defaultRole}
            disabled={disabled}
        >
            <SelectTrigger className={className}>
                {role ? <RoleName role={role} /> : t('placeholder')}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="owner">
                    <div className="flex flex-col text-white">
                        <RoleName role="owner" />
                        <span className="max-w-sm text-sm text-muted-foreground">
                            <RoleDescription role="owner" />
                        </span>
                    </div>
                </SelectItem>
                <SelectItem value="administrator">
                    <div className="flex flex-col text-white">
                        <RoleName role="administrator" />
                        <span className="max-w-sm text-sm text-muted-foreground">
                            <RoleDescription role="administrator" />
                        </span>
                    </div>
                </SelectItem>
                <SelectItem value="event_manager">
                    <div className="flex flex-col text-white">
                        <RoleName role="event_manager" />
                        <span className="max-w-sm text-sm text-muted-foreground">
                            <RoleDescription role="event_manager" />
                        </span>
                    </div>
                </SelectItem>
                <SelectItem value="event_viewer">
                    <div className="flex flex-col text-white">
                        <RoleName role="event_viewer" />
                        <span className="max-w-sm text-sm text-muted-foreground">
                            <RoleDescription role="event_viewer" />
                        </span>
                    </div>
                </SelectItem>
            </SelectContent>
        </Select>
    );
}
