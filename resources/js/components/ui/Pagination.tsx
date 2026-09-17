import { Link } from '@inertiajs/react';
import type { HTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginationProps extends HTMLAttributes<HTMLElement> {
    links: PaginationLink[];
}

const baseClasses =
    'inline-flex h-9 items-center justify-center border border-border-default-medium bg-neutral-secondary-medium text-sm font-medium text-body transition-colors duration-150 hover:bg-neutral-tertiary-medium hover:text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

function decodeLabel(label: string): string {
    return label
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&hellip;/g, '…')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#039;/g, "'")
        .trim();
}

function PageLink({ link }: { link: PaginationLink }) {
    const raw = decodeLabel(link.label);
    const isPrevious = /previous/i.test(raw);
    const isNext = /next/i.test(raw);
    const isEllipsis = raw === '…' || raw === '...';
    const isNumber = /^\d+$/.test(raw);

    const text = isPrevious
        ? 'Sebelumnya'
        : isNext
          ? 'Berikutnya'
          : isEllipsis
            ? '…'
            : raw;

    const shape = isNumber ? 'w-9' : 'px-3';

    const hiddenOnMobile =
        (isNumber && !link.active) || isEllipsis ? 'max-sm:hidden' : '';

    const state = link.active
        ? 'border-border-default-strong bg-neutral-tertiary-medium text-fg-brand'
        : !link.url
          ? 'cursor-not-allowed opacity-50'
          : '';

    const classes = cn(baseClasses, shape, hiddenOnMobile, state);

    if (!link.url || (isNumber && link.active)) {
        return (
            <span
                aria-current={link.active ? 'page' : undefined}
                aria-disabled={!link.url ? 'true' : undefined}
                className={classes}
            >
                {text}
            </span>
        );
    }

    return (
        <Link href={link.url} preserveScroll className={classes}>
            {text}
        </Link>
    );
}

export default function Pagination({ links, className }: PaginationProps) {
    const pageNumbers = links.filter((link) =>
        /^\d+$/.test(decodeLabel(link.label)),
    );

    if (pageNumbers.length <= 1) {
        return null;
    }

    return (
        <nav
            aria-label="Paginasi"
            className={cn(
                'flex flex-wrap items-center justify-start gap-1 sm:justify-end',
                className,
            )}
        >
            {links.map((link, index) => (
                <PageLink key={`${link.label}-${index}`} link={link} />
            ))}
        </nav>
    );
}
