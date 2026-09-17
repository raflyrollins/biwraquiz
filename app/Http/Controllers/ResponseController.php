<?php

namespace App\Http\Controllers;

use App\Events\ResponseSaved;
use App\Models\Questionnaire;
use App\Models\Response;
use App\Services\QuestionnaireAggregator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule as ValidationRule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ResponseController extends Controller
{
    public function mine(Request $request): InertiaResponse
    {
        $responses = $request->user()->responses()
            ->whereHas('questionnaire')
            ->withCount('answers')
            ->with(['questionnaire' => fn ($query) => $query->withCount('questions')])
            ->orderByDesc('updated_at')
            ->get();

        $items = $responses->map(fn (Response $response): array => [
            'uuid' => $response->questionnaire->uuid,
            'title' => $response->questionnaire->title,
            'description' => $response->questionnaire->description,
            'questionnaire_status' => $response->questionnaire->status,
            'response_status' => $response->status,
            'answered' => $response->answers_count,
            'total' => $response->questionnaire->questions_count,
            'updated_at' => $response->updated_at?->toIso8601String(),
            'submitted_at' => $response->submitted_at?->toIso8601String(),
        ]);

        return Inertia::render('my/index', [
            'in_progress' => $items->where('response_status', Response::STATUS_IN_PROGRESS)->values(),
            'completed' => $items->where('response_status', Response::STATUS_COMPLETED)->values(),
        ]);
    }

    public function create(Request $request, Questionnaire $questionnaire): InertiaResponse
    {
        if (! $questionnaire->isPublished() && $questionnaire->user_id !== $request->user()->id) {
            abort(404);
        }

        $response = $request->user()
            ->responses()
            ->where('questionnaire_id', $questionnaire->id)
            ->with('answers')
            ->first();

        return Inertia::render('fill/create', [
            'questionnaire' => $questionnaire->only(['id', 'uuid', 'title', 'description', 'status']),
            'questions' => $questionnaire->questions()->get(['id', 'text', 'position']),
            'existing_answers' => $response?->answers->pluck('value', 'question_id'),
            'response' => $response ? $response->only(['id', 'status', 'submitted_at']) : null,
        ]);
    }

    public function store(Request $request, Questionnaire $questionnaire): RedirectResponse
    {
        if ($questionnaire->status !== Questionnaire::STATUS_PUBLISHED) {
            return back()->with('error', 'Kuesioner sudah tidak menerima jawaban.');
        }

        $validated = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*' => ['required', 'integer', ValidationRule::in([1, 2, 3, 4])],
        ]);

        /** @var Response $response */
        $response = $request->user()->responses()->firstOrCreate(
            ['questionnaire_id' => $questionnaire->id],
            ['status' => Response::STATUS_IN_PROGRESS],
        );

        if ($response->isCompleted()) {
            return back()->with('error', 'Kamu sudah mengisi kuesioner ini.');
        }

        $now = now();
        $rows = [];
        foreach ($validated['answers'] as $questionId => $value) {
            $rows[] = [
                'response_id' => $response->id,
                'question_id' => (int) $questionId,
                'value' => (int) $value,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $completed = DB::transaction(function () use ($rows, $response, $questionnaire, $now): bool {
            $response->answers()->upsert(
                $rows,
                ['response_id', 'question_id'],
                ['value', 'updated_at'],
            );

            $questionCount = $questionnaire->questions()->count();

            if ($questionCount > 0 && count($rows) === $questionCount) {
                $response->update([
                    'status' => Response::STATUS_COMPLETED,
                    'submitted_at' => $now,
                ]);

                return true;
            }

            return false;
        });

        if ($completed) {
            ResponseSaved::dispatch($questionnaire, $request->user()->name);
        }

        return redirect()->route('fill.create', $questionnaire->uuid)->with('success', 'Jawaban berhasil disimpan.');
    }

    public function index(Request $request, Questionnaire $questionnaire): InertiaResponse
    {
        abort_unless($questionnaire->user_id === $request->user()->id, 403);

        $aggregates = app(QuestionnaireAggregator::class)->aggregate($questionnaire);

        $responses = $questionnaire->responses()
            ->with('user:id,name,email,avatar')
            ->where('status', Response::STATUS_COMPLETED)
            ->orderByDesc('submitted_at')
            ->paginate(10)
            ->withQueryString();

        $exports = $questionnaire->exports()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return Inertia::render('questionnaires/dashboard', [
            'questionnaire' => $questionnaire->only(['id', 'uuid', 'title', 'description', 'status']),
            'share_url' => rtrim((string) config('app.url'), '/').route('fill.create', $questionnaire->uuid, false),
            'aggregates' => $aggregates,
            'responses' => $responses,
            'exports' => $exports,
        ]);
    }

    public function destroy(Request $request, Questionnaire $questionnaire, Response $response): RedirectResponse
    {
        abort_unless($questionnaire->user_id === $request->user()->id, 403);

        $response->delete();

        return back()->with('success', 'Jawaban responden dihapus.');
    }
}
