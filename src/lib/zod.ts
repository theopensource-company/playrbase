import { z } from 'zod';

export function record<
    Table extends string = string,
    Id extends string = string,
>(table?: Table, id?: Id) {
    const group = (val?: Table | Id) =>
        !val
            ? '([A-Za-z0-9_]+|`(\\\\`|[^`])+`|⟨(\\\\⟨|\\\\⟩|[^⟨⟩])+⟩)'
            : /^[A-Za-z0-9_]+$/.test(val)
              ? val
              : `(\`${val.replaceAll(
                    /(?<!\\)(`)/g,
                    '\\\\$1'
                )}\`|⟨${val.replaceAll(/(?<!\\)(⟨|⟩)/g, '\\\\$1')}⟩)`;

    const regex = (table?: Table, id?: Id) =>
        new RegExp(`^${group(table)}:${group(id)}$`);

    const test = (val: string, table?: Table, id?: Id) =>
        regex(table, id).test(val as string);

    return z.custom<`${Table}:${Id}`>(
        (val) => typeof val === 'string' && test(val, table, id),
        {
            message: [
                'Must be a record',
                table && `Table must be: "${table}"`,
                id && `Id must match: "${id}"`,
            ]
                .filter((a) => a)
                .join('; '),
        }
    );
}

export function fullname() {
    return z.custom<`${string} ${string}`>(
        (val) => typeof val === 'string' && val.trim().includes(' '),
        {
            message: 'Name must consist of a first and last name',
        }
    );
}

export const role = z.union([
    z.literal('owner'),
    z.literal('administrator'),
    z.literal('event_manager'),
    z.literal('event_viewer'),
]);
