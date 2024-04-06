import { brand_description, brand_name } from '@/lib/branding';

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
    name: brand_name,
    description: brand_description,
    mainNav: [
        {
            title: 'Home',
            href: '/',
        },
    ],
};
