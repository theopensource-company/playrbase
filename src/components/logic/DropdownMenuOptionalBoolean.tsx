import React, { Dispatch, SetStateAction, useState } from 'react';
import {
    DropdownMenuCheckboxItem,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '../ui/dropdown-menu';

export function useOptionalBoolean(defaultValue?: boolean) {
    return useState<boolean | undefined>(defaultValue);
}

export function DropdownMenuOptionalBoolean({
    value,
    onValueChange,
    title,
    options,
}: {
    value: boolean | undefined;
    onValueChange: Dispatch<SetStateAction<boolean | undefined>>;
    title: string;
    options: {
        undefined: string;
        true: string;
        false: string;
    };
}) {
    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>{title}</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuCheckboxItem
                        checked={value == undefined}
                        onCheckedChange={(v) => v && onValueChange(undefined)}
                    >
                        {options.undefined}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={value == true}
                        onCheckedChange={(v) => v && onValueChange(true)}
                    >
                        {options.true}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                        checked={value == false}
                        onCheckedChange={(v) => v && onValueChange(false)}
                    >
                        {options.false}
                    </DropdownMenuCheckboxItem>
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    );
}
