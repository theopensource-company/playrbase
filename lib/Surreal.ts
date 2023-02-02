import AwaitedSurreal from '@theopensource-company/awaited-surrealdb';

export const SurrealEndpoint = `${
    process.env.NEXT_PUBLIC_SURREAL_ENDPOINT ?? 'https://euc1-1-db.kards.social'
}/rpc`;
export const SurrealNamespace =
    process.env.NEXT_PUBLIC_SURREAL_NAMESPACE ?? 'playrbase';
export const SurrealDatabase =
    process.env.NEXT_PUBLIC_SURREAL_DATABASE ?? 'playrbase-deployment_unknown';

export const SurrealInstance = new AwaitedSurreal({
    endpoint: SurrealEndpoint,
    namespace: SurrealNamespace,
    database: SurrealDatabase,
});

export function buildTableFilters<TRecord = unknown>(
    mapper: (
        property: keyof TRecord,
        record: Partial<TRecord>
    ) => Promise<string>
) {
    return async function (filters: Partial<TRecord>) {
        if (Object.keys(filters ?? {}).length == 0) return '';
        const result = (
            await Promise.all(
                (Object.keys(filters ?? {}) as (keyof TRecord)[]).map((p) =>
                    mapper(p, filters)
                )
            )
        )
            .filter((a) => !!a)
            .join(' AND ');

        return `WHERE ${result}`;
    };
}
