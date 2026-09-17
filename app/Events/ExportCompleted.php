<?php

namespace App\Events;

use App\Models\Export;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ExportCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Export $export) {}

    /** @return array<int, Channel> */
    public function broadcastOn(): array
    {
        return [new PrivateChannel('App.Models.User.'.$this->export->user_id)];
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        return [
            'export' => [
                'id' => $this->export->id,
                'type' => $this->export->type,
                'status' => $this->export->status,
                'file_path' => $this->export->file_path,
            ],
        ];
    }
}
