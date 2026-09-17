<?php

use App\Models\Answer;
use App\Models\Question;
use App\Models\Questionnaire;
use App\Models\Response;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function publishedQuestionnaire(User $owner, int $questionCount = 2): Questionnaire
{
    static $counter = 0;
    $counter++;

    $questionnaire = Questionnaire::create([
        'user_id' => $owner->id,
        'title' => "Kuesioner Uji {$counter}",
        'description' => 'Deskripsi uji',
        'status' => Questionnaire::STATUS_PUBLISHED,
    ]);

    foreach (range(1, $questionCount) as $position) {
        Question::create([
            'questionnaire_id' => $questionnaire->id,
            'text' => "Soal {$position}",
            'position' => $position,
        ]);
    }

    return $questionnaire;
}

it('mengarahkan tamu ke halaman login', function () {
    $this->get(route('my.index'))->assertRedirect(route('login'));
});

it('menampilkan draf dan kuesioner selesai milik responden', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $user = User::factory()->create(['is_admin' => false]);

    $draftQuestionnaire = publishedQuestionnaire($admin, 3);
    $draft = Response::create([
        'questionnaire_id' => $draftQuestionnaire->id,
        'user_id' => $user->id,
        'status' => Response::STATUS_IN_PROGRESS,
    ]);
    Answer::create([
        'response_id' => $draft->id,
        'question_id' => $draftQuestionnaire->questions()->first()->id,
        'value' => 3,
    ]);

    $doneQuestionnaire = publishedQuestionnaire($admin, 2);
    Response::create([
        'questionnaire_id' => $doneQuestionnaire->id,
        'user_id' => $user->id,
        'status' => Response::STATUS_COMPLETED,
        'submitted_at' => now(),
    ]);

    $otherUser = User::factory()->create();
    $otherQuestionnaire = publishedQuestionnaire($admin, 1);
    Response::create([
        'questionnaire_id' => $otherQuestionnaire->id,
        'user_id' => $otherUser->id,
        'status' => Response::STATUS_IN_PROGRESS,
    ]);

    $this->actingAs($user)
        ->get(route('my.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('my/index')
            ->has('in_progress', 1)
            ->where('in_progress.0.uuid', $draftQuestionnaire->uuid)
            ->where('in_progress.0.answered', 1)
            ->where('in_progress.0.total', 3)
            ->where('in_progress.0.response_status', Response::STATUS_IN_PROGRESS)
            ->has('completed', 1)
            ->where('completed.0.uuid', $doneQuestionnaire->uuid)
            ->where('completed.0.answered', 0)
            ->where('completed.0.response_status', Response::STATUS_COMPLETED)
        );
});
