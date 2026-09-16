<?php

use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\QuestionnaireController;
use App\Http\Controllers\ResponseController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return inertia('welcome');
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/login', function () {
        return Inertia::render('login');
    })->name('login');

    Route::post('/login', [LoginController::class, 'store'])
        ->middleware('throttle:5,1')
        ->name('login.store');

    Route::get('/auth/google', [GoogleController::class, 'redirect'])->name('auth.google');
    Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('auth.google.callback');
});

Route::post('/logout', function () {
    Auth::logout();

    request()->session()->invalidate();
    request()->session()->regenerateToken();

    return redirect()->route('home');
})->middleware('auth')->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('fill/{questionnaire:uuid}', [ResponseController::class, 'create'])->name('fill.create');
    Route::post('fill/{questionnaire:uuid}', [ResponseController::class, 'store'])->name('fill.store');
});

Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('questionnaires', QuestionnaireController::class)->except(['show'])->parameters(['questionnaires' => 'questionnaire:uuid']);
    Route::post('questionnaires/{questionnaire:uuid}/publish', [QuestionnaireController::class, 'publish'])->name('questionnaires.publish');
    Route::post('questionnaires/{questionnaire:uuid}/close', [QuestionnaireController::class, 'close'])->name('questionnaires.close');

    Route::get('questionnaires/{questionnaire:uuid}/responses', [ResponseController::class, 'index'])->name('questionnaires.responses');
    Route::delete('questionnaires/{questionnaire:uuid}/responses/{response}', [ResponseController::class, 'destroy'])->name('questionnaires.responses.destroy');

    Route::post('questionnaires/{questionnaire:uuid}/exports', [ExportController::class, 'store'])->name('questionnaires.exports.store');
    Route::get('exports/{export:uuid}/download', [ExportController::class, 'download'])->name('exports.download');
});
