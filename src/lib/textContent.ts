import { ReactElement } from 'react';

// From https://stackoverflow.com/a/63173682/22341017
export function textContent(elem: ReactElement | string): string {
    if (!elem) return '';
    if (typeof elem === 'string') return elem;

    const children = elem.props && elem.props.children;
    if (children instanceof Array) return children.map(textContent).join('');
    return textContent(children);
}
