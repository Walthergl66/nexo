<?php

use App\Models\Profile;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->uuid('supabase_user_id')->unique();
            $table->string('email')->nullable()->index();
            $table->string('display_name')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('role')->default(Profile::ROLE_BUYER)->index();
            $table->string('verification_status')->default(Profile::VERIFICATION_PENDING)->index();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['role', 'verification_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
