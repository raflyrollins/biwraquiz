<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $response_id
 * @property int $question_id
 * @property int $value
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['response_id', 'question_id', 'value'])]
class Answer extends Model
{
    protected function casts(): array
    {
        return [
            'response_id' => 'integer',
            'question_id' => 'integer',
            'value' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Response, $this>
     */
    public function response(): BelongsTo
    {
        return $this->belongsTo(Response::class);
    }

    /**
     * @return BelongsTo<Question, $this>
     */
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
