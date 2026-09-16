import { Head, usePage } from '@inertiajs/react';

import AppLayout from '../../components/AppLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import { create, index, responses } from '../../routes/questionnaires';
import type { QuestionnaireSummary } from '../../types';

type Stats = {
    total_questionnaires: number;
    total_published: number;
    total_respondents: number;
    total_questions: number;
};

const statItems: { key: keyof Stats; label: string; icon: React.ReactNode }[] =
    [
        {
            key: 'total_questionnaires',
            label: 'Total Kuesioner',
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
            ),
        },
        {
            key: 'total_published',
            label: 'Sedang Terbit',
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
            ),
        },
        {
            key: 'total_respondents',
            label: 'Total Responden',
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
        },
        {
            key: 'total_questions',
            label: 'Total Pertanyaan',
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
            ),
        },
    ];

export default function DashboardIndex() {
    const { auth } = usePage().props;

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {statItems.map((item) => {
                    const value =
                        (auth as unknown as { stats?: Stats }).stats?.[
                            item.key
                        ] ?? 0;
                    return (
                        <Stat
                            key={item.key}
                            label={item.label}
                            value={value}
                            icon={item.icon}
                        />
                    );
                })}
            </div>

            <div className="mt-8 flex items-center justify-between">
                <h2 className="text-heading text-xl font-semibold">
                    Kuesioner Terbaru
                </h2>
                <Button
                    variant="brand"
                    className="hidden sm:inline-flex"
                    asLink={create.url()}
                >
                    Buat Kuesioner
                </Button>
            </div>

            <RecentList />
        </AppLayout>
    );
}

function Stat({
    label,
    value,
    icon,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
}) {
    return (
        <Card className="p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-body-subtle text-sm">{label}</p>
                    <p className="text-heading mt-1 text-3xl font-bold tracking-tight">
                        {value.toLocaleString('id-ID')}
                    </p>
                </div>
                <span className="bg-brand-softer text-fg-brand-strong flex h-10 w-10 items-center justify-center rounded-full">
                    {icon}
                </span>
            </div>
        </Card>
    );
}

function RecentList() {
    const { stats } = usePage<{ stats?: Stats }>().props;
    const { questionnaires } = usePage<{
        questionnaires?: QuestionnaireSummary[];
    }>().props;
    const list = questionnaires ?? [];
    const anything = (stats?.total_questionnaires ?? 0) > 0;

    if (!anything || list.length === 0) {
        return (
            <Card className="mt-4 p-10 text-center">
                <img
                    src="/images/questions.svg"
                    alt="Ilustrasi tanpa kuesioner"
                    className="mx-auto h-28 w-auto"
                />
                <h3 className="text-heading mt-4 text-lg font-semibold">
                    Belum ada kuesioner
                </h3>
                <p className="text-body-subtle mt-1 text-sm">
                    Buat kuesioner pertamamu untuk mulai mengumpulkan jawaban.
                </p>
                <Button asLink={create.url()} className="mt-5">
                    Buat Kuesioner
                </Button>
            </Card>
        );
    }

    return (
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {list.map((questionnaire) => (
                <Card
                    key={questionnaire.id}
                    className="flex flex-col gap-4 p-5"
                >
                    <div className="flex items-start justify-between gap-3">
                        <h3 className="text-heading truncate text-base font-semibold">
                            {questionnaire.title}
                        </h3>
                        <StatusBadge status={questionnaire.status} />
                    </div>
                    <p className="text-body line-clamp-2 text-sm">
                        {questionnaire.description ?? 'Tanpa deskripsi.'}
                    </p>
                    <div className="text-body-subtle mt-auto flex items-center gap-4 text-sm">
                        <span>
                            {questionnaire.questions_count ?? 0} pertanyaan
                        </span>
                        <span>
                            {questionnaire.responses_count ?? 0} responden
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            asLink={
                                responses({
                                    questionnaire: questionnaire.id,
                                }).url
                            }
                            className="flex-1"
                        >
                            Dashboard
                        </Button>
                        <Button size="sm" variant="ghost" asLink={index.url()}>
                            Lihat Semua
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}
