import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { dashboard } from '../routes';
import my from '../routes/my';
import { index as questionnairesIndex, create } from '../routes/questionnaires';
import { cn } from '../lib/utils';

const adminNavigation = [
    {
        name: 'Dashboard',
        href: dashboard.url(),
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
                <rect x="3" y="3" width="7" height="7" rx="0" />
                <rect x="14" y="3" width="7" height="7" rx="0" />
                <rect x="3" y="14" width="7" height="7" rx="0" />
                <rect x="14" y="14" width="7" height="7" rx="0" />
            </svg>
        ),
    },
    {
        name: 'Kuesioner',
        href: questionnairesIndex.url(),
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
            </svg>
        ),
    },
    {
        name: 'Buat Kuesioner',
        href: create.url(),
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path d="M12 5v14M5 12h14" />
            </svg>
        ),
    },
];

const myNavigation = [
    {
        name: 'Kuesioner Saya',
        href: my.index.url(),
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
        ),
    },
];

function Toast() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    useEffect(() => {
        const next = flash.success
            ? { type: 'success' as const, text: flash.success }
            : flash.error
              ? { type: 'error' as const, text: flash.error }
              : null;
        if (!next) {
            return;
        }

        setMessage(next);
        setVisible(true);

        const timer = window.setTimeout(() => setVisible(false), 4000);
        return () => window.clearTimeout(timer);
    }, [flash.success, flash.error]);

    if (!visible || !message) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
            <div
                className={cn(
                    'flex items-center gap-3 rounded-none border px-5 py-3 text-sm font-medium shadow-lg',
                    message.type === 'success'
                        ? 'border-border-success bg-success-soft text-fg-success-strong'
                        : 'border-border-danger bg-danger-soft text-fg-danger-strong',
                )}
                role="status"
            >
                {message.text}
            </div>
        </div>
    );
}

export default function AppLayout({
    title,
    children,
    actions,
}: {
    title?: string;
    children: ReactNode;
    actions?: ReactNode;
}) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const currentUrl = usePage().url.split('?')[0];

    const navigation = auth.user?.is_admin
        ? [...adminNavigation, ...myNavigation]
        : myNavigation;

    const isActive = (href: string) => {
        if (href === my.index.url()) {
            return currentUrl === '/my';
        }
        if (href === dashboard.url()) {
            return currentUrl === '/dashboard';
        }
        if (href === create.url()) {
            return currentUrl === '/questionnaires/create';
        }
        if (href === questionnairesIndex.url()) {
            return (
                currentUrl.startsWith('/questionnaires') &&
                currentUrl !== '/questionnaires/create'
            );
        }
        return false;
    };

    return (
        <div
            className="bg-neutral-secondary-soft text-body flex min-h-screen w-full"
            data-surface="dashboard"
        >
            <Toast />

            <aside
                className={cn(
                    'border-border-default bg-neutral-primary-soft fixed inset-y-0 left-0 z-30 w-64 border-r transition-transform duration-200',
                    sidebarOpen
                        ? 'translate-x-0'
                        : '-translate-x-full lg:translate-x-0',
                )}
            >
                <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
                    <div className="flex items-center gap-2 px-3 py-2">
                        <span className="bg-brand text-on-brand flex h-9 w-9 items-center justify-center rounded-[24px] text-lg font-bold">
                            b
                        </span>
                        <span className="text-heading text-lg font-bold tracking-tight">
                            biwraquiz
                        </span>
                    </div>

                    <nav className="mt-6 flex flex-col gap-2">
                        {navigation.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        'text-heading hover:bg-neutral-secondary-medium flex items-center gap-3 rounded-none px-3 py-2 text-sm font-medium transition-colors duration-150',
                                        active &&
                                            'bg-neutral-secondary-strong text-fg-brand-strong',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'text-body transition-colors duration-75',
                                            active && 'text-fg-brand-strong',
                                        )}
                                    >
                                        {item.icon}
                                    </span>
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-6">
                        <div className="bg-brand-softer rounded-none px-4 py-4">
                            {auth.user ? (
                                <div className="flex items-center gap-3">
                                    {auth.user.avatar ? (
                                        <img
                                            src={auth.user.avatar}
                                            alt={auth.user.name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="bg-brand-medium text-on-brand flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
                                            {auth.user.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </span>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-heading truncate text-sm font-semibold">
                                            {auth.user.name}
                                        </p>
                                        <p className="text-body-subtle truncate text-xs">
                                            {auth.user.email}
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                            <button
                                type="button"
                                className="text-on-brand hover:bg-brand-strong mt-3 w-full rounded-none px-3 py-2 text-sm font-medium transition-colors"
                                onClick={() => router.post('/logout')}
                            >
                                Keluar
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {sidebarOpen ? (
                <div
                    className="fixed inset-0 z-20 bg-black/40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            ) : null}

            <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-64">
                <header className="border-border-default bg-neutral-primary-soft sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b px-4 py-3 lg:px-8">
                    <button
                        type="button"
                        className="text-heading hover:bg-neutral-tertiary-soft rounded-none p-2 transition-colors lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Buka menu"
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M3 6h18M3 12h18M3 18h18" />
                        </svg>
                    </button>
                    <div className="min-w-0">
                        {title ? (
                            <h1 className="text-heading truncate text-2xl font-bold tracking-tight">
                                {title}
                            </h1>
                        ) : (
                            <span className="text-heading text-lg font-bold tracking-tight">
                                biwraquiz
                            </span>
                        )}
                    </div>
                    <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                        {actions}
                    </div>
                </header>

                <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
