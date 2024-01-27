import React, { SVGProps } from 'react';
import PatternDoodle from '../../public/patterns/doodle.svg';
import PatternMemphis from '../../public/patterns/memphis.svg';
import PatternTriangles from '../../public/patterns/triangles.svg';

export type PatternName = keyof typeof patterns;
const patterns = {
    doodle: PatternDoodle,
    memphis: PatternMemphis,
    triangles: PatternTriangles,
} as const;

export function stringToPattern(str: string): PatternName {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const keys = Object.keys(patterns) as PatternName[];
    return keys[Math.abs(hash % keys.length)];
}

export function Pattern({
    input,
    pattern,
    ...props
}: (
    | {
          input?: never;
          pattern: PatternName;
      }
    | {
          input: string;
          pattern?: never;
      }
) &
    Partial<SVGProps<SVGElement>>) {
    const Pattern = patterns[pattern ?? stringToPattern(input)];
    return <Pattern {...props} />;
}
