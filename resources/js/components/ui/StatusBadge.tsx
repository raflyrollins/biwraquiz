import type { QuestionnaireStatus } from '../../types';
import Badge from './Badge';

const config: Record<QuestionnaireStatus, { label: string; variant: 'brand' | 'success' | 'warning' | 'gray' }> = {
    draft: { label: 'Draft', variant: 'gray' },
    published: { label: 'Terbit', variant: 'success' },
    closed: { label: 'Ditutup', variant: 'warning' },
};

export default function StatusBadge({ status }: { status: QuestionnaireStatus }) {
    const { label, variant } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
}