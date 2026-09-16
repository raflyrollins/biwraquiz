<?php

namespace App\Http\Controllers;

use App\Models\Questionnaire;
use App\Models\Response;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class QuestionnaireController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $search = trim((string) $request->query('search', ''));

        $questionnaires = Questionnaire::query()
            ->where('user_id', $request->user()->id)
            ->when($search !== '', fn (Builder $q) => $this->applySearch($q, $search))
            ->withCount(['responses' => fn (Builder $q) => $q->where('status', Response::STATUS_COMPLETED)])
            ->withCount('questions')
            ->orderByDesc('updated_at')
            ->paginate(9)
            ->withQueryString();

        return Inertia::render('questionnaires/index', [
            'questionnaires' => $questionnaires,
            'filters' => ['search' => $search],
        ]);
    }

    public function create(Request $request): InertiaResponse
    {
        return Inertia::render('questionnaires/edit');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateQuestionnaire($request);

        $questionnaire = $request->user()->questionnaires()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => Questionnaire::STATUS_DRAFT,
        ]);

        $this->syncQuestions($questionnaire, $validated['questions']);

        return redirect()->route('questionnaires.edit', $questionnaire)->with('success', 'Kuesioner berhasil dibuat.');
    }

    public function edit(Request $request, Questionnaire $questionnaire): InertiaResponse
    {
        abort_unless($questionnaire->user_id === $request->user()->id, 403);

        return Inertia::render('questionnaires/edit', [
            'questionnaire' => $questionnaire->load('questions'),
        ]);
    }

    public function update(Request $request, Questionnaire $questionnaire): RedirectResponse
    {
        abort_unless($questionnaire->user_id === $request->user()->id, 403);

        $validated = $this->validateQuestionnaire($request);

        $questionnaire->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
        ]);

        $this->syncQuestions($questionnaire, $validated['questions']);

        return redirect()->route('questionnaires.edit', $questionnaire)->with('success', 'Kuesioner berhasil diperbarui.');
    }

    public function destroy(Request $request, Questionnaire $questionnaire): RedirectResponse
    {
        abort_unless($questionnaire->user_id === $request->user()->id, 403);

        $questionnaire->delete();

        return redirect()->route('dashboard')->with('success', 'Kuesioner dihapus.');
    }

    public function publish(Request $request, Questionnaire $questionnaire): RedirectResponse
    {
        abort_unless($questionnaire->user_id === $request->user()->id, 403);

        abort_unless($questionnaire->questions()->exists(), 422, 'Tambahkan minimal satu pertanyaan sebelum mempublikasikan.');

        $questionnaire->update(['status' => Questionnaire::STATUS_PUBLISHED]);

        return back()->with('success', 'Kuesioner dipublikasikan.');
    }

    public function close(Request $request, Questionnaire $questionnaire): RedirectResponse
    {
        abort_unless($questionnaire->user_id === $request->user()->id, 403);

        $questionnaire->update(['status' => Questionnaire::STATUS_CLOSED]);

        return back()->with('success', 'Kuesioner ditutup.');
    }

    /**
     * @param  list<array{id?: int, text: string}>  $questions
     */
    private function syncQuestions(Questionnaire $questionnaire, array $questions): void
    {
        $existing = $questionnaire->questions()->pluck('id')->all();
        $incomingIds = [];

        foreach ($questions as $index => $question) {
            $attrs = [
                'text' => $question['text'],
                'position' => $index + 1,
            ];

            if (isset($question['id']) && in_array($question['id'], $existing, true)) {
                $questionnaire->questions()->whereKey($question['id'])->first()?->update($attrs);
                $incomingIds[] = (int) $question['id'];
            } else {
                $created = $questionnaire->questions()->create($attrs);
                $incomingIds[] = $created->id;
            }
        }

        $questionnaire->questions()
            ->whereNotIn('id', $incomingIds)
            ->delete();
    }

    /**
     * @return array{title: string, description: ?string, questions: list<array{id?: int, text: string}>}
     */
    private function validateQuestionnaire(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:4000'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.id' => ['nullable', 'integer'],
            'questions.*.text' => ['required', 'string', 'max:1000'],
        ]);
    }

    /**
     * @param  Builder<Questionnaire>  $q
     */
    private function applySearch(Builder $q, string $term): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            $q->whereRaw("search_document @@ websearch_to_tsquery('english', ?)", [$term]);
        } else {
            $q->where(fn (Builder $inner) => $inner
                ->whereLike('title', "%{$term}%")
                ->orWhereLike('description', "%{$term}%"));
        }
    }
}
