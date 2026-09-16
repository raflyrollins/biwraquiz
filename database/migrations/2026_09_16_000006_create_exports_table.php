<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('exports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('questionnaire_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20);
            $table->string('status', 20)->default('pending');
            $table->string('file_path')->nullable();
            $table->string('error')->nullable();
            $table->timestamps();
        });

        Schema::table('exports', function (Blueprint $table) {
            $table->index(['user_id', 'status']);
            $table->index(['questionnaire_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exports');
    }
};
