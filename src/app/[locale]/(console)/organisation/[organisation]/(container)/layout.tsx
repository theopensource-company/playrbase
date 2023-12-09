import Container from '@/components/layout/Container';
import React, { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
    return <Container>{children}</Container>;
}
