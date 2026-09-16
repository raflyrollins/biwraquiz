import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import AppLayout from '../../components/AppLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import type { PaginationLink } from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import { create as fillPage } from '../../routes/fill';
import {
    close,
    create,
    destroy,
    edit,
    index,
    publish,
    responses,
} from '../../routes/questionnaires';
import type { QuestionnaireStatus } from '../../types';

type Props = {
    questionnaires: {
        data: QuestionnaireCard[];
        links: PaginationLink[];
        total: number;
    };
    filters: { search: string };
};

type QuestionnaireCard = {
    id: number;
    uuid: string;
    title: string;
    description: string | null;
    status: QuestionnaireStatus;
    questions_count: number;
    responses_count: number;
    updated_at: string;
};

const statusLabel: Record<QuestionnaireStatus, string> = {
    draft: 'Terbitkan',
    published: 'Tutup',
    closed: 'Buka Lagi',
};

export default function QuestionnaireIndex() {
    const props = usePage<Props>().props;
    const [search, setSearch] = useState(props.filters.search);
    const [toDelete, setToDelete] = useState<QuestionnaireCard | null>(null);

    const applySearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            index.url(),
            { search: search || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const toggleStatus = (item: QuestionnaireCard) => {
        const route =
            item.status === 'published'
                ? close({ questionnaire: item.uuid })
                : publish({ questionnaire: item.uuid });
        router.post(route.url);
    };

    const copyLink = async (item: QuestionnaireCard) => {
        await navigator.clipboard.writeText(
            fillPage({ questionnaire: item.uuid }).url,
        );
    };

    return (
        <AppLayout title="Kuesioner">
            <Head title="Kuesioner" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <form
                    onSubmit={applySearch}
                    className="flex w-full max-w-sm items-center gap-2"
                >
                    <Input
                        type="search"
                        name="search"
                        placeholder="Cari kuesioner..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <Button type="submit" size="sm" variant="ghost">
                        Cari
                    </Button>
                </form>
                <Button asLink={create.url()}>Buat Kuesioner</Button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {props.questionnaires.data.map((item) => (
                    <Card key={item.id} className="flex flex-col gap-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-heading truncate text-lg font-semibold">
                                {item.title}
                            </h2>
                            <StatusBadge status={item.status} />
                        </div>
                        <p className="text-body line-clamp-2 min-h-[2.5rem] text-sm">
                            {item.description ?? 'Tanpa deskripsi.'}
                        </p>
                        <div className="text-body-subtle flex items-center gap-4 text-sm">
                            <span>{item.questions_count} pertanyaan</span>
                            <span>{item.responses_count} responden</span>
                        </div>

                        <div className="border-border-default flex flex-wrap items-center gap-2 border-t pt-4">
                            <Button
                                size="sm"
                                asLink={
                                    responses({
                                        questionnaire: item.uuid,
                                    }).url
                                }
                            >
                                Dashboard
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                asLink={edit({ questionnaire: item.uuid }).url}
                            >
                                Edit
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyLink(item)}
                            >
                                Salin Link
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleStatus(item)}
                            >
                                {statusLabel[item.status]}
                            </Button>
                            <button
                                type="button"
                                className="text-fg-danger hover:bg-danger-soft ml-auto rounded-none px-2 py-2 text-sm transition-colors"
                                onClick={() => setToDelete(item)}
                                aria-label={`Hapus ${item.title}`}
                            >
                                Hapus
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {props.questionnaires.total === 0 ? (
                <Card className="mt-6 p-10 text-center">
                    <img
                        src="/images/questions.svg"
                        alt="Ilustrasi tanpa kuesioner"
                        className="mx-auto h-28 w-auto"
                    />
                    <h2 className="text-heading mt-4 text-lg font-semibold">
                        Tidak ada kuesioner
                    </h2>
                    <p className="text-body-subtle mt-1 text-sm">
                        {props.filters.search
                            ? 'Coba ubah kata kunci pencarian.'
                            : 'Buat kuesioner pertamamu sekarang.'}
                    </p>
                </Card>
            ) : null}

            <Pagination className="mt-8" links={props.questionnaires.links} />

            <Modal
                open={toDelete !== null}
                onClose={() => setToDelete(null)}
                title="Hapus Kuesioner?"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => setToDelete(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                if (toDelete) {
                                    router.delete(
                                        destroy({
                                            questionnaire: toDelete.uuid,
                                        }).url,
                                    );
                                    setToDelete(null);
                                }
                            }}
                        >
                            Hapus
                        </Button>
                    </>
                }
            >
                <p>
                    Kuesioner{' '}
                    <strong className="text-heading">{toDelete?.title}</strong>{' '}
                    dan seluruh jawabannya akan dihapus permanen. Lanjutkan?
                </p>
            </Modal>
        </AppLayout>
    );
}
