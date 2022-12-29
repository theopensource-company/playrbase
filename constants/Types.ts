/* ENVIRONMENT */

export type TEnvironment = 'prod' | 'dev';
export const FeatureFlagOptions = ['preLaunchPage', 'devTools'] as const;
export type TFeatureFlagOptions = typeof FeatureFlagOptions[number];

export type TFeatureFlags = {
    [key in TFeatureFlagOptions]: boolean;
};

/* Admin user types */

export type TEmail = `${string}@${string}.${string}`;
export type TAdminUserID = `user:${string}`;
export type TAdminUserDetails = {
    id: TAdminUserID;
    name: `${string} ${string}`; //It's not strict about what comes after it, but this way it must contain at least one space (first & lastname)
    email: TEmail;
    created: Date;
    updated: Date;
};
