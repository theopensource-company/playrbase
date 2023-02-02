import { TEmail, TPersonFullname } from './Common.types';

export type TPlayerID = `player:${string}`;
export type TPlayerRecord = {
    id: TPlayerID;
    name: TPersonFullname;
    email: TEmail;
    created: Date;
    updated: Date;
};
