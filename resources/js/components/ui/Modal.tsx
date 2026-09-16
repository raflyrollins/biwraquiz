import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children?: ReactNode;
    footer?: ReactNode;
}

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', onKeydown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKeydown);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={onClose}
        >
            <div
                className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-none bg-neutral-primary shadow-xl"
                onClick={(event) => event.stopPropagation()}
            >
                {title ? (
                    <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
                        <h3 className="text-lg font-semibold text-heading">{title}</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Tutup"
                            className={cn('rounded-none p-1.5 text-body transition-colors hover:bg-neutral-tertiary-soft')}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ) : null}
                <div className="overflow-y-auto px-6 py-6 text-base leading-relaxed text-body">{children}</div>
                {footer ? (
                    <div className="flex items-center justify-end gap-3 border-t border-border-default px-6 py-4">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>
    );
}