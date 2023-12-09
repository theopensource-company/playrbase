import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import React, {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { Button } from '../ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';

export function usePagination({
    defaultPageSize,
    defaultPage,
}: {
    defaultPageSize?: number;
    defaultPage?: number;
} = {}) {
    const [pageSize, setPageSize] = useState(defaultPageSize ?? 10);
    const [page, setPage] = useState(defaultPage ?? 1);

    const start = (page - 1) * pageSize;
    const limit = pageSize;

    return { pageSize, setPageSize, page, setPage, start, limit };
}

export function Pagination({
    count,
    pagination: { page, pageSize, setPage, setPageSize },
}: {
    count: number;
    pagination: {
        page: number;
        pageSize: number;
        setPage: Dispatch<SetStateAction<number>>;
        setPageSize: Dispatch<SetStateAction<number>>;
    };
}) {
    const numPages = Math.ceil(count / pageSize);
    const isFirst = page == 1;
    const isLast = page == numPages;

    const first = useCallback(() => {
        if (!isFirst) setPage(1);
    }, [isFirst, setPage]);

    const previous = useCallback(() => {
        if (!isFirst) setPage(page - 1);
    }, [isFirst, setPage, page]);

    const next = useCallback(() => {
        if (!isLast) setPage(page + 1);
    }, [isLast, setPage, page]);

    const last = useCallback(() => {
        if (!isLast) setPage(numPages);
    }, [isLast, setPage, numPages]);

    useEffect(() => {
        if (page > numPages) first();
    }, [page, numPages, first]);

    return (
        <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={isFirst}
                    onClick={first}
                >
                    <ChevronsLeft size={20} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={isFirst}
                    onClick={previous}
                >
                    <ChevronLeft size={20} />
                </Button>

                <span className="text-sm">
                    Page {page} - {numPages}
                </span>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={isLast}
                    onClick={next}
                >
                    <ChevronRight size={20} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={isLast}
                    onClick={last}
                >
                    <ChevronsRight size={20} />
                </Button>
            </div>
            <Select
                value={pageSize.toString()}
                onValueChange={(v) => setPageSize(Number.parseInt(v))}
            >
                <SelectTrigger className="flex-[0] gap-2">
                    <span className="whitespace-nowrap">Size: </span>
                    <SelectValue prefix="Page size:" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
