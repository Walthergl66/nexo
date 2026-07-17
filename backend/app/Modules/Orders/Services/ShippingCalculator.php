<?php

namespace App\Modules\Orders\Services;

class ShippingCalculator
{
    /**
     * Resolve the shipping fee (in cents) for a given subtotal.
     */
    public function quote(int $subtotalCents): int
    {
        if ($subtotalCents <= 0) {
            return 0;
        }

        $freeThreshold = (int) config('marketplace.shipping.free_threshold_cents');

        if ($freeThreshold > 0 && $subtotalCents >= $freeThreshold) {
            return 0;
        }

        return max(0, (int) config('marketplace.shipping.flat_cents'));
    }
}
