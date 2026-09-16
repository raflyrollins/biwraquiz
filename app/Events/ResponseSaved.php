<?php

namespace App\Events;

use App\Models\Questionnaire;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ResponseSaved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<string, mixed>  $aggregates
     */
    public function __construct(
        public Questionnaire $questionnaire,
        public array $aggregates,
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
            'aggregates' => $this->aggregates,
        ];
    }
}
