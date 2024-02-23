import { toast } from 'sonner';

export function useShare() {
    return function ({
        title,
        text,
        url,
    }: {
        title?: string;
        text?: string;
        url?: string;
    }) {
        if (navigator.share) {
            navigator.share({
                title: title ?? document.title,
                text: text,
                url: url ?? window.location.href,
            });
        } else if (navigator.clipboard) {
            navigator.clipboard
                .writeText(url ?? window.location.href)
                .then(() => {
                    toast.success('Copied URL to clipboard');
                })
                .catch(() => {
                    toast.error('Failed to copy URL to clipboard');
                });
        } else {
            toast.error('Failed to share page');
        }
    };
}
