<?php

/**
 * Backup de los datos de la base que use backend/.env (hoy, produccion).
 *
 *   php scripts/backup-db.php
 *
 * Genera backups/nexo-data-AAAAMMDD-HHMMSS.sql con INSERTs de todas las tablas
 * de la aplicacion, ordenadas por dependencias para que el restore no choque
 * con las llaves foraneas.
 *
 * Solo vuelca datos, no el esquema: el esquema lo reconstruye `php artisan
 * migrate`, que ademas deja la tabla migrations coherente. Restaurar es:
 *
 *   php artisan migrate          # crea el esquema vacio
 *   psql "$CONN" -f backups/nexo-data-....sql
 *
 * No usa pg_dump a proposito, para no depender de tener Docker levantado ni el
 * cliente de Postgres instalado. Si prefieres un dump binario completo (incluye
 * esquema, indices y el schema auth de Supabase) y tienes Docker corriendo:
 *
 *   docker run --rm -e PGPASSWORD=... postgres:17-alpine pg_dump \
 *     -h HOST -p 5432 -U USER -d postgres --schema=public > backup.sql
 */

const EXCLUDED_TABLES = [
    // El esquema y su historial los rehace `php artisan migrate`.
    'migrations',
    // Efimeras: se regeneran solas y restaurarlas solo causa ruido.
    'cache', 'cache_locks', 'sessions', 'jobs', 'job_batches', 'failed_jobs',
    'password_reset_tokens',
];

$root = dirname(__DIR__);

function loadEnv(string $path): array
{
    if (! is_file($path)) {
        fwrite(STDERR, "No encuentro $path\n");
        exit(1);
    }

    $env = [];

    foreach (file($path) as $line) {
        $line = trim($line);

        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        if (preg_match('/^([A-Z0-9_]+)\s*=\s*(.*)$/', $line, $m)) {
            $env[$m[1]] = trim($m[2], "\"'");
        }
    }

    return $env;
}

$env = loadEnv($root.'/backend/.env');

foreach (['DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD'] as $key) {
    if (($env[$key] ?? '') === '') {
        fwrite(STDERR, "Falta $key en backend/.env\n");
        exit(1);
    }
}

$dsn = sprintf(
    'pgsql:host=%s;port=%s;dbname=%s;sslmode=%s',
    $env['DB_HOST'], $env['DB_PORT'], $env['DB_DATABASE'], $env['DB_SSLMODE'] ?? 'require',
);

echo "Conectando a {$env['DB_HOST']}...\n";

try {
    $pdo = new PDO($dsn, $env['DB_USERNAME'], $env['DB_PASSWORD'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 30,
    ]);
} catch (Throwable $e) {
    fwrite(STDERR, 'No se pudo conectar: '.$e->getMessage()."\n");
    exit(1);
}

/**
 * Ordena las tablas de forma que ninguna aparezca antes que aquellas a las que
 * apunta por llave foranea. Las autorreferencias se ignoran: una fila que
 * apunta a otra de su misma tabla puede fallar en el restore, pero hoy no hay
 * ninguna y detectarlo requeriria ordenar fila por fila.
 */
function sortByDependencies(PDO $pdo, array $tables): array
{
    $edges = $pdo->query("
        SELECT child.relname AS child, parent.relname AS parent
        FROM pg_constraint c
        JOIN pg_class child ON child.oid = c.conrelid
        JOIN pg_class parent ON parent.oid = c.confrelid
        JOIN pg_namespace n ON n.oid = child.relnamespace
        WHERE c.contype = 'f' AND n.nspname = 'public'
    ")->fetchAll(PDO::FETCH_ASSOC);

    $pending = array_fill_keys($tables, []);

    foreach ($edges as $edge) {
        ['child' => $child, 'parent' => $parent] = $edge;

        if ($child === $parent || ! isset($pending[$child]) || ! isset($pending[$parent])) {
            continue;
        }

        $pending[$child][$parent] = true;
    }

    $sorted = [];

    while ($pending !== []) {
        $ready = array_keys(array_filter($pending, static fn (array $deps): bool => $deps === []));

        if ($ready === []) {
            // Ciclo de llaves foraneas: se vuelca el resto tal cual y el
            // restore necesitara intervencion manual.
            $sorted = array_merge($sorted, array_keys($pending));
            break;
        }

        sort($ready);

        foreach ($ready as $table) {
            $sorted[] = $table;
            unset($pending[$table]);
        }

        foreach ($pending as $table => $deps) {
            $pending[$table] = array_diff_key($deps, array_flip($ready));
        }
    }

    return $sorted;
}

function quoteValue(PDO $pdo, mixed $value): string
{
    if ($value === null) {
        return 'NULL';
    }

    if (is_bool($value)) {
        return $value ? 'true' : 'false';
    }

    // Todo lo demas va como literal de texto: Postgres lo castea al tipo de la
    // columna, asi que sirve igual para uuid, jsonb, timestamps y numeros.
    return $pdo->quote((string) $value);
}

$tables = $pdo->query("
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
")->fetchAll(PDO::FETCH_COLUMN);

$tables = array_values(array_diff($tables, EXCLUDED_TABLES));

if ($tables === []) {
    fwrite(STDERR, "La base no tiene tablas en el esquema public.\n");
    exit(1);
}

$tables = sortByDependencies($pdo, $tables);

$outputDir = $root.'/backups';

if (! is_dir($outputDir) && ! mkdir($outputDir, 0755, true) && ! is_dir($outputDir)) {
    fwrite(STDERR, "No se pudo crear $outputDir\n");
    exit(1);
}

$outputPath = sprintf('%s/nexo-data-%s.sql', $outputDir, date('Ymd-His'));
$handle = fopen($outputPath, 'w');

fwrite($handle, sprintf(
    "-- Backup de datos de nexo\n".
    "-- Generado: %s\n".
    "-- Origen:   %s/%s\n".
    "--\n".
    "-- Restaurar sobre una base vacia:\n".
    "--   php artisan migrate\n".
    "--   psql \"CONNECTION_STRING\" -f %s\n\n".
    "BEGIN;\n\n",
    date('Y-m-d H:i:s'), $env['DB_HOST'], $env['DB_DATABASE'], basename($outputPath),
));

$total = 0;
$summary = [];

foreach ($tables as $table) {
    $rows = $pdo->query(sprintf('SELECT * FROM "%s"', $table))->fetchAll(PDO::FETCH_ASSOC);

    $summary[$table] = count($rows);
    $total += count($rows);

    if ($rows === []) {
        fwrite($handle, sprintf("-- %s: sin filas\n\n", $table));

        continue;
    }

    $columns = implode(', ', array_map(static fn (string $c): string => "\"$c\"", array_keys($rows[0])));

    fwrite($handle, sprintf("-- %s (%d filas)\n", $table, count($rows)));

    // En bloques para no generar una sola sentencia gigante.
    foreach (array_chunk($rows, 100) as $chunk) {
        $values = [];

        foreach ($chunk as $row) {
            $values[] = '  ('.implode(', ', array_map(
                static fn (mixed $v): string => quoteValue($pdo, $v),
                array_values($row),
            )).')';
        }

        fwrite($handle, sprintf(
            "INSERT INTO \"%s\" (%s) VALUES\n%s;\n",
            $table, $columns, implode(",\n", $values),
        ));
    }

    fwrite($handle, "\n");
}

// Las tablas con id autoincremental necesitan que su secuencia quede por
// encima del mayor id restaurado, si no el siguiente INSERT choca.
fwrite($handle, "-- Sincroniza las secuencias de las columnas autoincrementales\n");

foreach ($tables as $table) {
    $statement = $pdo->prepare("
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = :table
          AND (is_identity = 'YES' OR column_default LIKE 'nextval%')
    ");
    $statement->execute(['table' => $table]);
    $columns = $statement->fetchAll(PDO::FETCH_COLUMN);

    foreach ($columns as $column) {
        fwrite($handle, sprintf(
            "SELECT setval(pg_get_serial_sequence('%s', '%s'), COALESCE((SELECT MAX(\"%s\") FROM \"%s\"), 1));\n",
            $table, $column, $column, $table,
        ));
    }
}

fwrite($handle, "\nCOMMIT;\n");
fclose($handle);

echo "\n";

foreach ($summary as $table => $count) {
    printf("  %-32s %6d filas\n", $table, $count);
}

printf(
    "\nListo: %s (%d filas, %.1f KB)\n",
    str_replace($root.DIRECTORY_SEPARATOR, '', $outputPath),
    $total,
    filesize($outputPath) / 1024,
);
