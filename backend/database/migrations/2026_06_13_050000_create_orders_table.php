<?php

use App\Models\Order;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('profile_id')->constrained()->cascadeOnDelete();
            $table->string('order_number')->unique();
            $table->string('status')->default(Order::STATUS_PENDING)->index();
            $table->string('payment_status')->default(Order::PAYMENT_PENDING)->index();
            $table->char('currency', 3)->default('USD');
            $table->unsignedInteger('subtotal_cents');
            $table->unsignedInteger('total_cents');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['profile_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
