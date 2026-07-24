<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'identity_lookup' => [
        'url' => env('IDENTITY_LOOKUP_URL'),
        'timeout' => (int) env('IDENTITY_LOOKUP_TIMEOUT', 8),
    ],

    'stripe' => [
        // Clave secreta (sk_test_... en modo demo). El cobro se crea server-side.
        'secret' => env('STRIPE_SECRET'),
        // Secreto de firma del webhook (whsec_...). Sin esto no se confia en
        // ningun evento entrante: cualquiera podria hacer POST a /webhooks/stripe.
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        // A donde vuelve el navegador tras pagar o cancelar. En el demo son
        // paginas simples; la verdad del pago la trae el webhook, no esta URL.
        // Con ?: en vez del 2do argumento de env(): una variable presente pero
        // vacia (STRIPE_SUCCESS_URL=) tambien cae al fallback de APP_URL, no solo
        // cuando esta ausente.
        'success_url' => env('STRIPE_SUCCESS_URL') ?: rtrim((string) env('APP_URL'), '/').'/checkout/success',
        'cancel_url' => env('STRIPE_CANCEL_URL') ?: rtrim((string) env('APP_URL'), '/').'/checkout/cancel',
        // Margen de reloj aceptado en la firma del webhook, en segundos.
        'signature_tolerance' => (int) env('STRIPE_SIGNATURE_TOLERANCE', 300),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
