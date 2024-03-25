import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';

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
    pageSizeAdjustable,
}: {
    count: number;
    pagination: {
        page: number;
        pageSize: number;
        setPage: Dispatch<SetStateAction<number>>;
        setPageSize: Dispatch<SetStateAction<number>>;
    };
    pageSizeAdjustable?: boolean;
}) {
    const t = useTranslations('components.logic.pagination');
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
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={isFirst}
                                onClick={first}
                            >
                                <ChevronsLeft size={20} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('buttons.first.popover')}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={isFirst}
                                onClick={previous}
                            >
                                <ChevronLeft size={20} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('buttons.previous.popover')}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <span className="text-sm">
                    {t.rich('page', {
                        page,
                        total: numPages,
                    })}
                </span>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={isLast}
                                onClick={next}
                            >
                                <ChevronRight size={20} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('buttons.next.popover')}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={isLast}
                                onClick={last}
                            >
                                <ChevronsRight size={20} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('buttons.last.popover')}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {pageSizeAdjustable !== false && (
                <Select
                    value={pageSize.toString()}
                    onValueChange={(v) => setPageSize(Number.parseInt(v))}
                >
                    <SelectTrigger className="flex-[0] gap-2 whitespace-nowrap">
                        {t.rich('size', { size: pageSize })}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5">{t('sizes.s-5')}</SelectItem>
                        <SelectItem value="10">{t('sizes.s-10')}</SelectItem>
                        <SelectItem value="25">{t('sizes.s-25')}</SelectItem>
                        <SelectItem value="50">{t('sizes.s-50')}</SelectItem>
                        <SelectItem value="100">{t('sizes.s-100')}</SelectItem>
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}
