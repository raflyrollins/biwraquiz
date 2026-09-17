import { Head } from '@inertiajs/react';

import AppLayout from '../../components/AppLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import { home } from '../../routes';
import { create as fillPage } from '../../routes/fill';
import type { QuestionnaireStatus } from '../../types';

type MyResponse = {
    uuid: string;
    title: string;
    description: string | null;
    questionnaire_status: QuestionnaireStatus;
    response_status: 'in_progress' | 'completed';
    answered: number;
    total: number;
    updated_at: string | null;
    submitted_at: string | null;
};

type Props = {
    in_progress: MyResponse[];
    completed: MyResponse[];
};

export default function MyIndex({ in_progress, completed }: Props) {
    const empty = in_progress.length === 0 && completed.length === 0;

    return (
        <AppLayout title="Kuesioner Saya">
            <Head title="Kuesioner Saya" />

            {empty ? (
                <Card className="p-10 text-center">
                    <img
                        src="/images/questions.svg"
                        alt="Ilustrasi tanpa kuesioner"
                        className="mx-auto h-28 w-auto"
                    />
                    <h2 className="text-heading mt-4 text-lg font-semibold">
                        Belum ada kuesioner
                    </h2>
                    <p className="text-body-subtle mt-1 text-sm">
                        Kuesioner yang kamu isi akan muncul di sini, termasuk
                        draf yang belum selesai.
                    </p>
                    <Button asLink={home.url()} className="mt-5">
                        Ke Beranda
                    </Button>
                </Card>
            ) : (
                <div className="flex flex-col gap-10">
                    <Section
                        title="Perlu Dilanjutkan"
                        subtitle="Draf jawabanmu tersimpan. Kamu bisa melanjutkan kapan saja."
                        items={in_progress}
                    />
                    <Section
                        title="Selesai"
                        subtitle="Kuesioner yang jawabannya sudah kamu kirim."
                        items={completed}
                    />
                </div>
            )}
        </AppLayout>
    );
}

function Section({
    title,
    subtitle,
    items,
}: {
    title: string;
    subtitle: string;
    items: MyResponse[];
}) {
    if (items.length === 0) {
        return null;
    }

    return (
        <section>
            <div className="mb-4">
                <h2 className="text-heading text-lg font-semibold">{title}</h2>
                <p className="text-body-subtle text-sm">{subtitle}</p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                    <ResponseCard key={item.uuid} item={item} />
                ))}
            </div>
        </section>
    );
}

function ResponseCard({ item }: { item: MyResponse }) {
    const isDraft = item.response_status === 'in_progress';
    const isOpen = item.questionnaire_status === 'published';
    const percent = progressPercent(item.answered, item.total);

    return (
        <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-heading truncate text-base font-semibold">
                    {item.title}
                </h3>
                <StatusBadge status={item.questionnaire_status} />
            </div>

            <p className="text-body line-clamp-2 text-sm">
                {item.description ?? 'Tanpa deskripsi.'}
            </p>

            {isDraft ? (
                <div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-body-subtle">Kemajuan</span>
                        <span className="text-heading font-semibold">
                            {item.answered} / {item.total}
                        </span>
                    </div>
                    <div className="bg-neutral-tertiary mt-2 h-2 overflow-hidden rounded-none">
                        <div
                            className="bg-brand h-full rounded-none transition-all duration-300"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
            ) : (
                <p className="text-body-subtle text-xs">
                    {item.submitted_at
                        ? `Dikirim ${formatDate(item.submitted_at)}`
                        : 'Sudah dikirim'}
                </p>
            )}

            <div className="mt-auto">
                {isDraft && isOpen ? (
                    <Button
                        className="w-full"
                        asLink={fillPage({ questionnaire: item.uuid }).url}
                    >
                        Lanjutkan
                    </Button>
                ) : isDraft ? (
                    <Button className="w-full" disabled>
                        Ditutup
                    </Button>
                ) : isOpen ? (
                    <Button
                        variant="ghost"
                        className="w-full"
                        asLink={fillPage({ questionnaire: item.uuid }).url}
                    >
                        Lihat Jawaban
                    </Button>
                ) : (
                    <Button className="w-full" disabled>
                        Ditutup
                    </Button>
                )}
            </div>
        </Card>
    );
}

function progressPercent(answered: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Math.round((answered / total) * 100);
}

function formatDate(value: string): string {
    const date = new Date(value);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}
