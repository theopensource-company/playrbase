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
import { useAuth } from '@/lib/auth';
import { useFeatureFlags } from '@/lib/featureFlags.tsx';
import { useScrolledContext, useScrolledState } from '@/lib/scrolled.tsx';
import { cn } from '@/lib/utils.ts';
import { Language, languageEntries } from '@/locales/languages.ts';
import { Link, usePathname } from '@/locales/navigation.ts';
import { ChevronRightSquare, Languages, LogOut, Menu } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import React, {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import ReactCountryFlag from 'react-country-flag';
import * as portals from 'react-reverse-portal';
import LogoFull from '../../assets/LogoFull.svg';
import { Profile } from '../cards/profile.tsx';
import { Button } from '../ui/button.tsx';
import { Skeleton } from '../ui/skeleton.tsx';
import Container from './Container.tsx';
import { DevTools } from './DevTools/index.tsx';

export const NavbarContext = createContext<portals.HtmlPortalNode | undefined>(
    undefined
);

export function NavbarProvider({ children }: { children?: ReactNode }) {
    const portal = useMemo(() => {
        if (typeof window !== 'undefined') {
            return portals.createHtmlPortalNode();
        }
    }, []);

    return (
        <NavbarContext.Provider value={portal}>
            {portal ? (
                <portals.InPortal node={portal}>
                    <RenderNavbar />
                </portals.InPortal>
            ) : (
                <RenderNavbar />
            )}
            {children}
        </NavbarContext.Provider>
    );
}

export function Navbar({ children }: { children?: ReactNode }) {
    const [onClient, setOnClient] = useState(false);
    const portal = useContext(NavbarContext);

    useEffect(() => {
        setOnClient(true);
    }, []);

    if (!portal || !onClient) return null;
    return <portals.OutPortal node={portal}>{children}</portals.OutPortal>;
}

export const RenderNavbar = ({ children }: { children?: ReactNode }) => {
    const scrolled = useScrolledState();
    const [featureFlags] = useFeatureFlags();
    const [open, setOpen] = useState(false);

    // Enabled in prod/preview with:
    // localStorage.setItem('playrbase_fflag_devTools', 'true')
    // Then reload page

    const links = <Links devTools={featureFlags.devTools} setOpen={setOpen} />;

    return (
        <div
            className={cn(
                'fixed left-0 right-0 z-10 backdrop-blur-lg transition-all',
                open && 'max-md:h-screen max-md:bg-black'
            )}
        >
            <Container
                className={cn(
                    'flex justify-between transition-height max-md:flex-col md:items-center',
                    scrolled
                        ? children
                            ? 'mt-2 md:h-14'
                            : 'md:h-16'
                        : children
                        ? 'mb-1 mt-3 md:h-24'
                        : 'md:h-36'
                )}
            >
                <div className="flex items-center justify-between max-md:my-4 max-md:w-full">
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
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(!open)}
                        className="md:hidden"
                    >
                        <Menu />
                    </Button>
                </div>
                <div className="max-md:hidden">{links}</div>
            </Container>
            {children}
            <div
                className={cn(
                    'overflow-hidden md:hidden',
                    open ? 'h-full' : 'h-0'
                )}
            >
                <Container className="py-2">{links}</Container>
            </div>
        </div>
    );
};

const Links = ({
    devTools,
    setOpen,
}: {
    devTools: boolean;
    setOpen: (open: boolean) => void;
}) => {
    const { loading, user } = useAuth();
    const t = useTranslations('components.layout.navbar.links');
    const [featureFlags] = useFeatureFlags();

    const [state, setState] = useState('');
    const preventHover = (e: unknown) => {
        if (!state.startsWith('radix') || window.innerWidth < 768) {
            (e as Event).preventDefault();
        }
    };

    const hoverOptions = {
        onPointerMove: preventHover,
        onPointerLeave: preventHover,
    };

    const pathname = usePathname();
    const pathnameRef = useRef(pathname);
    const authenticatedRef = useRef(!!user);
    useEffect(() => {
        if (
            pathname !== pathnameRef.current ||
            !!user !== authenticatedRef.current
        ) {
            pathnameRef.current = pathname;
            authenticatedRef.current = !!user;
            setState('');
            setOpen(false);
        }
    }, [setState, setOpen, pathname, user]);

    return (
        <NavigationMenu
            className="max-sm:justify-start"
            value={state}
            onValueChange={setState}
        >
            <NavigationMenuList className="flex flex-col items-start gap-4 space-x-0 max-md:py-4 md:flex-row md:items-center">
                <NavigationMenuItem>
                    {loading ? (
                        <Skeleton className="h-10 w-24" />
                    ) : user ? (
                        <>
                            <NavigationMenuTrigger
                                className="data-[state:open]:bg-muted bg-transparent hover:bg-accent focus:bg-transparent focus:hover:bg-accent active:bg-muted"
                                {...hoverOptions}
                            >
                                <ChevronRightSquare className="mr-2 md:hidden" />
                                {user.name.split(' ')[0]}
                            </NavigationMenuTrigger>
                            <NavigationMenuContent {...hoverOptions}>
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
                {featureFlags.switchLanguage && (
                    <NavigationMenuItem>
                        <NavigationMenuTrigger
                            className="data-[state:open]:bg-muted bg-transparent hover:bg-accent focus:bg-transparent focus:hover:bg-accent active:bg-muted"
                            {...hoverOptions}
                        >
                            <Languages size={20} />
                            <span className="ml-2 md:hidden">
                                {t('language')}
                            </span>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent {...hoverOptions}>
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
            {languageEntries.map(([lang, { native, flag }]) => (
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
                <Container className="flex overflow-x-auto pt-1">
                    {children}
                </Container>
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

    const active =
        url == baseUrl ? pathname.endsWith(url) : pathname.startsWith(url);

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
            <div
                className={cn(
                    'mx-2.5 border-b-2',
                    active ? 'border-white' : 'border-transparent'
                )}
            />
        </div>
    );
}

export function NavbarHeightOffset() {
    const { scrolled, mobile } = useScrolledContext();
    return (
        <div
            className={cn(
                'transition-height',
                mobile ? 'h-28' : scrolled ? 'h-24' : 'h-36'
            )}
        />
    );
}
