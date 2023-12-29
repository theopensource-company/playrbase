'use client';
import { RichTranslationValues } from 'next-intl';
import React from 'react';

export const defaultTranslationValues = {
    b: (children) => <b>{children}</b>,
    i: (children) => <i>{children}</i>,
    u: (children) => <u>{children}</u>,
    br: () => <br />,
} satisfies RichTranslationValues;
