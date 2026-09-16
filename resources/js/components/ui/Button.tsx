import { Link } from '@inertiajs/react';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../../lib/utils';

type Variant = 'brand' | 'white' | 'ghost' | 'danger';
type Size = 'default' | 'large' | 'sm' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    asLink?: string;
    href?: string;
    children?: ReactNode;
}

const variantStyles: Record<Variant, string> = {
    brand: 'bg-brand text-on-brand hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    white: 'bg-white text-fg-brand hover:bg-neutral-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    ghost: 'bg-transparent text-body hover:bg-neutral-secondary-medium hover:text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    danger: 'bg-danger-soft text-fg-danger hover:bg-danger-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger',
};

const sizeStyles: Record<Size, string> = {
    default: 'px-6 py-4 text-base',
    large: 'px-10 py-5 text-xl',
    sm: 'px-4 py-2.5 text-sm',
    icon: 'p-3',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = 'brand', size = 'default', className, type = 'button', asLink, href, children, disabled, ...props },
    ref,
) {
    const classes = cn(
        'inline-flex items-center justify-center gap-2 rounded-none font-medium transition-colors duration-150 disabled:pointer-events-none disabled:bg-disabled disabled:text-fg-disabled',
        variantStyles[variant],
        sizeStyles[size],
        className,
    );

    if (href) {
        return (
            <a href={href} className={classes}>
                {children}
            </a>
        );
    }

    if (asLink) {
        return (
            <Link href={asLink} className={classes}>
                {children}
            </Link>
        );
    }

    return (
        <button
            ref={ref}
            type={type}
            className={classes}
            disabled={disabled ?? undefined}
            {...props}
        >
            {children}
        </button>
    );
});

export default Button;