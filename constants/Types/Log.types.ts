import { TAnyID } from './Common.types';

export type TLogID = `log:${string}`;
export type TLogRecord<TIDType = TAnyID, TValueType = unknown> = {
    id: TLogID;
    record: TIDType;
    event: 'CREATE' | 'UPDATE' | 'DELETE';
    change?: {
        field: string;
        value?: {
            before: TValueType;
            after: TValueType;
        };
    };
    details?: Record<string, unknown>;
    created: Date;
};
