import type { HTMLAttributes } from 'react';

import { Link } from '@inertiajs/react';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginationProps extends HTMLAttributes<HTMLElement> {
    links: PaginationLink[];
}

function PageLink({ link, children }: { link: PaginationLink; children?: React.ReactNode }) {
    const classes =
        'flex h-9 w-9 items-center justify-center border border-border-default-medium bg-neutral-secondary-medium text-sm font-medium text-body transition-colors duration-150 hover:bg-neutral-tertiary-medium hover:text-heading focus:outline-none';
    const active = link.active
        ? 'bg-neutral-tertiary-medium text-fg-brand'
        : '';
    const isNumber = /\d/.test(link.label);

    const merged = `${classes} ${active}`;

    if (!link.url) {
        return (
            <span aria-disabled="true" className={`${merged} cursor-not-allowed opacity-50`}>
                {children ?? link.label}
            </span>
        );
    }

    if (isNumber && link.active) {
        return (
            <span aria-current="page" className={merged}>
                {children ?? link.label}
            </span>
        );
    }

    return (
        <Link href={link.url} className={merged} dangerouslySetInnerHTML={undefined}>
            {children ?? link.label}
        </Link>
    );
}

export default function Pagination({ links, className }: PaginationProps) {
    if (links.length <= 1) {
        return null;
    }

    return (
        <nav aria-label="Paginasi" className={className}>
            <div className="flex items-center">
                {links.map((link, index) => (
                    <span key={index} className="-ml-px first:ml-0">
                        <PageLink link={link} />
                    </span>
                ))}
            </div>
        </nav>
    );
}