import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import AppLayout from '../../components/AppLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';
import { create as fillPage } from '../../routes/fill';
import {
    close,
    index,
    publish,
    responses,
    store,
    update,
} from '../../routes/questionnaires';
import type { QuestionItem, QuestionnaireStatus } from '../../types';

type Props = {
    questionnaire?: {
        id: number;
        uuid: string;
        title: string;
        description: string | null;
        status: QuestionnaireStatus;
        questions: QuestionItem[];
    };
};

type QuestionRow = { key: string; id?: number; text: string };

const freshKey = (): string =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function QuestionnaireEdit() {
    const { questionnaire, errors } = usePage<Props>().props;

    const initialQuestions: QuestionRow[] = useMemo(
        () =>
            (questionnaire?.questions ?? []).map((q) => ({
                key: freshKey(),
                id: q.id,
                text: q.text,
            })),
        [questionnaire?.id],
    );

    const [title, setTitle] = useState(questionnaire?.title ?? '');
    const [description, setDescription] = useState(
        questionnaire?.description ?? '',
    );
    const [questions, setQuestions] = useState<QuestionRow[]>(
        questionnaire ? initialQuestions : [{ key: freshKey(), text: '' }],
    );

    const isEdit = questionnaire != null;

    const addQuestion = () => {
        setQuestions((current) => [...current, { key: freshKey(), text: '' }]);
    };

    const removeQuestion = (key: string) => {
        setQuestions((current) => current.filter((q) => q.key !== key));
    };

    const updateQuestion = (key: string, text: string) => {
        setQuestions((current) =>
            current.map((q) => (q.key === key ? { ...q, text } : q)),
        );
    };

    const moveQuestion = (key: string, direction: 'up' | 'down') => {
        setQuestions((current) => {
            const index = current.findIndex((q) => q.key === key);
            const target = direction === 'up' ? index - 1 : index + 1;
            if (index < 0 || target < 0 || target >= current.length) {
                return current;
            }
            const copy = [...current];
            const [item] = copy.splice(index, 1);
            copy.splice(target, 0, item);
            return copy;
        });
    };

    const submit = () => {
        const payload = {
            title,
            description,
            questions: questions
                .filter((q) => q.text.trim() !== '')
                .map((q) => ({ id: q.id, text: q.text.trim() })),
        };

        if (payload.questions.length === 0) {
            return;
        }

        if (isEdit) {
            router.put(
                update({ questionnaire: questionnaire.uuid }).url,
                payload,
                { preserveScroll: true },
            );
        } else {
            router.post(store.url(), payload);
        }
    };

    const copyLink = async () => {
        if (questionnaire) {
            await navigator.clipboard.writeText(
                fillPage({ questionnaire: questionnaire.uuid }).url,
            );
        }
    };

    return (
        <AppLayout
            title={isEdit ? 'Edit Kuesioner' : 'Buat Kuesioner'}
            actions={
                isEdit ? (
                    <div className="flex items-center gap-3">
                        <StatusBadge status={questionnaire.status} />
                        <Button
                            size="sm"
                            variant="ghost"
                            asLink={
                                responses({
                                    questionnaire: questionnaire.uuid,
                                }).url
                            }
                        >
                            Dashboard
                        </Button>
                        <Button size="sm" variant="ghost" onClick={copyLink}>
                            Salin Link
                        </Button>
                    </div>
                ) : undefined
            }
        >
            <Head title={isEdit ? 'Edit Kuesioner' : 'Buat Kuesioner'} />

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card className="space-y-5 p-6">
                        <div>
                            <label
                                htmlFor="title"
                                className="text-heading mb-2 block text-sm font-medium"
                            >
                                Judul Kuesioner
                            </label>
                            <Input
                                id="title"
                                name="title"
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                placeholder="Contoh: Survei Kepuasan Mahasiswa"
                                error={errors.title}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="description"
                                className="text-heading mb-2 block text-sm font-medium"
                            >
                                Deskripsi (opsional)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                className="border-border-default-medium bg-neutral-secondary-medium text-heading placeholder:text-body hover:border-border-default-strong focus:border-border-brand focus:ring-brand block w-full rounded-none border px-3 py-2.5 text-sm shadow-xs transition-all duration-200 focus:ring-1 focus:outline-none"
                                placeholder="Jelaskan tujuan kuesioner untuk responden..."
                            />
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-heading text-lg font-semibold">
                                Pertanyaan
                            </h2>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={addQuestion}
                            >
                                + Tambah Pertanyaan
                            </Button>
                        </div>

                        {errors.questions ? (
                            <p className="text-fg-danger mb-4 text-sm">
                                {errors.questions}
                            </p>
                        ) : null}

                        <div className="space-y-4">
                            {questions.map((question, index) => (
                                <div
                                    key={question.key}
                                    className="border-border-default bg-neutral-secondary-soft flex items-start gap-3 rounded-none border p-4"
                                >
                                    <span className="bg-brand-soft text-fg-brand-strong mt-3 flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-bold">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1">
                                        <Input
                                            name={`questions.${question.key}.text`}
                                            value={question.text}
                                            onChange={(event) =>
                                                updateQuestion(
                                                    question.key,
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={`Pertanyaan ${index + 1} — contoh: "Materi yang diberikan mudah dipahami."`}
                                            error={
                                                errors[
                                                    `questions.${index}.text`
                                                ] ??
                                                errors[
                                                    `questions.${question.key}.text`
                                                ]
                                            }
                                        />
                                    </div>
                                    <div className="mt-1 flex flex-none flex-col items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                moveQuestion(question.key, 'up')
                                            }
                                            disabled={index === 0}
                                            aria-label="Naik"
                                            className="text-body-subtle hover:text-heading rounded-none p-1 transition-colors disabled:opacity-30"
                                        >
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M18 15l-6-6-6 6" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                moveQuestion(
                                                    question.key,
                                                    'down',
                                                )
                                            }
                                            disabled={
                                                index === questions.length - 1
                                            }
                                            aria-label="Turun"
                                            className="text-body-subtle hover:text-heading rounded-none p-1 transition-colors disabled:opacity-30"
                                        >
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeQuestion(question.key)
                                            }
                                            aria-label="Hapus pertanyaan"
                                            className="text-fg-danger hover:text-fg-danger-strong rounded-none p-1 transition-colors"
                                        >
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-border-default mt-6 border-t pt-5">
                            <Button
                                onClick={submit}
                                disabled={
                                    questions.filter((q) => q.text.trim())
                                        .length === 0
                                }
                            >
                                {isEdit
                                    ? 'Simpan Perubahan'
                                    : 'Simpan Kuesioner'}
                            </Button>
                            {isEdit ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        className="ml-3"
                                        onClick={() => {
                                            if (
                                                questionnaire.status ===
                                                'published'
                                            ) {
                                                router.post(
                                                    close({
                                                        questionnaire:
                                                            questionnaire.uuid,
                                                    }).url,
                                                );
                                            } else {
                                                router.post(
                                                    publish({
                                                        questionnaire:
                                                            questionnaire.uuid,
                                                    }).url,
                                                );
                                            }
                                        }}
                                    >
                                        {questionnaire.status === 'published'
                                            ? 'Tutup'
                                            : 'Terbitkan'}
                                    </Button>
                                    <LinkToIndex />
                                </>
                            ) : null}
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    {isEdit ? (
                        <Card className="p-6">
                            <h3 className="text-heading text-base font-semibold">
                                Link Kuesioner
                            </h3>
                            <p className="text-body-subtle mt-1 text-xs">
                                Bagikan link ini kepada responden. Mereka login
                                dengan Google lalu mengisi sekali.
                            </p>
                            <div className="mt-3 flex gap-2">
                                <Input
                                    readOnly
                                    value={
                                        fillPage({
                                            questionnaire: questionnaire.uuid,
                                        }).url
                                    }
                                    onFocus={(event) =>
                                        event.currentTarget.select()
                                    }
                                    className="flex-1"
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={copyLink}
                                >
                                    Salin
                                </Button>
                            </div>
                        </Card>
                    ) : null}
                    <Card className="bg-brand-softer p-6">
                        <h3 className="text-heading text-base font-semibold">
                            Skala Jawaban
                        </h3>
                        <ul className="mt-4 space-y-3 text-sm">
                            <li>
                                <strong className="text-fg-brand-strong">
                                    SDA
                                </strong>{' '}
                                — Sangat Tidak Setuju
                            </li>
                            <li>
                                <strong className="text-fg-brand-strong">
                                    DA
                                </strong>{' '}
                                — Tidak Setuju
                            </li>
                            <li>
                                <strong className="text-fg-brand-strong">
                                    A
                                </strong>{' '}
                                — Setuju
                            </li>
                            <li>
                                <strong className="text-fg-brand-strong">
                                    SA
                                </strong>{' '}
                                — Sangat Setuju
                            </li>
                        </ul>
                    </Card>
                    <Card className="text-body p-6 text-sm">
                        <p>
                            Setiap pertanyaan dijawab menggunakan skala yang
                            sama. Responden wajib login dengan Google dan setiap
                            orang hanya bisa mengisi satu kali.
                        </p>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function LinkToIndex() {
    return (
        <Button variant="ghost" className="ml-3" asLink={index.url()}>
            Batal
        </Button>
    );
}
