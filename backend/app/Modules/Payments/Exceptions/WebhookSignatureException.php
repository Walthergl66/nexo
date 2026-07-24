<?php

namespace App\Modules\Payments\Exceptions;

use RuntimeException;

/**
 * La firma de un webhook de Stripe no valido. El controlador la traduce a un
 * 400 para que Stripe reintente o marque el endpoint como fallido, sin filtrar
 * el motivo exacto.
 */
class WebhookSignatureException extends RuntimeException {}
