import '@mdxeditor/editor/style.css';
import { ReactNode } from 'react';
import './globals.css';

type Props = { children: ReactNode };

export default function RootLayout({ children }: Props) {
    return children;
}
