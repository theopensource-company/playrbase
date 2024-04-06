'use client';
import { brand_description, brand_name } from '@/lib/branding';
import { RichTranslationValues } from 'next-intl';
import React from 'react';

export const defaultTranslationValues = {
    b: (children) => <b>{children}</b>,
    i: (children) => <i>{children}</i>,
    u: (children) => <u>{children}</u>,
    br: () => <br />,
    brand_name,
    brand_description,
} satisfies RichTranslationValues;
