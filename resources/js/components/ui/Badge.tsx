import type { HTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

type Variant =
    | 'brand'
    | 'alternative'
    | 'gray'
    | 'danger'
    | 'success'
    | 'warning'
    | 'dark';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: Variant;
    pill?: boolean;
}

const variantStyles: Record<Variant, string> = {
    brand: 'bg-brand-softer border-border-brand-subtle text-fg-brand-strong',
    alternative: 'bg-neutral-primary-soft border-border-default text-heading',
    gray: 'bg-neutral-secondary-medium border-border-default text-heading',
    danger: 'bg-danger-soft border-border-danger text-fg-danger-strong',
    success: 'bg-success-soft border-border-success text-fg-success-strong',
    warning: 'bg-warning-soft border-border-warning text-fg-warning',
    dark: 'bg-dark border-transparent text-white',
};

export default function Badge({ variant = 'alternative', pill = false, className, ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 border px-1.5 py-0.5 text-xs font-medium',
                pill ? 'rounded-full' : 'rounded-none',
                variantStyles[variant],
                className,
            )}
            {...props}
        />
    );
}