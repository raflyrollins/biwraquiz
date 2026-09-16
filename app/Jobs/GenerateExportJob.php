<?php

namespace App\Jobs;

use App\Events\ExportCompleted;
use App\Models\Answer;
use App\Models\Export;
use App\Models\Question;
use App\Models\Response;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Throwable;

class GenerateExportJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 300;

    public function __construct(public Export $export) {}

    public function handle(): void
    {
        $this->export->update(['status' => Export::STATUS_PROCESSING]);

        try {
            $data = $this->exportData();

            $path = $this->export->type === Export::TYPE_PDF
                ? $this->generatePdf($data)
                : $this->generateExcel($data);

            $this->export->update([
                'status' => Export::STATUS_COMPLETED,
                'file_path' => $path,
                'error' => null,
            ]);

            ExportCompleted::dispatch($this->export);
        } catch (Throwable $e) {
            $this->export->update([
                'status' => Export::STATUS_FAILED,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @return array{title: string, questions: array<int, Question>, rows: array<int, array{respondent: string, email: string, submitted_at: string, answers: array<int, int>}>}
     */
    private function exportData(): array
    {
        $questionnaire = $this->export->questionnaire
            ->load('questions')
            ->load(['responses' => fn ($q) => $q
                ->where('status', Response::STATUS_COMPLETED)
                ->with('user:id,name,email')
                ->with('answers', fn ($q) => $q->select('response_id', 'question_id', 'value'))]);

        $rows = $questionnaire->responses
            ->map(fn (Response $response) => [
                'respondent' => $response->user->name ?? 'Peserta',
                'email' => $response->user->email ?? '-',
                'submitted_at' => (string) $response->submitted_at,
                'answers' => $response->answers
                    ->mapWithKeys(fn (Answer $answer) => [$answer->question_id => $answer->value])
                    ->all(),
            ])
            ->values()
            ->all();

        return [
            'title' => $questionnaire->title,
            'questions' => $questionnaire->questions->all(),
            'rows' => $rows,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function generatePdf(array $data): string
    {
        $path = "exports/export-{$this->export->id}.pdf";

        Storage::disk('local')->put($path, Pdf::loadView('exports.pdf', $data)->output());

        return $path;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function generateExcel(array $data): string
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->setCellValue('A1', 'No');
        $sheet->setCellValue('B1', 'Responden');
        $sheet->setCellValue('C1', 'Email');
        $sheet->setCellValue('D1', 'Waktu Submit');
        $sheet->setCellValue('E1', 'Rata-rata Skor');

        /** @var list<Question> $questions */
        $questions = $data['questions'];
        foreach ($questions as $i => $question) {
            $column = Coordinate::stringFromColumnIndex($i + 6);
            $sheet->setCellValue("{$column}1", 'Q'.($i + 1));
        }

        /** @var list<array{respondent: string, email: string, submitted_at: string, answers: array<int, int>}> $rows */
        $rows = $data['rows'];
        foreach ($rows as $i => $row) {
            $rowNum = $i + 2;
            $values = [];
            foreach ($questions as $j => $question) {
                $answer = $row['answers'][$question->id] ?? 0;
                $values[] = $answer;
                $column = Coordinate::stringFromColumnIndex($j + 6);
                $sheet->setCellValue("{$column}{$rowNum}", $answer);
            }

            $avg = count($values) > 0 ? round(array_sum($values) / count($values), 2) : 0;

            $sheet->setCellValue("A{$rowNum}", $i + 1);
            $sheet->setCellValue("B{$rowNum}", $row['respondent']);
            $sheet->setCellValue("C{$rowNum}", $row['email']);
            $sheet->setCellValue("D{$rowNum}", $row['submitted_at']);
            $sheet->setCellValue("E{$rowNum}", $avg);
        }

        $writer = new Xlsx($spreadsheet);
        $path = "exports/export-{$this->export->id}.xlsx";
        $temp = tempnam(sys_get_temp_dir(), 'biwraquiz-export');
        $writer->save($temp);
        $contents = file_get_contents($temp);
        if ($contents === false) {
            throw new \RuntimeException('Gagal membaca file ekspor sementara.');
        }
        Storage::disk('local')->put($path, $contents);
        @unlink($temp);

        return $path;
    }
}
