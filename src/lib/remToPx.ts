export function remToPx(rem: number) {
    return (
        rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
    );
}
