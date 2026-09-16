<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class GoogleController extends Controller
{
    public function redirect(): SymfonyRedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        $google = Socialite::driver('google')->user();

        /** @var User|null $user */
        $user = User::query()->where('google_id', $google->getId())->first();

        if (! $user) {
            $user = User::query()->where('email', $google->getEmail())->first();
            $user?->forceFill(['google_id' => $google->getId()])->save();
        }

        $user ??= User::query()->create([
            'google_id' => $google->getId(),
            'name' => $google->getName() ?? $google->getEmail(),
            'email' => $google->getEmail(),
            'avatar' => $google->getAvatar(),
            'password' => Str::random(40),
        ]);

        Auth::login($user);

        return redirect()->intended($user->is_admin ? route('dashboard') : route('home'));
    }
}
