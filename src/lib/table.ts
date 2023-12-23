export type Columns = Partial<Record<string, boolean>>;

export function doRenderCol<T extends Columns>(
    columns: T | undefined,
    col: keyof T
) {
    return columns?.[col] ?? true;
}

export function doRenderColFactory<T extends Columns>(columns?: T) {
    return (col: keyof T) => doRenderCol(columns, col);
}
