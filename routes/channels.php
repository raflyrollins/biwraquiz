<?php

use App\Models\Questionnaire;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('questionnaire.{id}', function ($user, $id) {
    $questionnaire = Questionnaire::query()->whereKey($id)->first();

    return $questionnaire?->user_id === (int) $user->id;
});
