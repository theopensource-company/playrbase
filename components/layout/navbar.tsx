import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import LogoFull from '../../assets/LogoFull.svg';
import styles from '../../styles/components/Layout/Navbar.module.scss';

export const Navbar = () => (
    <div className={styles.default}>
        <Image src={LogoFull} alt="Logo" className={styles.logo} />
        <div className={styles.links}>
            <Link href="/signin">
                Signin
            </Link>
            <Link href="/partners">
                Partners
            </Link>
            <Link href="/get-started">
                Get started
            </Link>
        </div>
    </div>
);