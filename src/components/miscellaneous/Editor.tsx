'use client';

import { cn } from '@/lib/utils';
import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    CreateLink,
    InsertTable,
    MDXEditor,
    UndoRedo,
    headingsPlugin,
    listsPlugin,
    markdownShortcutPlugin,
    quotePlugin,
    tablePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
} from '@mdxeditor/editor';
import React, { useCallback, useMemo, useState } from 'react';

export default function Editor({
    value,
    onChange,
    defaultValue,
    placeholder,
    className,
    maxLength,
}: {
    value?: string;
    onChange?: (value: string) => unknown;
    defaultValue?: string;
    placeholder?: string;
    className?: string;
    maxLength?: number;
}) {
    const [innerValue, setInnerValue] = useState<string>(defaultValue ?? '');
    const markdown = useMemo(() => value ?? innerValue, [value, innerValue]);

    const onChangeGate = useCallback(
        (value: string) => {
            if (maxLength && value.length > maxLength) return;
            onChange?.(value);
            setInnerValue(value);
        },
        [onChange, maxLength]
    );

    return (
        <div className={cn('markdown rounded border', className)}>
            <MDXEditor
                className="dark-theme z-10"
                plugins={[
                    // Example Plugin Usage
                    headingsPlugin({
                        allowedHeadingLevels: [3, 4, 5, 6],
                    }),
                    tablePlugin(),
                    listsPlugin(),
                    quotePlugin(),
                    thematicBreakPlugin(),
                    markdownShortcutPlugin(),
                    toolbarPlugin({
                        toolbarContents: () => (
                            <>
                                {' '}
                                <UndoRedo />
                                <BlockTypeSelect />
                                <BoldItalicUnderlineToggles />
                                <CreateLink />
                                <InsertTable />
                            </>
                        ),
                    }),
                ]}
                markdown={markdown}
                onChange={onChangeGate}
                placeholder={placeholder}
            />
        </div>
    );
}
