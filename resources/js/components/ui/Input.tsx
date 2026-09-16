import type { InputHTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function Input({ label, error, id, className, ...props }: InputProps) {
    const inputId = id ?? props.name;

    return (
        <div className="w-full">
            {label ? (
                <label
                    htmlFor={inputId}
                    className="mb-2 block text-sm font-medium text-heading"
                >
                    {label}
                </label>
            ) : null}
            <input
                id={inputId}
                className={cn(
                    'block w-full rounded-none border border-border-default-medium bg-neutral-secondary-medium px-3 py-2.5 text-sm text-heading shadow-xs transition-all duration-200 placeholder:text-body',
                    'hover:border-border-default-strong',
                    'focus:border-border-brand focus:outline-none focus:ring-1 focus:ring-brand',
                    error && 'border-border-danger focus:border-border-danger focus:ring-danger',
                    props.disabled && 'cursor-not-allowed bg-disabled text-fg-disabled',
                    className,
                )}
                {...props}
            />
            {error ? <p className="mt-1.5 text-sm text-fg-danger">{error}</p> : null}
        </div>
    );
}