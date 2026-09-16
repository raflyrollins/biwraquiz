<?php

namespace Database\Seeders;

use App\Models\Questionnaire;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class QuestionSeeder extends Seeder
{
    /**
     * @param  string|null  $markdownPath  Path to the questions markdown file. Defaults to
     *                                     QUESTIONS.md at the project root. Overridable so tests
     *                                     can point at a temporary file.
     */
    public function __construct(private ?string $markdownPath = null) {}

    public function run(): void
    {
        $path = $this->markdownPath ?? base_path('QUESTIONS.md');

        if (! File::exists($path)) {
            echo "File soal belum ada: {$path}. Buat file tersebut, lalu jalankan seeder lagi.\n";

            return;
        }

        $markdown = File::get($path);
        $title = $this->parseTitle($markdown);
        $description = $this->parseDescription($markdown);
        $questions = $this->parseQuestions($markdown);

        if ($questions === []) {
            fwrite(STDERR, "Tidak ada pertanyaan yang ditemukan di {$path}.\n");

            return;
        }

        $owner = $this->owner();

        $questionnaire = Questionnaire::query()
            ->where('user_id', $owner->id)
            ->where('title', $title)
            ->first();

        if ($questionnaire === null) {
            $questionnaire = $owner->questionnaires()->create([
                'title' => $title,
                'description' => $description,
                'status' => Questionnaire::STATUS_PUBLISHED,
            ]);
        }

        foreach ($questions as $index => $text) {
            $questionnaire->questions()->updateOrCreate(
                ['text' => $text],
                ['position' => $index + 1],
            );
        }

        $questionnaire->questions()->whereNotIn('text', $questions)->delete();

        $shareUrl = rtrim((string) config('app.url'), '/').route('fill.create', $questionnaire->uuid, false);

        echo "Kuesioner \"{$questionnaire->title}\" berisi ".count($questions)." pertanyaan.\n";
        echo "Link isi kuesioner: {$shareUrl}\n";
    }

    /**
     * Kuesioner dimiliki oleh admin pertama, lalu user pertama, lalu dibuatkan
     * akun admin dari config app.admin() bila belum ada user sama sekali.
     */
    private function owner(): User
    {
        $user = User::query()->where('is_admin', true)->first();

        $user ??= User::query()->first();

        $user ??= User::query()->create([
            'name' => 'Admin Biwraquiz',
            'email' => config('app.admin.email'),
            'password' => config('app.admin.password'),
            'is_admin' => true,
        ]);

        return $user;
    }

    private function parseTitle(string $markdown): string
    {
        if (preg_match('/^#\s+(.+)$/m', $markdown, $matches) === 1) {
            return trim($matches[1]);
        }

        return 'Kuesioner';
    }

    /**
     * Parse pertanyaan dari dua format markdown:
     *   - Tabel:  | CODE | positif/negatif | STATEMENT |
     *   - List:   1. STATEMENT
     *
     * Berhenti saat menemui heading "Ringkasan" / "Catatan".
     *
     * @return list<string>
     */
    private function parseQuestions(string $markdown): array
    {
        $questions = [];

        foreach (preg_split('/\r\n|\r|\n/', $markdown) ?: [] as $line) {
            $line = trim($line);

            if (preg_match('/^##\s+(Ringkasan|Catatan)/', $line) === 1) {
                break;
            }

            if (preg_match('/^\|\s*\S+\s*\|\s*(positif|negatif)\s*\|\s*(.+?)\s*\|$/', $line, $m) === 1) {
                $questions[] = trim($m[2]);

                continue;
            }

            if (preg_match('/^\d+[\.\)]\s+(.+)$/', $line, $m) === 1) {
                $questions[] = trim($m[1]);
            }
        }

        return $questions;
    }

    /**
     * Teks bebas sebelum baris pertanyaan (tabel atau daftar bernomor),
     * di luar heading dan garis pemisah, dijadikan deskripsi. Bold markdown
     * dihapus agar bersih.
     */
    private function parseDescription(string $markdown): ?string
    {
        $parts = [];

        foreach (preg_split('/\r\n|\r|\n/', $markdown) ?: [] as $line) {
            $line = trim($line);

            if ($line === '' || $line === '---') {
                continue;
            }

            if (str_starts_with($line, '#')) {
                continue;
            }

            if (preg_match('/^\d+[\.\)]\s+/', $line) === 1) {
                break;
            }

            if (str_starts_with($line, '|')) {
                break;
            }

            $parts[] = $line;
        }

        if ($parts === []) {
            return null;
        }

        $text = implode("\n", $parts);

        return preg_replace('/\*\*(.+?)\*\*/', '$1', $text);
    }
}
