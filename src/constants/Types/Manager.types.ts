import { TEmail, TPersonFullname } from './Common.types';

export type TManagerID = `manager:${string}`;
export type TManagerRecord = {
    id: TManagerID;
    name: TPersonFullname;
    email: TEmail;
    created: Date;
    updated: Date;
};
