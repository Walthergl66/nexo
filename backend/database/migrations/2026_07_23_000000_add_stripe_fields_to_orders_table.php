<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            // Id de la Checkout Session: se guarda al crearla y sirve para
            // conciliar. Indexado porque el webhook podria buscar por aqui.
            $table->string('stripe_session_id')->nullable()->index()->after('metadata');

            // Id del PaymentIntent que Stripe confirma en el webhook. Es la
            // referencia real del cobro, la que usarias para un reembolso.
            $table->string('stripe_payment_intent_id')->nullable()->after('stripe_session_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropIndex(['stripe_session_id']);
            $table->dropColumn(['stripe_session_id', 'stripe_payment_intent_id']);
        });
    }
};
