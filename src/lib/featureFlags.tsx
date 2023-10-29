'use client';

import { featureFlags, parseValueFromString } from '@/config/Environment';
import {
    FeatureFlagProvider,
    featureFlagsHookFactory,
} from '@theopensource-company/feature-flags/react';
import React, { ReactNode } from 'react';

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
    featureFlags.subscribe((flag, value) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(`playrbase_fflag_${flag}`, `${value}`);
        }
    });

    return (
        <FeatureFlagProvider
            featureFlags={featureFlags}
            hydratedOverrides={(flag) => {
                if (typeof window !== 'undefined') {
                    const v = localStorage.getItem(`playrbase_fflag_${flag}`);
                    if (v) return parseValueFromString(v);
                }
            }}
        >
            {children}
        </FeatureFlagProvider>
    );
}

export const useFeatureFlags = featureFlagsHookFactory(featureFlags);
