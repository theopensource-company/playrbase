import { TAnyID } from './Common.types';

export type TLogID = `log:${string}`;
export type TLogRecord<TIDType = TAnyID> = {
    id: TLogID;
    from?: string;
    to?: string;
    details: object;
    event: TLogEvent;
    field: TIDType;
};

export type TLogEvent =
    | string
    | `${string}_${string}`
    | `${string}_${string}_${string}`
    | `${string}_${string}_${string}_${string}`;
// Usually not more than 4 segments, can be expanded as needed.
