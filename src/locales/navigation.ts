import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { languageList } from './languages';

export const { Link, redirect, usePathname, useRouter } =
    createSharedPathnamesNavigation({ locales: languageList });
