<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('questionnaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('slug')->unique();
            $table->string('status', 20)->default('draft');
            $table->timestamps();
        });

        Schema::table('questionnaires', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('status');
        });

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement(
                <<<'SQL'
                    ALTER TABLE questionnaires
                    ADD COLUMN search_document tsvector GENERATED ALWAYS AS (
                        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
                    ) STORED
                SQL
            );
            DB::statement(
                'CREATE INDEX questionnaires_search_idx ON questionnaires USING GIN (search_document)'
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS questionnaires_search_idx');
        }

        Schema::dropIfExists('questionnaires');
    }
};
