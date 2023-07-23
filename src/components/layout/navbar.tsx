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
import { useAuth } from '@/lib/auth.ts';
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
import React, { useEffect, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import LogoFull from '../../assets/LogoFull.svg';
import { Profile } from '../cards/profile.tsx';
import { Button } from '../ui/button.tsx';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet.tsx';
import Container from './Container.tsx';
import { DevTools } from './DevTools/index.tsx';
import { Skeleton } from '../ui/skeleton.tsx';

export const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);

    // Enabled in prod/preview with:
    // localStorage.setItem('devTools', 'enabled')
    // Then reload page
    const [devTools, setDevTools] = useState(featureFlags.devTools);
    useEffect(() => {
        if (localStorage.getItem('devTools') == 'enabled') {
            setDevTools(true);
        }
    }, [setDevTools]);

    useEffect(() => {
        const handler = () => {
            setScrolled(
                (window.pageYOffset || document.documentElement.scrollTop) > 0
            );
        };

        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, [setScrolled]);

    return (
        <Container
            className={cn(
                'fixed left-0 right-0 flex items-center justify-between backdrop-blur-lg transition-height',
                scrolled ? 'h-24' : 'h-36'
            )}
        >
            <Link href="/">
                <Image
                    src={LogoFull}
                    alt="Logo"
                    className="h-10 w-min sm:h-12"
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
    );
};

const Links = ({ devTools }: { devTools: boolean }) => {
    const { loading, user } = useAuth(({ loading, user }) => ({
        loading,
        user,
    }));

    return (
        <NavigationMenu className="max-sm:justify-start max-sm:pt-8">
            <NavigationMenuList className="flex flex-col items-start gap-4 space-x-0 md:flex-row md:items-center">
                <NavigationMenuItem>
                    {loading ? (
                        <Skeleton className="h-10 w-24" />
                    ) : user ? (
                        <>
                            <NavigationMenuTrigger>
                                <ChevronRightSquare className="mr-2 md:hidden" />
                                {user.name.split(' ')[0]}
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <AccountOptions />
                            </NavigationMenuContent>
                        </>
                    ) : (
                        <Link href="/console" legacyBehavior passHref>
                            <NavigationMenuLink
                                className={cn(
                                    navigationMenuTriggerStyle(),
                                    'max-sm:bg-muted'
                                )}
                            >
                                <ChevronRightSquare className="mr-2 md:hidden" />
                                Account
                            </NavigationMenuLink>
                        </Link>
                    )}
                </NavigationMenuItem>
                {featureFlags.switchLanguage && (
                    <NavigationMenuItem>
                        <NavigationMenuTrigger className="max-sm:bg-muted">
                            <Languages size={20} />
                            <span className="ml-2 md:hidden">Language</span>
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
    const { user, loading, signout } = useAuth(
        ({ user, loading, signout }) => ({
            user,
            loading,
            signout,
        })
    );

    return (
        user && (
            <ul className="grid gap-6 p-6">
                <NavigationMenuItem>
                    <Link href="/console" legacyBehavior passHref>
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
                        Signout
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
