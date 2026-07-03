<?php

return [
    'url' => env('SUPABASE_URL'),
    'jwt_secret' => env('SUPABASE_JWT_SECRET'),
    'jwt_algorithm' => env('SUPABASE_JWT_ALGORITHM', 'HS256'),
    'auth_audience' => env('SUPABASE_AUTH_AUDIENCE', 'authenticated'),
    'http_verify_ssl' => filter_var(env('SUPABASE_HTTP_VERIFY_SSL', true), FILTER_VALIDATE_BOOLEAN),
];
