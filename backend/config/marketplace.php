<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Shipping
    |--------------------------------------------------------------------------
    |
    | Flat shipping fee applied per order, in cents. Orders whose subtotal
    | reaches the free-shipping threshold ship for free. Set the threshold to
    | 0 to disable free shipping entirely.
    |
    */
    'shipping' => [
        'flat_cents' => (int) env('SHIPPING_FLAT_CENTS', 499),
        'free_threshold_cents' => (int) env('SHIPPING_FREE_THRESHOLD_CENTS', 5000),
    ],
];
