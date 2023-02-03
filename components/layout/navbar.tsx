import Image from 'next/image';
import Link, { LinkProps } from 'next/link';
import React, { ReactNode } from 'react';
import LogoFull from '../../assets/LogoFull.svg';
import Container from '../helper/Container';

export const NavbarLink = ({
    children,
    className,
    ...props
}: LinkProps & {
    children: ReactNode;
    className?: string;
}) => (
    <Link
        className={`text-lg text-white hover:underline ${className ?? ''}`}
        {...props}
    >
        {children}
    </Link>
);

export const Navbar = () => (
    <Container className="flex h-36 items-center justify-between">
        <Link href="/">
            <Image src={LogoFull} alt="Logo" className="h-14 w-min" />
        </Link>
        <div className="flex gap-16">
            {/* <NavbarLink href="/signin">Signin</NavbarLink>
            <NavbarLink href="/partners">Partners</NavbarLink>
            <NavbarLink href="/get-started">Get started</NavbarLink> */}
        </div>
    </Container>
);
