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
import { useSurreal } from '@/lib/Surreal.tsx';
import { useAuth } from '@/lib/auth';
import { brand_name } from '@/lib/branding.ts';
import { useFeatureFlags } from '@/lib/featureFlags.tsx';
import { useIsMobileState, useScrolledState } from '@/lib/scrolled.tsx';
import { cn } from '@/lib/utils.ts';
import { Language, languageEntries } from '@/locales/languages.ts';
import { Link, usePathname } from '@/locales/navigation.ts';
import { Actor, linkToActorOverview } from '@/schema/resources/actor.ts';
import { Organisation } from '@/schema/resources/organisation.ts';
import { Team } from '@/schema/resources/team.ts';
import LogoLg from '@public/static/logo-lg.png';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { useQuery } from '@tanstack/react-query';
import {
    ChevronRightSquare,
    ChevronsUpDown,
    Languages,
    // LogOut,
    Menu,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
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
import { z } from 'zod';
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

export function Navbar({
    children,
    actor,
}: {
    children?: ReactNode;
    actor?: Actor;
}) {
    const [onClient, setOnClient] = useState(false);
    const portal = useContext(NavbarContext);

    useEffect(() => {
        setOnClient(true);
    }, []);

    if (!portal || !onClient) return null;
    return (
        <portals.OutPortal node={portal} actor={actor}>
            {children}
        </portals.OutPortal>
    );
}

export const RenderNavbar = ({
    children,
    actor,
}: {
    children?: ReactNode;
    actor?: Actor;
}) => {
    const scrolled = useScrolledState();
    const [featureFlags] = useFeatureFlags();
    const [open, setOpen] = useState(false);

    // Enabled in prod/preview with:
    // localStorage.setItem('playrbase_fflag_devTools', 'true')
    // Then reload page

    const links = (
        <Links
            devTools={featureFlags.devTools}
            setOpen={setOpen}
            actor={actor}
        />
    );

    return (
        <div
            className={cn(
                'fixed left-0 right-0 z-40 backdrop-blur-lg transition-all',
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
                <div className="flex max-w-full items-center justify-between max-md:my-4 max-md:w-full">
                    <Link href="/" className="max-w-min">
                        <Image
                            src={LogoLg}
                            alt={`${brand_name} logo`}
                            className={cn(
                                'max-w-min transition-height',
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
    actor,
    setOpen,
}: {
    devTools: boolean;
    actor?: Actor;
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
                <NavigationMenuItem className="mr-2">
                    {loading ? (
                        <div className="flex">
                            <Profile loading size="extra-tiny" noSub />
                            <Skeleton className="h-8 w-6" />
                        </div>
                    ) : user ? (
                        <>
                            <div className="flex items-center">
                                <Link href={linkToActorOverview(actor ?? user)}>
                                    <Profile
                                        profile={actor ?? user}
                                        size="extra-tiny"
                                        noSub
                                    />
                                </Link>
                                <NavigationMenuPrimitive.Trigger asChild>
                                    <Button
                                        className="data-[state:open]:bg-muted m-0 bg-transparent px-2 py-1 text-foreground hover:bg-accent focus:bg-transparent focus:hover:bg-accent active:bg-muted"
                                        {...hoverOptions}
                                    >
                                        <ChevronsUpDown className="w-4" />
                                    </Button>
                                </NavigationMenuPrimitive.Trigger>
                            </div>
                            <NavigationMenuContent {...hoverOptions}>
                                <AccountOptions actor={actor} />
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

function LinkActor({
    actor,
    profile,
    loading,
}: {
    actor?: Actor;
    profile: Actor;
    loading?: boolean;
}) {
    return (
        <NavigationMenuItem className="w-full">
            <Link
                href={linkToActorOverview(profile)}
                className="w-full"
                legacyBehavior
                passHref
            >
                <NavigationMenuLink
                    className={cn(
                        navigationMenuTriggerStyle(),
                        'w-full justify-start px-2 py-6 max-sm:bg-muted',
                        profile.id == actor?.id && 'ring-2 ring-accent'
                    )}
                >
                    <Profile profile={profile} loading={loading} size="tiny" />
                </NavigationMenuLink>
            </Link>
        </NavigationMenuItem>
    );
}

const AccountOptions = ({ actor }: { actor?: Actor }) => {
    // const t = useTranslations('components.layout.navbar.account-options');
    const surreal = useSurreal();
    const { user, loading: userLoading } = useAuth();
    const { data, isLoading: dataLoading } = useQuery({
        queryKey: ['navbar-actor-switcher'],
        queryFn: async function () {
            const [orgs, teams] = await surreal.query<
                [Organisation[], Team[]]
            >(/* surrealql */ `
                    SELECT * FROM $auth->manages->organisation WHERE part_of = NONE LIMIT 3;
                    SELECT * FROM $auth->plays_in->team LIMIT 3;
                `);

            const data = {
                organisations: z.array(Organisation).parse(orgs),
                teams: z.array(Team).parse(teams),
            };

            if (actor) {
                if (actor.type == 'organisation') {
                    data.organisations = data.organisations.filter(
                        ({ id }) => id != actor.id
                    );
                    data.organisations.unshift(actor as Organisation);
                    if (data.organisations.length > 3) data.organisations.pop();
                }

                if (actor.type == 'team') {
                    data.teams = data.teams.filter(({ id }) => id != actor.id);
                    data.teams.unshift(actor as Team);
                    if (data.teams.length > 3) data.teams.pop();
                }
            }

            return data;
        },
    });

    const loading = userLoading || dataLoading;
    if (!loading && (!data || !user)) return <p>An error occurred</p>;
    const organisations = data?.organisations ?? [];
    const teams = data?.teams ?? [];

    return (
        user && (
            <ul className="space-y-6 p-2">
                <div className="space-y-2">
                    <LinkActor loading={loading} actor={actor} profile={user} />
                    {organisations.length > 0 && (
                        <div className="space-y-1">
                            <span className="ml-2 text-xs text-muted-foreground">
                                Organisations
                            </span>{' '}
                            {organisations.map((org) => (
                                <LinkActor
                                    key={org.id}
                                    loading={loading}
                                    actor={actor}
                                    profile={org}
                                />
                            ))}
                        </div>
                    )}
                    {teams.length > 0 && (
                        <div className="space-y-1">
                            <span className="ml-2 text-xs text-muted-foreground">
                                Teams
                            </span>{' '}
                            {teams.map((team) => (
                                <LinkActor
                                    key={team.id}
                                    loading={loading}
                                    actor={actor}
                                    profile={team}
                                />
                            ))}
                        </div>
                    )}
                </div>
                {/* <NavigationMenuItem asChild>
                    <Button variant="destructive" onClick={signout}>
                        <LogOut className="mr-2" size={18} />
                        {t('signout')}
                    </Button>
                </NavigationMenuItem> */}
            </ul>
        )
    );
};

const LanguageOptions = () => {
    const pathname = usePathname();
    const search = useSearchParams();
    const locale = useLocale();
    const t = useTranslations('languages');
    const href = `${pathname}?${new URLSearchParams(search).toString()}`;

    return (
        <ul className="grid gap-3 p-6">
            {languageEntries.map(([lang, { native, flag }]) => (
                <NavigationMenuItem key={lang}>
                    <Link href={href} locale={lang} legacyBehavior passHref>
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
    const mobile = useIsMobileState();
    return (
        <div className={cn('transition-height', mobile ? 'h-28' : 'h-36')} />
    );
}
