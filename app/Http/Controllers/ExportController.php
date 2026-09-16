<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateExportJob;
use App\Models\Export;
use App\Models\Questionnaire;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule as ValidationRule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function store(Request $request, Questionnaire $questionnaire): RedirectResponse
    {
        abort_unless($questionnaire->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'type' => ['required', ValidationRule::in([Export::TYPE_PDF, Export::TYPE_EXCEL])],
        ]);

        $export = $questionnaire->exports()->create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'status' => Export::STATUS_PENDING,
        ]);

        GenerateExportJob::dispatch($export);

        return back()->with('success', 'Ekspor sedang diproses. Link unduhan akan muncul saat selesai.');
    }

    public function download(Request $request, Export $export): StreamedResponse
    {
        abort_unless($export->user_id === $request->user()->id, 403);
        abort_unless($export->status === Export::STATUS_COMPLETED && $export->file_path !== null, 404);

        $filename = sprintf('%s-%s.%s', $export->questionnaire_id, $export->type, $export->type);

        return Storage::disk('local')->download($export->file_path, $filename);
    }
}
