<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

/**
 * @property int $id
 * @property string $uuid
 * @property int $user_id
 * @property string $title
 * @property string|null $description
 * @property string $slug
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['uuid', 'user_id', 'title', 'description', 'slug', 'status'])]
class Questionnaire extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_CLOSED = 'closed';

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Question, $this>
     */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('position');
    }

    /**
     * @return HasMany<Response, $this>
     */
    public function responses(): HasMany
    {
        return $this->hasMany(Response::class);
    }

    /**
     * @return HasMany<Export, $this>
     */
    public function exports(): HasMany
    {
        return $this->hasMany(Export::class);
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $questionnaire): void {
            $questionnaire->uuid = Uuid::uuid4()->toString();
        });
    }

    public static function booted(): void
    {
        static::creating(function (self $questionnaire): void {
            $questionnaire->slug = $questionnaire->slug ?: Str::slug($questionnaire->title);
        });
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    /**
     * @param  Builder<Questionnaire>  $query
     */
    public function scopeWherePublished(Builder $query): void
    {
        $query->where('status', self::STATUS_PUBLISHED);
    }
}
