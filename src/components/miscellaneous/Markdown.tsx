import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import RenderMarkdown, { Components } from 'react-markdown';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import strip from 'strip-markdown';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';

export function Markdown({ children }: { children: string }) {
    return (
        <RenderMarkdown
            className="markdown"
            remarkPlugins={[remarkGfm]}
            components={
                {
                    table: ({
                        className,
                        ...props
                    }: Parameters<typeof Table>[0]) => (
                        <Table className={cn('my-4', className)} {...props} />
                    ),
                    tr: TableRow,
                    th: TableHead,
                    td: TableCell,
                    tbody: TableBody,
                    thead: TableHeader,
                } as Components
            }
        >
            {children}
        </RenderMarkdown>
    );
}

export function useMarkdownInline(markdown: string) {
    const { data } = useQuery({
        queryKey: ['markdown-inline', markdown],
        async queryFn() {
            return await remark().use(strip).use(remarkGfm).process(markdown);
        },
    });

    return String(data);
}

export function MarkdownInline({ children }: { children: string }) {
    return useMarkdownInline(children);
}
