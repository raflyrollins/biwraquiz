import type { HTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    interactive?: boolean;
}

export default function Card({ interactive = false, className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-none border border-border-default bg-neutral-primary-soft shadow-xs',
                interactive &&
                    'cursor-pointer transition-colors duration-150 hover:bg-neutral-secondary-medium',
                className,
            )}
            {...props}
        />
    );
}