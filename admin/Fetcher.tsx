import {
    CreateResult,
    DataProvider,
    DeleteManyResult,
    DeleteResult,
    RaRecord,
    UpdateManyResult,
    UpdateResult,
} from 'ra-core';
import { RawQueryResult } from 'surrealdb.js/types/types';
import { SurrealInstanceAdmin as surreal } from './Surreal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SelectFilterBuilder(filters: any) {
    let result = `ORDER BY ${filters._sort} ${filters._order ?? 'DESC'}`;
    if (filters.end) result += ` LIMIT BY ${filters.end}`;
    if (filters.start && filters.start > 0)
        result += ` START AT ${filters.start}`;
    return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ParseUpdatedData<TData extends RaRecord = any>(data: TData) {
    return Object.keys(data)
        .map((key) => {
            const val = data[key];
            switch (key) {
                case 'id':
                case 'created':
                case 'updated':
                    return null;
                case 'password':
                    return val
                        ? `password=crypto::argon2::generate("${val}")`
                        : null;
                default:
                    return `${key}=${JSON.stringify(val)}`;
            }
        })
        .filter((a) => !!a);
}

export const Fetcher = (): DataProvider => ({
    getList: (resource, params) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const start = (page - 1) * perPage;
        const limit = page * perPage - start;
        const { q } = params.filter;
        const queryFields = params.meta?.fields;
        console.log(params);

        const query = `
            SELECT 
                *, 
                count((select id from ${resource})) as total 
            FROM ${resource} 
            ${
                q?.length > 0 && queryFields?.length > 0
                    ? `WHERE ${[...queryFields]
                          .map(
                              (field) =>
                                  `${field} ~ "${q.replaceAll('"', '\\"')}"`
                          )
                          .join(' OR ')}`
                    : ''
            }
            ORDER BY ${field} ${order} 
            LIMIT BY ${limit} 
            ${start > 0 ? `START AT ${start}` : ''}`;

        console.log(query);

        return surreal
            .query<[RawQueryResult[]]>(query, { query: q })
            .then((result) => {
                if (result[0]?.result) {
                    let total = 0;
                    const data =
                        result &&
                        result[0].result &&
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        result[0].result.map((user: any) => {
                            total = user.total;
                            delete user.total;
                            return user;
                        });

                    return {
                        data,
                        total,
                    };
                } else {
                    throw new Error('An issue occured while fetching data');
                }
            });
    },

    getOne: (resource, params) => {
        const query = `SELECT * FROM ${resource} WHERE id="${params.id}"`;
        return surreal.query<[RawQueryResult[]]>(query).then((result) => {
            if (result[0]?.result) {
                return {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data: (result[0]?.result[0] as any) ?? {},
                };
            } else {
                throw new Error('An issue occured while fetching data');
            }
        });
    },

    getMany: (resource, params) => {
        const query = `SELECT * FROM ${resource} WHERE ${JSON.stringify(
            params.ids
        )} CONTAINS id`;
        return surreal.query<[RawQueryResult[]]>(query).then((result) => {
            if (result[0]?.result) {
                return {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data: (result[0]?.result as any) ?? [],
                };
            } else {
                throw new Error('An issue occured while fetching data');
            }
        });
    },

    getManyReference: (resource, params) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const start = (page - 1) * perPage;
        const limit = page * perPage - start;
        const query = `SELECT *, count((select id from ${resource} WHERE ${
            params.target
        } = ${JSON.stringify(params.id)})) as total FROM ${resource} WHERE ${
            params.target
        } = ${JSON.stringify(
            params.id
        )} ORDER BY ${field} ${order} LIMIT BY ${limit} ${
            start > 0 ? `START AT ${start}` : ''
        }`;

        return surreal.query<[RawQueryResult[]]>(query).then((result) => {
            if (result[0]?.result) {
                let total = 0;
                const data =
                    result &&
                    result[0].result &&
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    result[0].result.map((user: any) => {
                        total = user.total;
                        delete user.total;
                        return user;
                    });

                return {
                    data,
                    total,
                };
            } else {
                throw new Error('An issue occured while fetching data');
            }
        });
    },

    update: (_resource, params) => {
        const query = `UPDATE ${params.data.id} SET ${ParseUpdatedData(
            params.data as RaRecord
        ).join(', ')}`;

        return surreal.query<[RawQueryResult[]]>(query).then((result) => {
            if (result[0]?.result) {
                return Promise.resolve({
                    data: result[0]?.result[0],
                } as UpdateResult);
            } else {
                console.error(result);
                throw new Error('An issue occured while updating data');
            }
        });
    },

    updateMany: (resource, params) => {
        const query = `UPDATE ${resource} SET ${ParseUpdatedData(
            params.data as RaRecord
        ).join(', ')} WHERE ${JSON.stringify(params.ids)} CONTAINS id`;

        return surreal
            .query<
                [
                    (RawQueryResult & {
                        id?: string;
                    })[]
                ]
            >(query)
            .then((result) => {
                if (result[0]?.result) {
                    return Promise.resolve({
                        data: result[0]?.result
                            .map((rec) => rec.id)
                            .filter((a) => !!a),
                    } as UpdateManyResult);
                } else {
                    console.error(result);
                    throw new Error('An issue occured while updating data');
                }
            });
    },

    create: (resource, params) => {
        const query = `CREATE ${resource} SET ${ParseUpdatedData(
            params.data as RaRecord
        ).join(', ')}`;

        return surreal.query<[RawQueryResult[]]>(query).then((result) => {
            if (result[0]?.result) {
                return Promise.resolve({
                    data: result[0]?.result[0],
                } as CreateResult);
            } else {
                console.error(result);
                throw new Error('An issue occured while updating data');
            }
        });
    },

    delete: (_resource, params) => {
        const query = `DELETE ${params.id}`;

        return surreal.query<[RawQueryResult[]]>(query).then((result) => {
            if (result[0]?.result) {
                return Promise.resolve({
                    data: result[0]?.result[0],
                } as DeleteResult);
            } else {
                console.error(result);
                throw new Error('An issue occured while updating data');
            }
        });
    },

    deleteMany: (resource, params) => {
        const query = `DELETE ${resource} WHERE ${JSON.stringify(
            params.ids
        )} CONTAINS id`;

        return surreal
            .query<
                [
                    (RawQueryResult & {
                        id?: string;
                    })[]
                ]
            >(query)
            .then((result) => {
                if (result[0]?.result) {
                    return Promise.resolve({
                        data: result[0]?.result
                            .map((rec) => rec.id)
                            .filter((a) => !!a),
                    } as DeleteManyResult);
                } else {
                    console.error(result);
                    throw new Error('An issue occured while updating data');
                }
            });
    },
});

export default Fetcher;
