import { Head, usePage } from '@inertiajs/react';

import Button from '../components/ui/Button';
import { dashboard, login } from '../routes';

export default function Welcome() {
    const { auth } = usePage().props;

    const cta = auth.user ? (
        auth.user.is_admin ? (
            <Button asLink={dashboard.url()}>Ke Dashboard</Button>
        ) : null
    ) : (
        <Button asLink={login.url()}>Login</Button>
    );

    return (
        <>
            <Head title="Beranda" />
            <div className="bg-neutral-primary flex min-h-screen flex-col">
                <header className="flex items-center justify-between px-6 py-5 lg:px-10">
                    <span className="flex items-center gap-2.5">
                        <span className="bg-brand text-on-brand flex h-9 w-9 items-center justify-center text-lg font-bold">
                            b
                        </span>
                        <span className="text-heading text-xl font-bold tracking-tight">
                            biwraquiz
                        </span>
                    </span>
                    <nav>{cta}</nav>
                </header>

                <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-14">
                    <div className="grid w-full items-center gap-10 lg:grid-cols-2">
                        <div className="text-center lg:text-left">
                            <div className="flex justify-center lg:justify-start">
                                <p className="text-fg-brand-strong text-xs font-bold tracking-[0.2em] uppercase">
                                    Kuesioner & survei
                                </p>
                            </div>
                            <h1 className="text-heading mt-4 text-4xl leading-[1.15] font-bold tracking-tight sm:text-5xl">
                                Kumpulkan tanggapan,
                                <br />
                                lihat ringkasannya
                            </h1>
                            <p className="text-body mt-6 max-w-xl text-lg leading-relaxed">
                                Buat kuesioner sendiri, bagikan link-nya, dan
                                responden mengisi dengan akun Google. Hasilnya
                                otomatis dirangkum untukmu.
                            </p>

                            {cta && <div className="mt-10">{cta}</div>}

                            <ul className="text-body-subtle mt-12 flex flex-col items-center gap-2 text-sm sm:flex-row sm:gap-6 lg:justify-start">
                                <li>Buat kuesioner sendiri</li>
                                <li aria-hidden="true">·</li>
                                <li>Responden isi dari HP</li>
                                <li aria-hidden="true">·</li>
                                <li>Ringkasan otomatis</li>
                            </ul>
                        </div>

                        <div className="flex justify-center">
                            <img
                                src="/images/online-test.svg"
                                alt="Ilustrasi orang mengerjakan kuesioner online"
                                className="h-56 w-auto sm:h-72 lg:h-96"
                            />
                        </div>
                    </div>
                </main>

                <footer className="text-body-subtle flex flex-col items-center gap-1 px-6 py-8 text-center text-xs">
                    <span>biwraquiz</span>
                    <span>
                        Ilustrasi oleh{' '}
                        <a
                            href="https://storyset.com"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-heading underline"
                        >
                            Storyset
                        </a>{' '}
                        di Freepik
                    </span>
                </footer>
            </div>
        </>
    );
}
