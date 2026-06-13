<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table): void {
            $table->string('national_id', 20)->nullable()->unique()->after('avatar_url');
            $table->string('first_name')->nullable()->after('national_id');
            $table->string('last_name')->nullable()->after('first_name');
            $table->unsignedTinyInteger('age')->nullable()->after('last_name');
            $table->string('gender', 30)->nullable()->after('age');
            $table->string('address')->nullable()->after('gender');
            $table->string('phone', 30)->nullable()->after('address');
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table): void {
            $table->dropColumn([
                'national_id',
                'first_name',
                'last_name',
                'age',
                'gender',
                'address',
                'phone',
            ]);
        });
    }
};
