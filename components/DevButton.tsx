import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useFeatureFlag } from '../hooks/Environment';

export function DevButton() {
    const router = useRouter();
    const show = useFeatureFlag('devTools');
    const [showDevTools, setShowDevTools] = useState<boolean>(false);

    useEffect(() => {
        setShowDevTools(show);
    }, [show]);

    return (
        <>
            {showDevTools &&
                !router.pathname.startsWith('/dev') &&
                !router.pathname.startsWith('/admin') && (
                    <div className="fixed right-0 m-6 flex gap-4 rounded bg-red-700 px-4 py-2.5 text-white">
                        <Link href="/dev">Devtools</Link>
                        <span>-</span>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowDevTools(false);
                            }}
                        >
                            Hide
                        </a>
                    </div>
                )}
        </>
    );
}
