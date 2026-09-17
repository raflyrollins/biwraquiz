import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
    Bar,
    BarChart,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import AppLayout from '../../components/AppLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Pagination from '../../components/ui/Pagination';
import type { PaginationLink } from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import { download } from '../../routes/exports';
import { store as storeExport } from '../../routes/questionnaires/exports';
import { destroy as destroyResponse } from '../../routes/questionnaires/responses';
import {
    SCALE_COLORS,
    SCALE_LABELS,
    SCALE_VALUES,
    type Aggregates,
    type ExportItem,
    type QuestionnaireStatus,
} from '../../types';

const tooltipContentStyle: CSSProperties = {
    maxWidth: 280,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
};

const tooltipLabelStyle: CSSProperties = {
    whiteSpace: 'normal',
};

type Props = {
    questionnaire: {
        id: number;
        uuid: string;
        title: string;
        description: string | null;
        status: QuestionnaireStatus;
    };
    share_url: string;
    aggregates: Aggregates;
    responses: {
        data: {
            id: number;
            user: { id: number; name: string; email: string } | null;
            submitted_at: string;
        }[];
        links: PaginationLink[];
    };
    exports: ExportItem[];
};

type ResponseSavedPayload = {
    questionnaire_id: number;
    submitted_by: string;
    aggregates: Aggregates;
};

export default function QuestionnaireDashboard() {
    const page = usePage<Props>();
    const {
        questionnaire,
        share_url,
        aggregates: initialAggregates,
        responses,
        exports,
    } = page.props;
    const { auth } = usePage().props;

    const [aggregates, setAggregates] = useState(initialAggregates);

    useEcho<ResponseSavedPayload>(
        `questionnaire.${questionnaire.id}`,
        'ResponseSaved',
        (payload) => {
            setAggregates(payload.aggregates);
            router.reload({ only: ['responses'] });
        },
        [questionnaire.id],
    );

    useEcho<{ export: ExportItem }>(
        `App.Models.User.${auth.user?.id}`,
        'ExportCompleted',
        () => {
            router.reload({ only: ['exports'] });
        },
        [auth.user?.id],
    );

    const barData = useMemo(
        () =>
            aggregates.per_question.map((q, index) => ({
                name: `Q${index + 1}`,
                SDA: q.counts[1] ?? 0,
                DA: q.counts[2] ?? 0,
                A: q.counts[3] ?? 0,
                SA: q.counts[4] ?? 0,
            })),
        [aggregates.per_question],
    );

    const questionLabels = useMemo(
        () =>
            Object.fromEntries(
                aggregates.per_question.map((q, index) => [
                    `Q${index + 1}`,
                    q.text,
                ]),
            ) as Record<string, string>,
        [aggregates.per_question],
    );

    const questionChartHeight = Math.max(320, barData.length * 44);

    const timelineTickInterval = Math.max(
        0,
        Math.ceil(aggregates.timeline.length / 7) - 1,
    );

    const donutData = useMemo(
        () =>
            SCALE_VALUES.map((value) => ({
                name: SCALE_LABELS[value],
                value: aggregates.per_question.reduce(
                    (sum, q) => sum + (q.counts[value] ?? 0),
                    0,
                ),
                color: SCALE_COLORS[value],
            })),
        [aggregates.per_question],
    );

    const { totalAnswers, averageScore } = useMemo(() => {
        const answered = aggregates.per_question.reduce(
            (sum, q) => sum + q.total,
            0,
        );
        const weighted = aggregates.per_question.reduce(
            (sum, q) => sum + q.average * q.total,
            0,
        );
        return {
            totalAnswers: answered,
            averageScore:
                answered > 0 ? Number((weighted / answered).toFixed(2)) : 0,
        };
    }, [aggregates.per_question]);

    const requestExport = (type: 'pdf' | 'excel') => {
        router.post(storeExport({ questionnaire: questionnaire.uuid }).url, {
            type,
        });
    };

    const copyLink = async () => {
        await navigator.clipboard.writeText(share_url);
    };

    return (
        <AppLayout
            title={questionnaire.title}
            actions={
                <>
                    <StatusBadge status={questionnaire.status} />
                    <Button
                        size="sm"
                        variant="ghost"
                        className="hidden sm:inline-flex"
                        onClick={copyLink}
                    >
                        Salin Link
                    </Button>
                </>
            }
        >
            {questionnaire.description ? (
                <p className="text-body-subtle -mt-2 mb-6 max-w-2xl text-sm">
                    {questionnaire.description}
                </p>
            ) : null}

            <div className="mb-6 flex items-center gap-2">
                <Input
                    readOnly
                    value={share_url}
                    onFocus={(event) => event.currentTarget.select()}
                    className="max-w-lg min-w-0 flex-1"
                />
                <Button
                    size="sm"
                    variant="ghost"
                    className="flex-none"
                    onClick={copyLink}
                >
                    Salin
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat
                    label="Total Responden"
                    value={aggregates.total}
                    accent="variant-vivid"
                />
                <Stat label="Sedang Mengisi" value={aggregates.in_progress} />
                <Stat
                    label="Rata-rata Skor"
                    value={averageScore}
                    suffix="/ 4"
                />
                <Stat label="Jawaban Masuk" value={totalAnswers} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="min-w-0 p-6">
                    <h2 className="text-heading text-lg font-semibold">
                        Partisipasi per Hari
                    </h2>
                    {aggregates.timeline.length > 0 ? (
                        <div className="mt-4 h-64 min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={aggregates.timeline}
                                    margin={{
                                        top: 4,
                                        right: 8,
                                        left: -12,
                                        bottom: 0,
                                    }}
                                >
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10 }}
                                        tickFormatter={formatShortDate}
                                        interval={timelineTickInterval}
                                        minTickGap={8}
                                        height={28}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={tooltipContentStyle}
                                        labelStyle={tooltipLabelStyle}
                                        labelFormatter={(label) =>
                                            typeof label === 'string'
                                                ? formatFullDate(label)
                                                : label
                                        }
                                    />
                                    <Bar
                                        dataKey="count"
                                        name="Responden"
                                        fill="#ff3b8b"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyChart label="Belum ada jawaban masuk." />
                    )}
                </Card>

                <Card className="min-w-0 p-6">
                    <h2 className="text-heading text-lg font-semibold">
                        Distribusi Skala
                    </h2>
                    {aggregates.total > 0 ? (
                        <div className="mt-4 h-64 min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={donutData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius="55%"
                                        outerRadius="85%"
                                        paddingAngle={2}
                                    >
                                        {donutData.map((entry, index) => (
                                            <Cell
                                                key={index}
                                                fill={entry.color}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={28}
                                        iconSize={10}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <EmptyChart label="Belum ada jawaban masuk." />
                    )}
                </Card>
            </div>

            <Card className="mt-6 min-w-0 p-6">
                <h2 className="text-heading text-lg font-semibold">
                    Jawaban per Pertanyaan
                </h2>
                {barData.length > 0 && aggregates.total > 0 ? (
                    <div
                        className="mt-4 w-full min-w-0"
                        style={{ height: questionChartHeight }}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={barData}
                                layout="vertical"
                                margin={{
                                    top: 4,
                                    right: 8,
                                    left: 8,
                                    bottom: 4,
                                }}
                            >
                                <XAxis
                                    type="number"
                                    allowDecimals={false}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={52}
                                    interval={0}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={tooltipContentStyle}
                                    labelStyle={tooltipLabelStyle}
                                    labelFormatter={(label) =>
                                        typeof label === 'string'
                                            ? (questionLabels[label] ?? label)
                                            : label
                                    }
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={28}
                                    iconSize={10}
                                />
                                {SCALE_VALUES.map((value) => (
                                    <Bar
                                        key={value}
                                        dataKey={SCALE_LABELS[value]}
                                        stackId="scale"
                                        fill={SCALE_COLORS[value]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <EmptyChart label="Belum ada jawaban masuk." />
                )}
            </Card>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="min-w-0 p-6 lg:col-span-2">
                    <h2 className="text-heading text-lg font-semibold">
                        Responden Terakhir
                    </h2>
                    <div className="mt-4 overflow-x-auto">
                        <table className="text-body w-full text-left text-sm">
                            <thead>
                                <tr className="border-border-default bg-neutral-secondary-soft text-body border-b">
                                    <th className="px-4 py-3 font-medium">
                                        Responden
                                    </th>
                                    <th className="hidden px-4 py-3 font-medium sm:table-cell">
                                        Email
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Waktu Submit
                                    </th>
                                    <th className="px-4 py-3 font-medium" />
                                </tr>
                            </thead>
                            <tbody>
                                {responses.data.map((response) => (
                                    <tr
                                        key={response.id}
                                        className="border-border-default hover:bg-neutral-secondary-soft border-b last:border-0"
                                    >
                                        <td className="text-heading px-4 py-4 font-medium">
                                            {response.user?.name ?? 'Peserta'}
                                        </td>
                                        <td className="hidden px-4 py-4 sm:table-cell">
                                            {response.user?.email ?? '-'}
                                        </td>
                                        <td className="px-4 py-4">
                                            {formatDate(response.submitted_at)}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            'Hapus jawaban responden ini?',
                                                        )
                                                    ) {
                                                        router.delete(
                                                            destroyResponse({
                                                                questionnaire:
                                                                    questionnaire.uuid,
                                                                response:
                                                                    response.id,
                                                            }).url,
                                                        );
                                                    }
                                                }}
                                                className="text-fg-danger hover:bg-danger-soft rounded-none px-2 py-1 text-sm"
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {responses.data.length === 0 ? (
                            <p className="text-body-subtle py-8 text-center text-sm">
                                Belum ada responden.
                            </p>
                        ) : null}
                    </div>
                    <Pagination className="mt-4" links={responses.links} />
                </Card>

                <Card className="p-6">
                    <h2 className="text-heading text-lg font-semibold">
                        Aktivitas Terkini
                    </h2>
                    <ul className="mt-4 space-y-4">
                        {aggregates.recent.map((item) => (
                            <li
                                key={item.id}
                                className="flex items-center gap-3"
                            >
                                <span className="bg-brand-soft text-fg-brand-strong flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold">
                                    {item.name.charAt(0).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-heading truncate text-sm font-medium">
                                        {item.name}
                                    </p>
                                    <p className="text-body-subtle text-xs">
                                        {formatDateTime(item.submitted_at)}
                                    </p>
                                </div>
                            </li>
                        ))}
                        {aggregates.recent.length === 0 ? (
                            <li className="text-body-subtle text-sm">
                                Belum ada aktivitas.
                            </li>
                        ) : null}
                    </ul>
                </Card>
            </div>

            <Card className="mt-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-heading text-lg font-semibold">
                            Ekspor Hasil
                        </h2>
                        <p className="text-body-subtle text-sm">
                            Proses dijalankan di background; tautan unduhan
                            muncul di bawah saat selesai.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => requestExport('pdf')}>
                            Ekspor PDF
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => requestExport('excel')}
                        >
                            Ekspor Excel
                        </Button>
                    </div>
                </div>

                <ul className="mt-5 space-y-3">
                    {exports.map((item) => (
                        <li
                            key={item.id}
                            className="border-border-default bg-neutral-secondary-soft flex flex-col gap-3 rounded-none border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-heading text-sm font-semibold uppercase">
                                    {item.type === 'pdf' ? 'PDF' : 'Excel'}
                                </span>
                                <ExportBadge status={item.status} />
                                <span className="text-body-subtle text-xs">
                                    {formatDateTime(item.created_at)}
                                </span>
                            </div>
                            {item.status === 'completed' && item.file_path ? (
                                <a
                                    href={download({ export: item.uuid }).url}
                                    className="text-fg-brand hover:bg-brand-softer rounded-none px-3 py-2 text-sm font-medium"
                                >
                                    Unduh
                                </a>
                            ) : null}
                        </li>
                    ))}
                    {exports.length === 0 ? (
                        <li className="text-body-subtle text-sm">
                            Belum ada ekspor.
                        </li>
                    ) : null}
                </ul>
            </Card>
        </AppLayout>
    );
}

function Stat({
    label,
    value,
    suffix,
    accent,
}: {
    label: string;
    value: number;
    suffix?: string;
    accent?: 'variant-vivid' | 'variant-muted';
}) {
    return (
        <Card
            className={
                accent === 'variant-vivid'
                    ? 'border-brand bg-brand text-on-brand p-5'
                    : 'p-5'
            }
        >
            <p
                className={
                    accent === 'variant-vivid'
                        ? 'text-on-brand-muted text-sm'
                        : 'text-body-subtle text-sm'
                }
            >
                {label}
            </p>
            <p
                className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${accent === 'variant-vivid' ? 'text-white' : 'text-heading'}`}
            >
                {Number.isInteger(value)
                    ? value.toLocaleString('id-ID')
                    : value}
                {suffix ? (
                    <span className="ml-1 text-base font-medium opacity-70">
                        {suffix}
                    </span>
                ) : null}
            </p>
        </Card>
    );
}

function ExportBadge({ status }: { status: ExportItem['status'] }) {
    const map: Record<
        ExportItem['status'],
        { label: string; className: string }
    > = {
        pending: {
            label: 'Antre',
            className: 'bg-neutral-secondary-medium text-heading',
        },
        processing: {
            label: 'Diproses',
            className: 'bg-warning-soft text-fg-warning',
        },
        completed: {
            label: 'Selesai',
            className: 'bg-success-soft text-fg-success-strong',
        },
        failed: {
            label: 'Gagal',
            className: 'bg-danger-soft text-fg-danger-strong',
        },
    };
    const config = map[status];
    return (
        <span
            className={`rounded-none px-2 py-0.5 text-xs font-medium ${config.className}`}
        >
            {config.label}
        </span>
    );
}

function EmptyChart({ label }: { label: string }) {
    return (
        <div className="text-body-subtle flex h-64 items-center justify-center text-sm">
            {label}
        </div>
    );
}

function formatDate(value: string): string {
    const date = new Date(value);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

const MONTHS_LONG = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

function splitIsoDate(value: string): [string, number, number] | null {
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) {
        return null;
    }

    return [year, Number(month) - 1, Number(day)];
}

function formatShortDate(value: string): string {
    const parts = splitIsoDate(value);
    if (!parts) {
        return value;
    }

    const [, monthIndex, day] = parts;
    const month = String(monthIndex + 1).padStart(2, '0');
    const dayPadded = String(day).padStart(2, '0');
    return `${dayPadded}/${month}`;
}

function formatFullDate(value: string): string {
    const parts = splitIsoDate(value);
    if (!parts) {
        return value;
    }

    const [year, monthIndex, day] = parts;
    return `${day} ${MONTHS_LONG[monthIndex] ?? monthIndex + 1} ${year}`;
}

function formatDateTime(value: string): string {
    const date = new Date(value);
    return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}
