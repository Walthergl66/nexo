<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Paginas de retorno de Stripe Checkout. El navegador cae aqui tras pagar o
// cancelar; la confirmacion real del pago la trae el webhook, no esta vista.
// Solo le dicen al usuario que puede volver a la app.
Route::get('/checkout/{outcome}', function (string $outcome) {
    $paid = $outcome === 'success';
    $title = $paid ? 'Pago recibido' : 'Pago cancelado';
    $body = $paid
        ? 'Gracias por tu compra. Puedes volver a la app de nexo para ver tu pedido.'
        : 'No se completo el pago. Puedes volver a la app e intentarlo de nuevo.';

    return response(<<<HTML
        <!doctype html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>{$title} · nexo</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #f8fafc; color: #0f172a;
                   display: grid; place-items: center; min-height: 100vh; margin: 0; }
            .card { background: #fff; border-radius: 16px; padding: 32px; max-width: 360px;
                    text-align: center; box-shadow: 0 10px 40px rgba(15,23,42,.08); }
            h1 { font-size: 20px; margin: 0 0 8px; }
            p { color: #475569; line-height: 1.5; margin: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>{$title}</h1>
            <p>{$body}</p>
          </div>
        </body>
        </html>
        HTML, 200, ['Content-Type' => 'text/html']);
})->where('outcome', 'success|cancel');

Route::get('/api/docs/openapi.json', function () {
    return response(File::get(base_path('docs/openapi.json')), 200, [
        'Content-Type' => 'application/json',
    ]);
});

Route::get('/api/docs', function () {
    return response(<<<'HTML'
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>nexo API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; background: #f8fafc; }
    .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    };
  </script>
</body>
</html>
HTML, 200, ['Content-Type' => 'text/html']);
});
