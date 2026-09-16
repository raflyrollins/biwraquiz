import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import GoogleIcon from '../components/GoogleIcon';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { google } from '../routes/auth';

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
    });

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        post('/login', {
            preserveScroll: true,
            onFinish: () => reset('password'),
        });
    }

    return (
        <>
            <Head title="Masuk" />
            <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
                <div className="grid w-full max-w-4xl items-center gap-10 lg:grid-cols-2">
                    <div className="hidden text-center lg:block lg:text-left">
                        <img
                            src="/images/questions.svg"
                            alt="Ilustrasi orang menjawab pertanyaan"
                            className="mx-auto h-72 w-auto lg:mx-0 lg:h-80"
                        />
                        <h2 className="text-heading mt-6 text-xl font-bold tracking-tight">
                            Untuk siapa halaman ini?
                        </h2>
                        <p className="text-body-subtle mt-2 max-w-sm text-sm leading-relaxed">
                            Admin masuk dengan email & password untuk membuat
                            dan memantau kuesioner. Responden cukup lanjut
                            dengan Google untuk mengisi.
                        </p>
                    </div>

                    <div className="border-border-default w-full max-w-sm border bg-white p-8 shadow-xl">
                        <div className="mb-7">
                            <span className="bg-brand text-on-brand flex h-12 w-12 items-center justify-center text-2xl font-bold">
                                b
                            </span>
                            <h1 className="text-heading mt-5 text-2xl font-bold tracking-tight">
                                Masuk
                            </h1>
                            <p className="text-body-subtle mt-1 text-sm">
                                Masuk sebagai admin, atau lanjutkan dengan akun
                                Google
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="text-body mb-1.5 block text-sm font-medium"
                                >
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    autoComplete="email"
                                    placeholder="admin@biwraquiz.test"
                                    required
                                />
                                {errors.email && (
                                    <p className="text-fg-danger-session mt-1.5 text-xs">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="text-body mb-1.5 block text-sm font-medium"
                                >
                                    Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="brand"
                                className="w-full"
                                disabled={processing}
                            >
                                Masuk
                            </Button>
                        </form>

                        <div className="text-body-subtle my-6 flex items-center gap-3 text-xs">
                            <span className="border-border-default h-px flex-1 border-t" />
                            atau
                            <span className="border-border-default h-px flex-1 border-t" />
                        </div>

                        <a
                            href={google.url()}
                            className="hover:bg-neutral-secondary-soft text-heading border-border-default-medium flex w-full items-center justify-center gap-3 border bg-white px-6 py-3 font-medium transition-colors duration-150"
                        >
                            <GoogleIcon size={20} />
                            Lanjutkan dengan Google
                        </a>

                        <p className="text-body-subtle mt-6 text-center text-xs">
                            Responden cukup masuk dengan akun Google untuk
                            mengisi kuesioner.
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-body-subtle flex items-center justify-center gap-4 px-6 pb-8 text-xs">
                <span>Bantuan</span>
                <span aria-hidden="true">·</span>
                <span>Privasi</span>
                <span aria-hidden="true">·</span>
                <span>Ketentuan</span>
                <span aria-hidden="true">·</span>
                <span>
                    Ilustrasi:{' '}
                    <a
                        href="https://storyset.com"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-heading underline"
                    >
                        Storyset
                    </a>
                </span>
            </div>
        </>
    );
}
