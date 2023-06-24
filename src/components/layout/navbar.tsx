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
import { cn } from '@/lib/utils.ts';
import { Language, languages } from '@/locales/languages.ts';
import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next-intl/client';
import Link from 'next-intl/link';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import LogoFull from '../../assets/LogoFull.svg';
import Container from './Container.tsx';
import { DevTools } from './DevTools/index.tsx';

export const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const devTools =
        // Enabled in prod/preview with:
        // localStorage.setItem('devTools', 'enabled')
        // Then reload page
        featureFlags.devTools || localStorage.getItem('devTools') == 'enabled';

    useEffect(() => {
        const handler = () => {
            setScrolled(
                (window.pageYOffset || document.documentElement.scrollTop) > 0
            );
        };

        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    });

    return (
        <Container
            className={cn(
                'fixed left-0 right-0 flex items-center justify-between backdrop-blur-lg transition-height',
                scrolled ? 'h-24' : 'h-36'
            )}
        >
            <Link href="/">
                <Image src={LogoFull} alt="Logo" className="h-12 w-min" />
            </Link>
            <div className="flex gap-4">
                <NavigationMenu>
                    <NavigationMenuList className="gap-4">
                        <NavigationMenuItem>
                            <Link href="/console" legacyBehavior passHref>
                                <NavigationMenuLink
                                    className={navigationMenuTriggerStyle()}
                                >
                                    Console
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>
                        {featureFlags.switchLanguage && (
                            <NavigationMenuItem>
                                <NavigationMenuTrigger>
                                    <Languages size={20} />
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <LanguageOptions />
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        )}
                        {devTools && <DevTools />}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
        </Container>
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
