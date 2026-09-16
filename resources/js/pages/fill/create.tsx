import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { store } from '../../routes/fill';
import { index } from '../../routes/questionnaires';
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

    const { questionnaire, questions, response, errors } = page.props;

    const isClosed = questionnaire.status === 'closed';
    const isCompleted = response?.status === 'completed';

    const answerCount = Object.keys(answers).length;
    const canSubmitFinal =
        questions.length > 0 && answerCount === questions.length;

    const save = (draft: boolean) => {
        if (answerCount === 0) {
            return;
        }
        setSaving(draft ? 'draft' : 'final');
        router.post(
            store({ questionnaire: questionnaire.uuid }).url,
            { answers },
            { onFinish: () => setSaving(null) },
        );
    };

    return (
        <>
            <Head title={questionnaire.title} />

            <main className="bg-neutral-primary min-h-dvh px-4 py-8 sm:py-12">
                <div className="mx-auto max-w-2xl space-y-6">
                    <header className="text-center">
                        <img
                            src="/images/online-review.svg"
                            alt="Ilustrasi kuesioner"
                            className="mx-auto h-24 w-auto sm:h-28"
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
                        <Card className="p-8 text-center">
                            <h2 className="text-heading text-xl font-semibold">
                                Kuesioner Ditutup
                            </h2>
                            <p className="text-body mt-3 text-sm">
                                Kuesioner ini sudah tidak menerima jawaban lagi.
                                Terima kasih atas partisipasinya.
                            </p>
                        </Card>
                    ) : isCompleted ? (
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
                                asLink={index.url()}
                            >
                                Kembali ke Awal
                            </Button>
                        </Card>
                    ) : (
                        <>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-heading font-medium">
                                    {answerCount} / {questions.length} terjawab
                                </span>
                                <span className="text-body-subtle">
                                    {progressPercent(
                                        answerCount,
                                        questions.length,
                                    )}
                                    %
                                </span>
                            </div>
                            <div className="bg-neutral-tertiary h-2 overflow-hidden rounded-none">
                                <div
                                    className="bg-brand h-full rounded-none transition-all duration-300"
                                    style={{
                                        width: `${progressPercent(answerCount, questions.length)}%`,
                                    }}
                                />
                            </div>

                            <div className="space-y-5">
                                {questions.map((question, questionIndex) => (
                                    <Card
                                        key={question.id}
                                        className="p-5 sm:p-6"
                                    >
                                        <div className="flex gap-3">
                                            <span className="bg-brand-soft text-fg-brand-strong flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold">
                                                {questionIndex + 1}
                                            </span>
                                            <p className="text-heading pt-1 text-sm leading-relaxed font-medium sm:text-base">
                                                {question.text}
                                            </p>
                                        </div>

                                        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            {SCALE_VALUES.map((value) => {
                                                const selected =
                                                    answers[question.id] ===
                                                    value;
                                                return (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() =>
                                                            setAnswers(
                                                                (current) => ({
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
                                            })}
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {errors?.answers ? (
                                <p className="text-fg-danger text-sm">
                                    {errors.answers}
                                </p>
                            ) : null}

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-body-subtle text-xs leading-relaxed sm:max-w-xs">
                                    Jawabanmu akan dikirim sebagai draf bila
                                    belum lengkap. Kamu bisa melanjutkan kapan
                                    saja.
                                </p>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <Button
                                        variant="ghost"
                                        onClick={() => save(true)}
                                        disabled={
                                            answerCount === 0 || saving !== null
                                        }
                                    >
                                        Simpan Draf
                                    </Button>
                                    <Button
                                        onClick={() => save(false)}
                                        disabled={
                                            !canSubmitFinal || saving !== null
                                        }
                                    >
                                        {saving === 'final'
                                            ? 'Mengirim...'
                                            : 'Kirim Jawaban'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <p className="text-body-subtle px-6 pt-10 pb-8 text-center text-xs">
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
        </>
    );
}

function progressPercent(answered: number, total: number): number {
    if (total === 0) {
        return 0;
    }
    return Math.round((answered / total) * 100);
}
