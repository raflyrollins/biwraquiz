<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('questionnaires', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->after('id');
        });

        Schema::table('exports', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->after('id');
        });

        foreach (['questionnaires', 'exports'] as $tableName) {
            DB::table($tableName)
                ->whereNull('uuid')
                ->orderBy('id')
                ->select('id')
                ->get()
                ->each(function (object $row) use ($tableName): void {
                    DB::table($tableName)
                        ->where('id', $row->id)
                        ->update(['uuid' => (string) Str::uuid()]);
                });

            Schema::table($tableName, function (Blueprint $table) {
                $table->unique('uuid');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questionnaires', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });

        Schema::table('exports', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });
    }
};
