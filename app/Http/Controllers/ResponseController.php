<?php

namespace App\Http\Controllers;

use App\Events\ResponseSaved;
use App\Models\Questionnaire;
use App\Models\Response;
use App\Services\QuestionnaireAggregator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule as ValidationRule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ResponseController extends Controller
{
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

        foreach ($validated['answers'] as $questionId => $value) {
            $response->answers()->updateOrCreate(
                ['question_id' => (int) $questionId],
                ['value' => (int) $value],
            );
        }

        $questionCount = $questionnaire->questions()->count();

        if ($questionCount > 0 && count($validated['answers']) === $questionCount) {
            $response->update([
                'status' => Response::STATUS_COMPLETED,
                'submitted_at' => now(),
            ]);

            $aggregates = app(QuestionnaireAggregator::class)->aggregate($questionnaire);

            ResponseSaved::dispatch($questionnaire, $aggregates, $request->user()->name);

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
