import { Head, router, usePage } from '@inertiajs/react';
import {
    AnimatePresence,
    LazyMotion,
    domAnimation,
    m,
    useAnimation,
} from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { cn } from '../../lib/utils';
import { store } from '../../routes/fill';
import my from '../../routes/my';
import { SCALE_DESCRIPTIONS, SCALE_LABELS, SCALE_VALUES } from '../../types';

type Props = {
    questionnaire: {
        id: number;
        uuid: string;
        title: string;
        description: string | null;
        status: 'draft' | 'published' | 'closed';
    };
    questions: { id: number; text: string; position: number }[];
    existing_answers: Record<string, number> | null;
    response: {
        id: number;
        status: 'in_progress' | 'completed';
        submitted_at: string | null;
    } | null;
};

export default function FillPage() {
    const page = usePage<Props>();
    const [answers, setAnswers] = useState<Record<number, number>>(() =>
        Object.fromEntries(
            Object.entries(page.props.existing_answers ?? {}).map(
                ([key, value]) => [Number(key), value],
            ),
        ),
    );
    const [saving, setSaving] = useState<'draft' | 'final' | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [incompleteOpen, setIncompleteOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const shakeControls = useAnimation();

    const { questionnaire, questions, response, errors } = page.props;

    const isClosed = questionnaire.status === 'closed';
    const isCompleted = response?.status === 'completed';
    const answerCount = questions.filter(
        (question) => answers[question.id] !== undefined,
    ).length;
    const unanswered = questions
        .map((question, index) => ({ id: question.id, index }))
        .filter(({ id }) => answers[id] === undefined);
    const unansweredCount = unanswered.length;
    const percent = progressPercent(answerCount, questions.length);

    const canSubmitFinal =
        questions.length > 0 && answerCount === questions.length;

    useEffect(() => {
        questionRefs.current = questionRefs.current.slice(0, questions.length);

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (a, b) =>
                            a.boundingClientRect.top - b.boundingClientRect.top,
                    );
                if (visible[0]) {
                    const index = Number(
                        (visible[0].target as HTMLElement).dataset.index,
                    );
                    setActiveIndex(index);
                }
            },
            { rootMargin: '-25% 0px -55% 0px' },
        );

        for (const el of questionRefs.current) {
            if (el) {
                observer.observe(el);
            }
        }

        return () => observer.disconnect();
    }, [questions]);

    const modalOpen = incompleteOpen || confirmOpen;

    useEffect(() => {
        if (!modalOpen) {
            return;
        }

        const onKeydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && saving === null) {
                setIncompleteOpen(false);
                setConfirmOpen(false);
            }
        };

        document.addEventListener('keydown', onKeydown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKeydown);
            document.body.style.overflow = '';
        };
    }, [modalOpen, saving]);

    const jumpToQuestion = (index: number) => {
        const el = questionRefs.current[index];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveIndex(index);
        }
        setMenuOpen(false);
    };

    const save = (draft: boolean) => {
        if (answerCount === 0) {
            return;
        }
        setSaving(draft ? 'draft' : 'final');
        router.post(
            store({ questionnaire: questionnaire.uuid }).url,
            { answers },
            {
                onFinish: () => {
                    setSaving(null);
                    setConfirmOpen(false);
                    setIncompleteOpen(false);
                },
            },
        );
    };

    useEffect(() => {
        if (response?.status === 'completed') {
            setConfirmOpen(false);
            setIncompleteOpen(false);
        }
    }, [response?.status]);

    const submitFinal = () => {
        if (canSubmitFinal) {
            setConfirmOpen(true);
            return;
        }

        void shakeControls.start(
            { x: [0, -8, 8, -5, 5, 0] },
            { duration: 0.4, ease: 'easeInOut' },
        );
        setIncompleteOpen(true);
    };

    const confirmFinal = () => {
        if (saving !== null) {
            return;
        }
        save(false);
    };

    const goToUnanswered = (index: number) => {
        setIncompleteOpen(false);
        window.setTimeout(() => jumpToQuestion(index), 200);
    };

    return (
        <LazyMotion features={domAnimation}>
            <Head title={questionnaire.title} />

            <main className="bg-neutral-primary min-h-dvh">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12 lg:flex lg:h-dvh lg:flex-col lg:overflow-hidden lg:px-8 lg:py-6">
                    <header className="text-center lg:flex-none">
                        <img
                            src="/images/online-review.svg"
                            alt="Ilustrasi kuesioner"
                            className="mx-auto h-24 w-auto sm:h-28 lg:h-20"
                        />
                        <p className="text-fg-brand-strong mt-4 text-xs font-bold tracking-[0.2em] uppercase">
                            Kuesioner
                        </p>
                        <h1 className="text-heading mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                            {questionnaire.title}
                        </h1>
                        {questionnaire.description ? (
                            <p className="text-body-subtle mx-auto mt-3 max-w-xl text-sm">
                                {questionnaire.description}
                            </p>
                        ) : null}
                    </header>

                    {isClosed ? (
                        <div className="mx-auto mt-8 max-w-2xl">
                            <Card className="p-8 text-center">
                                <h2 className="text-heading text-xl font-semibold">
                                    Kuesioner Ditutup
                                </h2>
                                <p className="text-body mt-3 text-sm">
                                    Kuesioner ini sudah tidak menerima jawaban
                                    lagi. Terima kasih atas partisipasinya.
                                </p>
                            </Card>
                        </div>
                    ) : isCompleted ? (
                        <div className="mx-auto mt-8 max-w-2xl">
                            <Card className="border-success bg-success-soft p-8 text-center">
                                <span className="bg-success mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                    >
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </span>
                                <h2 className="text-heading mt-4 text-xl font-semibold">
                                    Terima kasih!
                                </h2>
                                <p className="text-body mt-2 text-sm">
                                    Jawabanmu sudah kami terima. Kamu tidak bisa
                                    mengubahnya lagi.
                                </p>
                                <Button
                                    className="mx-auto mt-6"
                                    asLink={my.index.url()}
                                >
                                    Kuesioner Saya
                                </Button>
                            </Card>
                        </div>
                    ) : (
                        <>
                            <div className="mt-8 grid items-start gap-6 lg:mt-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch lg:overflow-hidden">
                                <div className="pb-32 lg:min-h-0 lg:overflow-y-auto lg:pr-3 lg:pb-0">
                                    <div className="bg-neutral-primary sticky top-0 z-20 hidden pb-4 lg:block">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-heading font-medium">
                                                {answerCount} /{' '}
                                                {questions.length} terjawab
                                            </span>
                                            <span className="text-body-subtle">
                                                {percent}%
                                            </span>
                                        </div>
                                        <div className="bg-neutral-tertiary mt-2 h-2 overflow-hidden rounded-none">
                                            <div
                                                className="bg-brand h-full rounded-none transition-all duration-300"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {questions.map(
                                        (question, questionIndex) => (
                                            <div
                                                key={question.id}
                                                ref={(el) => {
                                                    questionRefs.current[
                                                        questionIndex
                                                    ] = el;
                                                }}
                                                data-index={questionIndex}
                                                className="scroll-mt-6 lg:scroll-mt-20"
                                            >
                                                <Card className="p-5 sm:p-6">
                                                    <div className="flex gap-3">
                                                        <span className="bg-brand-soft text-fg-brand-strong flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold">
                                                            {questionIndex + 1}
                                                        </span>
                                                        <p className="text-heading pt-1 text-sm leading-relaxed font-medium sm:text-base">
                                                            {question.text}
                                                        </p>
                                                    </div>

                                                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                        {SCALE_VALUES.map(
                                                            (value) => {
                                                                const selected =
                                                                    answers[
                                                                        question
                                                                            .id
                                                                    ] === value;
                                                                return (
                                                                    <button
                                                                        key={
                                                                            value
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setAnswers(
                                                                                (
                                                                                    current,
                                                                                ) => ({
                                                                                    ...current,
                                                                                    [question.id]:
                                                                                        value,
                                                                                }),
                                                                            )
                                                                        }
                                                                        className={`flex min-h-[72px] flex-col items-center justify-center rounded-none border-2 px-3 py-3 text-center transition-all duration-200 ${
                                                                            selected
                                                                                ? 'border-brand bg-brand scale-[1.03] text-white shadow-md'
                                                                                : 'border-border-default bg-neutral-secondary-soft text-heading hover:border-brand-soft hover:bg-brand-softer'
                                                                        }`}
                                                                    >
                                                                        <span className="text-base font-bold">
                                                                            {
                                                                                SCALE_LABELS[
                                                                                    value
                                                                                ]
                                                                            }
                                                                        </span>
                                                                        <span
                                                                            className={`mt-0.5 text-[11px] leading-tight ${
                                                                                selected
                                                                                    ? 'text-white/80'
                                                                                    : 'text-body-subtle'
                                                                            }`}
                                                                        >
                                                                            {
                                                                                SCALE_DESCRIPTIONS[
                                                                                    value
                                                                                ]
                                                                            }
                                                                        </span>
                                                                    </button>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </Card>
                                            </div>
                                        ),
                                    )}

                                    {errors?.answers ? (
                                        <p className="text-fg-danger text-sm">
                                            {errors.answers}
                                        </p>
                                    ) : null}

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-body-subtle text-xs leading-relaxed sm:max-w-xs">
                                            Jawabanmu akan dikirim sebagai draf
                                            bila belum lengkap. Kamu bisa
                                            melanjutkan kapan saja.
                                        </p>
                                        <m.div
                                            animate={shakeControls}
                                            className="flex flex-col gap-3 sm:flex-row sm:items-center"
                                        >
                                            <Button
                                                variant="ghost"
                                                onClick={() => save(true)}
                                                disabled={
                                                    answerCount === 0 ||
                                                    saving !== null
                                                }
                                            >
                                                Simpan Draf
                                            </Button>
                                            <Button
                                                onClick={submitFinal}
                                                disabled={saving !== null}
                                            >
                                                {saving === 'final'
                                                    ? 'Mengirim...'
                                                    : 'Kirim Jawaban'}
                                            </Button>
                                        </m.div>
                                    </div>
                                </div>

                                <aside className="hidden lg:block lg:min-h-0">
                                    <Card className="flex h-full flex-col p-5">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-heading text-sm font-semibold">
                                                Kemajuan
                                            </h2>
                                            <span className="text-fg-brand-strong text-sm font-bold">
                                                {percent}%
                                            </span>
                                        </div>
                                        <div className="bg-neutral-tertiary mt-3 h-2 overflow-hidden rounded-none">
                                            <div
                                                className="bg-brand h-full rounded-none transition-all duration-300"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <p className="text-body-subtle mt-2 text-xs">
                                            {answerCount} dari{' '}
                                            {questions.length} soal terjawab
                                        </p>

                                        <div className="mt-4 flex gap-4 text-[11px]">
                                            <span className="flex items-center gap-1.5">
                                                <span className="bg-brand inline-block h-2.5 w-2.5 rounded-full" />
                                                Terjawab
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="border-border-default bg-neutral-secondary-soft inline-block h-2.5 w-2.5 rounded-full border" />
                                                Belum
                                            </span>
                                        </div>

                                        <ol className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                                            {questions.map(
                                                (question, index) => {
                                                    const answered =
                                                        answers[question.id] !==
                                                        undefined;
                                                    const active =
                                                        index === activeIndex;
                                                    return (
                                                        <li key={question.id}>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    jumpToQuestion(
                                                                        index,
                                                                    )
                                                                }
                                                                className={cn(
                                                                    'flex w-full items-center gap-3 rounded-none px-2 py-2 text-left transition-colors',
                                                                    active
                                                                        ? 'bg-brand-softer'
                                                                        : 'hover:bg-neutral-secondary-medium',
                                                                )}
                                                            >
                                                                <span
                                                                    className={cn(
                                                                        'flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold',
                                                                        answered
                                                                            ? 'bg-brand text-on-brand'
                                                                            : active
                                                                              ? 'border-brand text-fg-brand-strong ring-brand/30 ring-2'
                                                                              : 'border-border-default bg-neutral-secondary-soft text-body border',
                                                                    )}
                                                                >
                                                                    {index + 1}
                                                                </span>
                                                                <span
                                                                    className={cn(
                                                                        'truncate text-xs',
                                                                        answered
                                                                            ? 'text-body'
                                                                            : 'text-body-subtle',
                                                                    )}
                                                                >
                                                                    {
                                                                        question.text
                                                                    }
                                                                </span>
                                                            </button>
                                                        </li>
                                                    );
                                                },
                                            )}
                                        </ol>

                                        <p className="text-body-subtle mt-3 text-center text-[11px]">
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
                                        </p>
                                    </Card>
                                </aside>
                            </div>

                            <div className="border-border-default bg-neutral-primary/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 backdrop-blur-md lg:hidden">
                                <div className="mx-auto flex max-w-6xl items-center gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-heading font-medium">
                                                {answerCount}/{questions.length}{' '}
                                                terjawab
                                            </span>
                                            <span className="text-body-subtle">
                                                {percent}%
                                            </span>
                                        </div>
                                        <div className="bg-neutral-tertiary mt-2 h-1.5 overflow-hidden rounded-none">
                                            <div
                                                className="bg-brand h-full rounded-none transition-all duration-300"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="white"
                                        onClick={() => setMenuOpen(true)}
                                    >
                                        Daftar Soal
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <p className="text-body-subtle px-6 pt-10 pb-8 text-center text-xs lg:hidden">
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
                </p>
            </main>

            <AnimatePresence>
                {menuOpen ? (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={() => setMenuOpen(false)}
                        />
                        <m.div
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 24, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="border-border-default bg-neutral-primary-soft absolute inset-x-0 bottom-0 max-h-[70dvh] overflow-y-auto rounded-t-2xl border-t p-5 pb-8 shadow-lg"
                        >
                            <div className="bg-neutral-tertiary mx-auto mb-4 h-1 w-10 rounded-full" />
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-heading text-base font-semibold">
                                    Daftar Soal
                                </h2>
                                <span className="text-body-subtle text-xs">
                                    {answerCount}/{questions.length} terjawab ·{' '}
                                    {percent}%
                                </span>
                            </div>

                            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
                                {questions.map((question, index) => {
                                    const answered =
                                        answers[question.id] !== undefined;
                                    const active = index === activeIndex;
                                    return (
                                        <button
                                            key={question.id}
                                            type="button"
                                            onClick={() =>
                                                jumpToQuestion(index)
                                            }
                                            aria-label={`Lompat ke soal ${index + 1}`}
                                            className={cn(
                                                'flex h-11 w-full items-center justify-center rounded-full border text-sm font-bold transition-colors',
                                                answered
                                                    ? 'border-brand bg-brand text-on-brand'
                                                    : active
                                                      ? 'border-brand text-fg-brand-strong ring-brand/30 ring-2'
                                                      : 'border-border-default bg-neutral-secondary-soft text-body',
                                            )}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </m.div>
                    </div>
                ) : null}

                {incompleteOpen ? (
                    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setIncompleteOpen(false)}
                        />
                        <m.div
                            initial={{ opacity: 0, y: 40, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.97 }}
                            transition={{
                                type: 'spring',
                                stiffness: 320,
                                damping: 30,
                            }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="incomplete-title"
                            className="border-border-default bg-neutral-primary-soft relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border-t p-6 pb-8 shadow-xl sm:rounded-2xl sm:border sm:pb-6"
                        >
                            <button
                                type="button"
                                onClick={() => setIncompleteOpen(false)}
                                aria-label="Tutup"
                                className="text-body hover:bg-neutral-tertiary-soft hover:text-heading absolute top-4 right-4 rounded-full p-1.5 transition-colors"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                >
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="text-center">
                                <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
                                    <m.div
                                        className="bg-brand/10 absolute inset-0 rounded-full"
                                        animate={{ scale: [1, 1.12, 1] }}
                                        transition={{
                                            duration: 2.4,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }}
                                    />
                                    <m.img
                                        src="/images/questions.svg"
                                        alt="Ilustrasi soal yang belum dijawab"
                                        className="relative h-28 w-auto"
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }}
                                    />
                                </div>

                                <h2
                                    id="incomplete-title"
                                    className="text-heading mt-4 text-xl font-bold tracking-tight"
                                >
                                    Hampir selesai!
                                </h2>
                                <p className="text-body mx-auto mt-2 max-w-xs text-sm leading-relaxed">
                                    Masih ada{' '}
                                    <m.span
                                        initial={{ scale: 0.4, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 420,
                                            damping: 18,
                                            delay: 0.1,
                                        }}
                                        className="bg-brand text-on-brand inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums"
                                    >
                                        {unansweredCount}
                                    </m.span>{' '}
                                    soal dari {questions.length} yang belum kamu
                                    jawab.
                                </p>
                            </div>

                            <div className="mt-5">
                                <div className="text-body-subtle flex items-center justify-between text-xs">
                                    <span>Progres jawaban</span>
                                    <span className="text-heading font-semibold tabular-nums">
                                        {answerCount}/{questions.length} ·{' '}
                                        {percent}%
                                    </span>
                                </div>
                                <div className="bg-neutral-tertiary mt-2 h-2 overflow-hidden rounded-full">
                                    <m.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percent}%` }}
                                        transition={{
                                            duration: 0.6,
                                            ease: 'easeOut',
                                            delay: 0.15,
                                        }}
                                        className="bg-brand h-full rounded-full"
                                    />
                                </div>
                            </div>

                            {unansweredCount > 0 ? (
                                <div className="mt-5">
                                    <p className="text-body-subtle text-xs font-medium">
                                        Ketuk nomor untuk menuju soal yang belum
                                        dijawab:
                                    </p>
                                    <div className="mt-2.5 flex flex-wrap gap-2">
                                        {unanswered.map(({ index }, order) => (
                                            <m.button
                                                key={index}
                                                type="button"
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.6,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                transition={{
                                                    delay: Math.min(
                                                        0.2 + order * 0.02,
                                                        0.7,
                                                    ),
                                                    ease: 'easeOut',
                                                }}
                                                whileHover={{ scale: 1.12 }}
                                                whileTap={{ scale: 0.92 }}
                                                onClick={() =>
                                                    goToUnanswered(index)
                                                }
                                                aria-label={`Menuju soal ${index + 1}`}
                                                className="border-border-default bg-neutral-secondary-soft text-heading hover:border-brand hover:text-fg-brand-strong flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-sm font-bold tabular-nums transition-colors"
                                            >
                                                {index + 1}
                                            </m.button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <Button
                                    className="sm:min-w-40"
                                    onClick={() =>
                                        goToUnanswered(
                                            unanswered[0]?.index ?? 0,
                                        )
                                    }
                                >
                                    Lanjut Isi
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="sm:min-w-40"
                                    disabled={
                                        answerCount === 0 || saving !== null
                                    }
                                    onClick={() => {
                                        setIncompleteOpen(false);
                                        save(true);
                                    }}
                                >
                                    Simpan Draf
                                </Button>
                            </div>
                        </m.div>
                    </div>
                ) : null}

                {confirmOpen ? (
                    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => {
                                if (saving === null) {
                                    setConfirmOpen(false);
                                }
                            }}
                        />
                        <m.div
                            initial={{ opacity: 0, y: 48, scale: 0.94 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 32, scale: 0.96 }}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 28,
                            }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="confirm-title"
                            className="border-border-default bg-neutral-primary-soft relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border-t p-6 pb-8 shadow-xl sm:rounded-2xl sm:border sm:pb-6"
                        >
                            <button
                                type="button"
                                onClick={() => setConfirmOpen(false)}
                                disabled={saving !== null}
                                aria-label="Tutup"
                                className="text-body hover:bg-neutral-tertiary-soft hover:text-heading absolute top-4 right-4 rounded-full p-1.5 transition-colors disabled:pointer-events-none disabled:opacity-50"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                >
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="text-center">
                                <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
                                    <m.div
                                        className="bg-brand/10 absolute inset-0 rounded-full"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{
                                            duration: 2.6,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }}
                                    />
                                    <m.div
                                        className="border-brand/30 absolute inset-1 rounded-full border border-dashed"
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            duration: 20,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                    />
                                    <m.img
                                        src="/images/online-review.svg"
                                        alt="Ilustrasi konfirmasi pengiriman jawaban"
                                        className="relative h-28 w-auto"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{
                                            scale: 1,
                                            opacity: 1,
                                            y: [0, -6, 0],
                                        }}
                                        transition={{
                                            opacity: { duration: 0.3 },
                                            scale: {
                                                type: 'spring',
                                                stiffness: 260,
                                                damping: 20,
                                            },
                                            y: {
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                                delay: 0.3,
                                            },
                                        }}
                                    />
                                    <m.span
                                        initial={{ scale: 0, rotate: -40 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 420,
                                            damping: 16,
                                            delay: 0.2,
                                        }}
                                        className="bg-brand text-on-brand absolute -top-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <m.path
                                                d="M20 6L9 17l-5-5"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{
                                                    duration: 0.4,
                                                    delay: 0.5,
                                                    ease: 'easeOut',
                                                }}
                                            />
                                        </svg>
                                    </m.span>
                                </div>

                                <h2
                                    id="confirm-title"
                                    className="text-heading mt-4 text-xl font-bold tracking-tight"
                                >
                                    Kirim Jawaban?
                                </h2>
                                <p className="text-body mx-auto mt-2 max-w-xs text-sm leading-relaxed">
                                    Semua soal sudah kamu jawab. Periksa kembali
                                    sebelum dikirim — jawaban yang sudah
                                    terkirim tidak dapat diubah lagi.
                                </p>
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                                {[
                                    {
                                        label: 'Total Soal',
                                        value: questions.length,
                                    },
                                    { label: 'Terjawab', value: answerCount },
                                    { label: 'Progres', value: `${percent}%` },
                                ].map((stat, index) => (
                                    <m.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: 0.15 + index * 0.07,
                                            ease: 'easeOut',
                                        }}
                                        className="border-border-default bg-neutral-secondary-soft rounded-xl border px-2 py-3 text-center"
                                    >
                                        <p className="text-heading text-lg font-bold tabular-nums">
                                            {stat.value}
                                        </p>
                                        <p className="text-body-subtle mt-0.5 text-[11px]">
                                            {stat.label}
                                        </p>
                                    </m.div>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <Button
                                    variant="ghost"
                                    className="sm:min-w-40"
                                    disabled={saving !== null}
                                    onClick={() => setConfirmOpen(false)}
                                >
                                    Periksa Lagi
                                </Button>
                                <Button
                                    className="sm:min-w-40"
                                    disabled={saving !== null}
                                    onClick={confirmFinal}
                                >
                                    {saving === 'final' ? (
                                        <>
                                            <m.span
                                                className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                                                animate={{ rotate: 360 }}
                                                transition={{
                                                    duration: 0.7,
                                                    repeat: Infinity,
                                                    ease: 'linear',
                                                }}
                                            />
                                            Mengirim...
                                        </>
                                    ) : (
                                        'Ya, Kirim Sekarang'
                                    )}
                                </Button>
                            </div>
                        </m.div>
                    </div>
                ) : null}
            </AnimatePresence>
        </LazyMotion>
    );
}

function progressPercent(answered: number, total: number): number {
    if (total === 0) {
        return 0;
    }
    return Math.round((answered / total) * 100);
}
