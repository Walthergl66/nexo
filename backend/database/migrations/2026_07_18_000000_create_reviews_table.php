<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('order_item_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('rating'); // 1–5
            $table->text('body')->nullable();
            $table->timestamps();

            // Un comprador solo puede dejar una reseña por producto.
            $table->unique(['profile_id', 'product_id']);
            $table->index(['product_id', 'created_at']);
        });

        // Cache de agregados en productos para no recalcular en cada request.
        Schema::table('products', function (Blueprint $table): void {
            $table->decimal('average_rating', 3, 2)->default(0)->after('status');
            $table->unsignedInteger('review_count')->default(0)->after('average_rating');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->dropColumn(['average_rating', 'review_count']);
        });

        Schema::dropIfExists('reviews');
    }
};
