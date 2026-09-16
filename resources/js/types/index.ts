export type QuestionnaireStatus = 'draft' | 'published' | 'closed';

export type QuestionnaireSummary = {
    id: number;
    uuid: string;
    title: string;
    description: string | null;
    status: QuestionnaireStatus;
    questions_count?: number;
    responses_count?: number;
    created_at: string;
    updated_at: string;
};

export type QuestionItem = {
    id?: number;
    text: string;
    position: number;
};

export type PerQuestionAggregate = {
    question_id: number;
    text: string;
    counts: Record<number, number>;
    total: number;
    average: number;
};

export type Aggregates = {
    total: number;
    in_progress: number;
    per_question: PerQuestionAggregate[];
    timeline: { date: string; count: number }[];
    recent: {
        id: number;
        name: string;
        avatar: string | null;
        submitted_at: string;
    }[];
};

export type ExportItem = {
    id: number;
    uuid: string;
    type: 'pdf' | 'excel';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    file_path: string | null;
    created_at: string;
};

export type ScaleValue = 1 | 2 | 3 | 4;

export const SCALE_LABELS: Record<ScaleValue, string> = {
    1: 'SDA',
    2: 'DA',
    3: 'A',
    4: 'SA',
};

export const SCALE_DESCRIPTIONS: Record<ScaleValue, string> = {
    1: 'Sangat Tidak Setuju',
    2: 'Tidak Setuju',
    3: 'Setuju',
    4: 'Sangat Setuju',
};

export const SCALE_COLORS: Record<ScaleValue, string> = {
    1: '#d62677',
    2: '#ff8fb8',
    3: '#ffbcda',
    4: '#4a4566',
};

export const SCALE_VALUES: ScaleValue[] = [1, 2, 3, 4];
