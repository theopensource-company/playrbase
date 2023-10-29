'use client';

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu.tsx';
import { featureFlags } from '@/config/Environment.ts';
import { useAuth } from '@/lib/auth';
import { useScrolledState } from '@/lib/scrolled.tsx';
import { cn } from '@/lib/utils.ts';
import { Language, languages } from '@/locales/languages.ts';
import {
    AlignRight,
    ChevronRightSquare,
    Languages,
    LogOut,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next-intl/client';
import Link from 'next-intl/link';
import Image from 'next/image';
import React, {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';
import ReactCountryFlag from 'react-country-flag';
import LogoFull from '../../assets/LogoFull.svg';
import { Profile } from '../cards/profile.tsx';
import { Button } from '../ui/button.tsx';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet.tsx';
import { Skeleton } from '../ui/skeleton.tsx';
import Container from './Container.tsx';
import { DevTools } from './DevTools/index.tsx';

export const Navbar = ({ children }: { children?: ReactNode }) => {
    const scrolled = useScrolledState();

    // Enabled in prod/preview with:
    // localStorage.setItem('devTools', 'enabled')
    // Then reload page
    const [devTools, setDevTools] = useState(featureFlags.store.devTools);
    useEffect(() => {
        if (localStorage.getItem('devTools') == 'enabled') {
            setDevTools(true);
        }
    }, [setDevTools]);

    return (
        <div className={cn('fixed left-0 right-0 z-10 backdrop-blur-lg')}>
            <Container
                className={cn(
                    'flex items-center justify-between transition-height',
                    scrolled
                        ? children
                            ? 'mt-2 h-14'
                            : 'h-16'
                        : children
                        ? 'mb-1 mt-3 h-24'
                        : 'h-36'
                )}
            >
                <Link href="/">
                    <Image
                        src={LogoFull}
                        alt="Logo"
                        className={cn(
                            'w-min transition-height',
                            scrolled ? 'h-9' : 'h-10 sm:h-12'
                        )}
                    />
                </Link>
                <div className="flex gap-4">
                    <div className="hidden md:block">
                        <Links devTools={devTools} />
                    </div>
                    <div className="block md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline">
                                    <AlignRight size="24" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <div className="p-4">
                                    <Link href="/">
                                        <Image
                                            src={LogoFull}
                                            alt="Logo"
                                            className="h-10 w-min sm:h-12"
                                        />
                                    </Link>
                                    <Links devTools={devTools} />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </Container>
            {children}
        </div>
    );
};

const Links = ({ devTools }: { devTools: boolean }) => {
    const { loading, user } = useAuth();
    const t = useTranslations('components.layout.navbar.links');

    return (
        <NavigationMenu className="max-sm:justify-start max-sm:pt-8">
            <NavigationMenuList className="flex flex-col items-start gap-4 space-x-0 md:flex-row md:items-center">
                <NavigationMenuItem>
                    {loading ? (
                        <Skeleton className="h-10 w-24" />
                    ) : user ? (
                        <>
                            <NavigationMenuTrigger className="bg-transparent">
                                <ChevronRightSquare className="mr-2 md:hidden" />
                                {user.name.split(' ')[0]}
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <AccountOptions />
                            </NavigationMenuContent>
                        </>
                    ) : (
                        <Link href="/account" legacyBehavior passHref>
                            <NavigationMenuLink
                                className={cn(
                                    navigationMenuTriggerStyle(),
                                    'bg-transparent'
                                )}
                            >
                                <ChevronRightSquare className="mr-2 md:hidden" />
                                {t('account')}
                            </NavigationMenuLink>
                        </Link>
                    )}
                </NavigationMenuItem>
                {featureFlags.store.switchLanguage && (
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className="bg-transparent">
                            <Languages size={20} />
                            <span className="ml-2 md:hidden">
                                {t('language')}
                            </span>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <LanguageOptions />
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                )}
                {devTools && <DevTools />}
            </NavigationMenuList>
        </NavigationMenu>
    );
};

const AccountOptions = () => {
    const { user, loading, signout } = useAuth();
    const t = useTranslations('components.layout.navbar.account-options');

    return (
        user && (
            <ul className="grid gap-6 p-6">
                <NavigationMenuItem>
                    <Link href="/account" legacyBehavior passHref>
                        <NavigationMenuLink
                            className={cn(
                                navigationMenuTriggerStyle(),
                                'h-18 max-sm:bg-muted'
                            )}
                        >
                            <Profile
                                profile={user}
                                loading={loading}
                                size="small"
                            />
                        </NavigationMenuLink>
                    </Link>
                </NavigationMenuItem>
                <NavigationMenuItem asChild>
                    <Button variant="destructive" onClick={signout}>
                        <LogOut className="mr-2" size={18} />
                        {t('signout')}
                    </Button>
                </NavigationMenuItem>
            </ul>
        )
    );
};

const LanguageOptions = () => {
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('languages');

    return (
        <ul className="grid gap-3 p-6">
            {Object.entries(languages).map(([lang, { native, flag }]) => (
                <NavigationMenuItem key={lang}>
                    <Link href={pathname} locale={lang} legacyBehavior passHref>
                        <NavigationMenuLink
                            className={cn(
                                navigationMenuTriggerStyle(),
                                'flex h-16 w-full justify-start gap-5 whitespace-nowrap',
                                lang == locale && 'bg-muted'
                            )}
                        >
                            <ReactCountryFlag
                                className="h-8 w-8"
                                countryCode={flag}
                                style={{
                                    width: undefined,
                                    height: undefined,
                                }}
                                svg
                            />
                            <div className="pr-8 lg:pr-12">
                                <h3 className="text-lg text-foreground">
                                    {t(lang as Language)}
                                </h3>
                                <h4>
                                    {lang == locale ? (
                                        <i>{t('current')}</i>
                                    ) : (
                                        native
                                    )}
                                </h4>
                            </div>
                        </NavigationMenuLink>
                    </Link>
                </NavigationMenuItem>
            ))}
        </ul>
    );
};

const NavbarSubLinksContext = createContext('/');

export function NavbarSubLinks({
    baseUrl,
    children,
}: {
    baseUrl: string;
    children: ReactNode;
}) {
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return (
        <NavbarSubLinksContext.Provider value={baseUrl}>
            <div className="border-b-2 border-muted">
                <Container className="flex pt-1">{children}</Container>
            </div>
        </NavbarSubLinksContext.Provider>
    );
}

export function NavbarSubLink({
    link,
    href,
    children,
}: {
    link?: string;
    href?: string;
    children: ReactNode;
}) {
    const pathname = usePathname();
    const baseUrl = useContext(NavbarSubLinksContext);

    let url: string = baseUrl;
    if (link) {
        link = link.startsWith('/') ? link.slice(1) : link;
        url = `${baseUrl}/${link}`;
    } else if (href) {
        url = href;
    }

    const active = pathname.endsWith(url);

    return (
        <div className="space-y-1">
            <Link
                href={url}
                className={cn(
                    'inline-flex h-8 w-max items-center justify-center rounded-md bg-transparent px-2.5 py-2 text-sm font-medium transition-colors hover:bg-accent/80 hover:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50',
                    active ? 'text-accent-foreground' : 'text-muted-foreground'
                )}
            >
                {children}
            </Link>
            {active && <div className="mx-2.5 border-b-2 border-white" />}
        </div>
    );
}
