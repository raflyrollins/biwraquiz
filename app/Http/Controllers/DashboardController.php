<?php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Models\Questionnaire;
use App\Models\Response;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class DashboardController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $questionnaires = Questionnaire::query()
            ->where('user_id', $request->user()->id)
            ->withCount(['responses' => fn ($q) => $q->where('status', Response::STATUS_COMPLETED)])
            ->withCount('questions')
            ->orderByDesc('updated_at')
            ->limit(6)
            ->get();

        $respondents = Response::query()
            ->where('status', Response::STATUS_COMPLETED)
            ->whereIn('questionnaire_id', $request->user()->questionnaires()->select('id'))
            ->count();

        return Inertia::render('dashboard/index', [
            'stats' => [
                'total_questionnaires' => $request->user()->questionnaires()->count(),
                'total_published' => $request->user()->questionnaires()->where('status', Questionnaire::STATUS_PUBLISHED)->count(),
                'total_respondents' => $respondents,
                'total_questions' => Question::query()
                    ->whereIn('questionnaire_id', $request->user()->questionnaires()->select('id'))
                    ->count(),
            ],
            'questionnaires' => $questionnaires,
        ]);
    }
}
