import { UserIdentity } from 'ra-core';
import { TManagerRecord } from '../constants/Types/Manager.types';
import { SurrealDatabase, SurrealNamespace } from '../lib/Surreal';
import { SurrealInstanceManager, SurrealQueryManager } from './Surreal';

export const ManagerUserDetails = async (): Promise<TManagerRecord | null> => {
    const result = await SurrealQueryManager<TManagerRecord>(
        'SELECT * FROM manager WHERE id = $auth.id'
    );
    const preParse =
        result && result[0].result ? result[0].result[0] : null ?? null;
    if (preParse) {
        preParse.created = new Date(preParse.created);
        preParse.updated = new Date(preParse.updated);
    }

    return preParse;
};

const authProvider = {
    login: ({ username, password }: { username: string; password: string }) => {
        return SurrealInstanceManager.signin({
            NS: SurrealNamespace,
            DB: SurrealDatabase,
            SC: 'manager',
            identifier: username,
            password,
        })
            .then((res) => {
                localStorage.setItem('pmgrsess', res);
                return Promise.resolve();
            })
            .catch((error) => {
                throw new Error(error);
            });
    },
    checkError: () => {
        // Required for the authentication to work
        return Promise.resolve();
    },
    checkAuth: () => {
        return ManagerUserDetails().then((res) =>
            res ? Promise.resolve() : Promise.reject()
        );
    },
    getPermissions: () => {
        // Required for the authentication to work
        return Promise.resolve();
    },
    logout: async () => {
        console.log('logout');

        localStorage.removeItem('pmgrsess');
        ManagerUserDetails().then((res) => {
            //TODO: Temporary fix for session not being invalidated
            if (res) location.reload();
        });
    },
    getIdentity: () => {
        return ManagerUserDetails().then((res) => {
            if (!res) return Promise.reject('Not authenticated');
            return Promise.resolve({
                id: res.id,
                fullname: res.name,
            } as UserIdentity);
        });
    },
};

export default authProvider;
