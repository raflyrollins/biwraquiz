<?php

use App\Models\Question;
use App\Models\Questionnaire;
use App\Models\User;
use Database\Seeders\QuestionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;

uses(RefreshDatabase::class);

beforeEach(function () {
    User::factory()->create(['email' => 'admin@biwraquiz.test', 'is_admin' => true]);
});

function markdownFixture(string $content): string
{
    $path = tempnam(sys_get_temp_dir(), 'biwraquiz-questions');

    File::put($path, $content);

    return $path;
}

it('menyeed soal dari file markdown', function () {
    $path = markdownFixture(<<<'MD'
        # Kuesioner Kepuasan Guru

        Tolong isi sesuai pengalaman mengajar Anda.

        1. Guru memberikan materi yang mudah dipahami.
        2. Guru memanfaatkan media pembelajaran.
        3. Penilaian dilakukan secara adil.
        MD);

    (new QuestionSeeder($path))->run();
    File::delete($path);

    $questionnaire = Questionnaire::first();

    expect($questionnaire)->not->toBeNull()
        ->and($questionnaire->title)->toBe('Kuesioner Kepuasan Guru')
        ->and($questionnaire->description)->toBe('Tolong isi sesuai pengalaman mengajar Anda.')
        ->and($questionnaire->status)->toBe(Questionnaire::STATUS_PUBLISHED)
        ->and($questionnaire->user_id)->toBe(User::where('is_admin', true)->first()->id)
        ->and($questionnaire->questions->count())->toBe(3)
        ->and($questionnaire->questions[0]->text)->toBe('Guru memberikan materi yang mudah dipahami.')
        ->and($questionnaire->questions[0]->position)->toBe(1)
        ->and($questionnaire->questions[2]->text)->toBe('Penilaian dilakukan secara adil.')
        ->and($questionnaire->questions[2]->position)->toBe(3);
});

it('idempoten saat dijalankan ulang', function () {
    $path = markdownFixture(<<<'MD'
        # Kuesioner A

        1. Pertanyaan pertama.

        MD);

    (new QuestionSeeder($path))->run();
    (new QuestionSeeder($path))->run();
    File::delete($path);

    expect(Questionnaire::count())->toBe(1)
        ->and(Question::count())->toBe(1);
});

it('menghapus pertanyaan lama yang tidak ada di file', function () {
    $path = markdownFixture(<<<'MD'
        # Kuesioner A

        1. Pertanyaan pertama.

        MD);
    (new QuestionSeeder($path))->run();
    File::delete($path);

    $path = markdownFixture(<<<'MD'
        # Kuesioner A

        1. Pertanyaan pertama.
        2. Pertanyaan kedua.

        MD);
    (new QuestionSeeder($path))->run();
    File::delete($path);

    expect(Question::query()->where('text', 'Pertanyaan kedua.')->exists())->toBeTrue();

    $path = markdownFixture(<<<'MD'
        # Kuesioner A

        1. Pertanyaan pertama.

        MD);
    (new QuestionSeeder($path))->run();
    File::delete($path);

    expect(Question::count())->toBe(1)
        ->and(Question::query()->where('text', 'Pertanyaan kedua.')->exists())->toBeFalse();
});

it('tidak melakukan apa-apa saat file markdown tidak ada', function () {
    (new QuestionSeeder(sys_get_temp_dir().'/biwraquiz-tidak-ada.md'))->run();

    expect(Questionnaire::count())->toBe(0);
});

it('parse tabel markdown dengan kolom kode, tipe, pernyataan', function () {
    $path = markdownFixture(<<<'MD'
        # Persepsi Siswa

        Skala: 4 poin Likert.

        ## Dimensi 1

        | Kode | Tipe    | Pernyataan                                                         |
        | ---- | ------- | ------------------------------------------------------------------ |
        | U01  | positif | Saya mudah memahami materi ketika guru code-switch.                |
        | U02  | negatif | Saya bingung meskipun guru sudah menjelaskan dalam bahasa Indonesia.|

        ## Ringkasan

        Total: 2 soal.
        MD);

    (new QuestionSeeder($path))->run();
    File::delete($path);

    $questionnaire = Questionnaire::first();

    expect($questionnaire->title)->toBe('Persepsi Siswa')
        ->and($questionnaire->description)->toBe('Skala: 4 poin Likert.')
        ->and($questionnaire->questions->count())->toBe(2)
        ->and($questionnaire->questions[0]->text)->toBe('Saya mudah memahami materi ketika guru code-switch.')
        ->and($questionnaire->questions[0]->position)->toBe(1)
        ->and($questionnaire->questions[1]->text)->toBe('Saya bingung meskipun guru sudah menjelaskan dalam bahasa Indonesia.')
        ->and($questionnaire->questions[1]->position)->toBe(2);
});

it('berhenti parse sebelum section Ringkasan', function () {
    $path = markdownFixture(<<<'MD'
        # Kuesioner A

        | Kode | Tipe    | Pernyataan             |
        | ---- | ------- | ---------------------- |
        | X01  | positif | Soal pertama.          |
        | X02  | negatif | Soal kedua.            |

        ## Ringkasan jumlah soal

        -   Dimensi 1: 2 soal

        ## Catatan untuk seeder

        Field: code, dimension, type, statement.
        MD);

    (new QuestionSeeder($path))->run();
    File::delete($path);

    expect(Questionnaire::first()->questions->count())->toBe(2);
});
