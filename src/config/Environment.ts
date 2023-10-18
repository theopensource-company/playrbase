import { FeatureFlags } from '@theopensource-company/feature-flags';

export const Environment = ['prod', 'production', undefined].includes(
    process.env.NEXT_PUBLIC_ENV
)
    ? 'prod'
    : 'dev';

export const Deployed =
    process.env.NEXT_PUBLIC_DEPLOYMENT_STATUS === 'deployed';
export const Preview = Environment != 'prod' && Deployed;

/////////////////////////////////////
///             Schema            ///
/////////////////////////////////////

export const schema = {
    preLaunchPage: {
        options: [false, true],
    },
    devTools: {
        options: [false, true],
    },
    switchLanguage: {
        options: [true, false],
    },
    migrateDatabase: {
        options: [false, true],
        readonly: true,
    },
    localEmail: {
        options: [false, true],
        readonly: true,
    },
} as const;

export const featureFlags = new FeatureFlags({
    schema,
    environment: Preview ? 'preview' : Environment,
    defaults: {
        prod: {
            preLaunchPage: true,
        },
        dev: {
            devTools: true,
            migrateDatabase: true,
            localEmail: true,
        },
        preview: {},
    },
    overrides: (flag) => {
        const parse = (v: string) => {
            const lower = v?.toLowerCase();
            return lower === 'true'
                ? true
                : lower === 'false'
                ? false
                : !v || isNaN(+v)
                ? v
                : parseInt(v);
        };

        if (typeof window !== 'undefined') {
            const v = localStorage.getItem(`playrbase_fflag_${flag}`);
            if (v) return parse(v);
        }

        if (process.env[`NEXT_PUBLIC_FFLAG_${flag.toUpperCase()}`]) {
            const v = process.env[`NEXT_PUBLIC_FFLAG_${flag.toUpperCase()}`];
            if (v) return parse(v);
        }
    },
    subscription: (flag, value) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(`playrbase_fflag_${flag}`, `${value}`);
        }
    },
});
