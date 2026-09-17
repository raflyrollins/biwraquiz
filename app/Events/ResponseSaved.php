<?php

namespace App\Events;

use App\Models\Questionnaire;
use App\Services\QuestionnaireAggregator;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ResponseSaved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Questionnaire $questionnaire,
        public string $submittedByName,
    ) {}

    /** @return array<int, Channel> */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('questionnaire.'.$this->questionnaire->id)];
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        return [
            'questionnaire_id' => $this->questionnaire->id,
            'submitted_by' => $this->submittedByName,
            'aggregates' => app(QuestionnaireAggregator::class)->aggregate($this->questionnaire),
        ];
    }
}
