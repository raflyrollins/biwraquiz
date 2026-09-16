<?php

namespace App\Services;

use App\Models\Questionnaire;
use App\Models\Response;
use App\Support\AnswerScale;
use Illuminate\Support\Facades\DB;

class QuestionnaireAggregator
{
    /**
     * Aggregate statistics for a questionnaire's realtime dashboard.
     *
     * @return array{total: int, in_progress: int, per_question: array<int, array{question_id: int, text: string, counts: array<int, int>, total: int, average: float}>, timeline: array<int, array{date: string, count: int}>, recent: array<int, array{id: int, name: string, avatar: string|null, submitted_at: string}>}
     */
    public function aggregate(Questionnaire $questionnaire): array
    {
        $completed = Response::query()
            ->where('questionnaire_id', $questionnaire->id)
            ->where('status', Response::STATUS_COMPLETED);

        $total = (clone $completed)->count();
        $inProgress = Response::query()
            ->where('questionnaire_id', $questionnaire->id)
            ->where('status', Response::STATUS_IN_PROGRESS)
            ->count();

        $completedIds = (clone $completed)->select('id');

        $countsByQuestion = DB::table('answers')
            ->join('responses', 'responses.id', '=', 'answers.response_id')
            ->whereIn('answers.response_id', $completedIds)
            ->select('answers.question_id', 'answers.value', DB::raw('COUNT(*) as count'))
            ->groupBy('answers.question_id', 'answers.value')
            ->get();

        $perQuestion = $questionnaire->questions
            ->map(function ($question) use ($countsByQuestion) {
                $counts = [
                    AnswerScale::SDA => 0,
                    AnswerScale::DA => 0,
                    AnswerScale::A => 0,
                    AnswerScale::SA => 0,
                ];

                $sum = 0;
                $answered = 0;

                foreach ($countsByQuestion as $row) {
                    if ((int) $row->question_id !== $question->id) {
                        continue;
                    }
                    $value = (int) $row->value;
                    if (isset($counts[$value])) {
                        $counts[$value] = (int) $row->count;
                        $sum += $value * (int) $row->count;
                        $answered += (int) $row->count;
                    }
                }

                return [
                    'question_id' => $question->id,
                    'text' => $question->text,
                    'counts' => $counts,
                    'total' => $answered,
                    'average' => $answered > 0 ? round($sum / $answered, 2) : 0.0,
                ];
            })
            ->values()
            ->all();

        $timeline = (clone $completed)
            ->whereNotNull('submitted_at')
            ->select(DB::raw('date(submitted_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy(DB::raw('date(submitted_at)'))
            ->orderBy(DB::raw('date(submitted_at)'))
            ->get()
            ->map(fn (Response $row) => ['date' => $row->date, 'count' => (int) $row->count])
            ->all();

        $recent = (clone $completed)
            ->with('user:id,name,avatar')
            ->orderByDesc('submitted_at')
            ->limit(8)
            ->get()
            ->map(fn (Response $response) => [
                'id' => $response->id,
                'name' => $response->user->name ?? 'Peserta',
                'avatar' => $response->user->avatar,
                'submitted_at' => (string) $response->submitted_at,
            ])
            ->all();

        return [
            'total' => $total,
            'in_progress' => $inProgress,
            'per_question' => $perQuestion,
            'timeline' => $timeline,
            'recent' => $recent,
        ];
    }
}
