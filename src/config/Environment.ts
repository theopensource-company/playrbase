export const Environment = (process.env.NEXT_PUBLIC_ENV ?? 'prod') as TEnv;
export const Deployed =
    process.env.NEXT_PUBLIC_DEPLOYMENT_STATUS === 'deployed';
export const Preview = Environment != 'prod' && Deployed;

const hasFFValue = (v: unknown): v is FeatureFlagValue =>
    ['string', 'number', 'boolean'].includes(typeof v);

/////////////////////////////////////
///             Schema            ///
/////////////////////////////////////

export const featureFlagSchema = {
    preLaunchPage: {
        options: [false, true] as const,
    },
    devTools: {
        options: [false, true] as const,
    },
    switchLanguage: {
        options: [true, false] as const,
    },
    migrateDatabase: {
        options: [false, true] as const,
        readonly: true,
    },
    localEmail: {
        options: [false, true] as const,
        readonly: true,
    },
} satisfies FeatureFlagSchema;

/////////////////////////////////////
///         Environmental         ///
/////////////////////////////////////

export const featureFlagDefaults = {
    prod: {
        preLaunchPage: true,
    },
    dev: {
        devTools: true,
        migrateDatabase: true,
        localEmail: true,
    },
    preview: {},
} satisfies FeatureFlagDefaults;

/////////////////////////////////////
///            Helpers            ///
/////////////////////////////////////

const featureFlagFromEnv = (flag: FeatureFlag): FeatureFlagValue | void => {
    const schema = featureFlagSchema[flag];
    if ('readonly' in schema && schema.readonly) return undefined;
    if (process.env[`NEXT_PUBLIC_FFLAG_${flag.toUpperCase()}`]) {
        const v = process.env[`NEXT_PUBLIC_FFLAG_${flag.toUpperCase()}`];
        const lower = v?.toLowerCase();
        return lower === 'true'
            ? true
            : lower === 'false'
            ? false
            : !v || isNaN(+v)
            ? v
            : parseInt(v);
    }
};

const featureFlagDefault = (flag: FeatureFlag): FeatureFlagValue => {
    const envFlags = featureFlagDefaults[Preview ? 'preview' : Environment];
    return flag in envFlags
        ? envFlags[flag as keyof typeof envFlags]
        : featureFlagSchema[flag].options[0];
};

export const featureFlagOptions = Object.keys(
    featureFlagSchema
) as FeatureFlag[];

export const featureFlags = featureFlagOptions.reduce((prev, flag) => {
    const fromEnv = featureFlagFromEnv(flag);
    return {
        ...prev,
        [flag]: hasFFValue(fromEnv) ? fromEnv : featureFlagDefault(flag),
    } as FeatureFlags;
}, {} as FeatureFlags);

/////////////////////////////////////
///             Types             ///
/////////////////////////////////////

export type TEnv = 'dev' | 'prod';
export type FeatureFlagValue = boolean | number | string;
export type FeatureFlagSchema = Record<
    string,
    {
        readonly?: boolean;
        options: readonly [FeatureFlagValue, ...FeatureFlagValue[]];
    }
>;

export type FeatureFlags = {
    [T in FeatureFlag]: FeatureFlagOption<T>;
};

export type FeatureFlagDefaults = Record<
    TEnv | 'preview',
    Partial<FeatureFlags>
>;

export type FeatureFlag = keyof typeof featureFlagSchema;
export type FeatureFlagOption<TFeatureFlag extends FeatureFlag> =
    (typeof featureFlagSchema)[TFeatureFlag]['options'][number];
