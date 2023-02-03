import React, { createRef, useCallback, useState } from 'react';
import Button from '../../components/form/Button';
import Input from '../../components/form/Input';
import { SurrealInstance } from '../../lib/Surreal';
import DevLayout from './_layout';

export function getStaticProps() {
    return {
        props: {
            notFound: process.env.NODE_ENV === 'production',
        },
    };
}

export default function Page() {
    const inputRef = createRef<HTMLInputElement>();
    const [result, setResult] = useState<object>({});

    const run = useCallback(() => {
        if (inputRef.current && inputRef.current.value.length > 0) {
            SurrealInstance.opiniatedQuery(inputRef.current.value).then(
                (res) => {
                    setResult(res);
                }
            );
        } else {
            alert('No query');
        }
    }, [inputRef, setResult]);

    return (
        <DevLayout>
            <p>Queries are ran as the currently signed in user.</p>
            <Input
                placeholder="query"
                ref={inputRef}
                onKeyDown={(e) => {
                    if (e.code == 'Enter') run();
                }}
                style={{
                    minWidth: '500px',
                    marginTop: '24px',
                }}
            />
            <Button
                onClick={run}
                style={{
                    marginLeft: '20px',
                }}
            >
                run
            </Button>

            <p className="mt-8 whitespace-pre rounded-lg bg-zinc-700 py-12 px-8 font-mono">
                {JSON.stringify(result, null, 2)}
            </p>
        </DevLayout>
    );
}
