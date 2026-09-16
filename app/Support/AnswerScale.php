<?php

namespace App\Support;

class AnswerScale
{
    public const SDA = 1;

    public const DA = 2;

    public const A = 3;

    public const SA = 4;

    public const LABELS = [
        self::SDA => 'SDA',
        self::DA => 'DA',
        self::A => 'A',
        self::SA => 'SA',
    ];

    public const DESCRIPTIONS = [
        self::SDA => 'Sangat Tidak Setuju',
        self::DA => 'Tidak Setuju',
        self::A => 'Setuju',
        self::SA => 'Sangat Setuju',
    ];

    public const COLORS = [
        self::SDA => '#D62677',
        self::DA => '#FF8FB8',
        self::A => '#FFBCDA',
        self::SA => '#4A4566',
    ];

    public static function label(int $value): string
    {
        return self::LABELS[$value] ?? (string) $value;
    }

    public static function description(int $value): string
    {
        return self::DESCRIPTIONS[$value] ?? '';
    }
}
