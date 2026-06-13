<?php

namespace App\Modules\Profiles\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class IdentityLookupService
{
    /**
     * @return array{national_id: string, first_name: ?string, last_name: ?string, age: ?int, gender: ?string, raw: array<string, mixed>}
     */
    public function lookup(string $nationalId): array
    {
        $nationalId = preg_replace('/\D+/', '', $nationalId) ?? '';

        if (! $this->isValidEcuadorianId($nationalId)) {
            throw ValidationException::withMessages([
                'national_id' => 'La cedula no es valida.',
            ]);
        }

        $lookupUrl = config('services.identity_lookup.url');

        if (! is_string($lookupUrl) || trim($lookupUrl) === '') {
            throw ValidationException::withMessages([
                'national_id' => 'La consulta de cedula no esta configurada.',
            ]);
        }

        $response = Http::timeout((int) config('services.identity_lookup.timeout', 8))
            ->acceptJson()
            ->get($lookupUrl, [
                'identificacion' => $nationalId,
            ]);

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'national_id' => 'No se pudo consultar la cedula.',
            ]);
        }

        $payload = $response->json();

        if (! is_array($payload)) {
            throw ValidationException::withMessages([
                'national_id' => 'La consulta de cedula no devolvio datos validos.',
            ]);
        }

        $person = $this->extractPersonData($payload);

        if (($person['first_name'] ?? null) === null && ($person['last_name'] ?? null) === null) {
            throw ValidationException::withMessages([
                'national_id' => 'No se encontraron datos para la cedula indicada.',
            ]);
        }

        return [
            'national_id' => $nationalId,
            'first_name' => $person['first_name'],
            'last_name' => $person['last_name'],
            'age' => $person['age'],
            'gender' => $person['gender'],
            'raw' => $payload,
        ];
    }

    public function isValidEcuadorianId(string $nationalId): bool
    {
        if (! preg_match('/^\d{10}$/', $nationalId)) {
            return false;
        }

        $province = (int) substr($nationalId, 0, 2);
        $thirdDigit = (int) $nationalId[2];

        if ($province < 1 || $province > 24 || $thirdDigit >= 6) {
            return false;
        }

        $coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
        $sum = 0;

        for ($i = 0; $i < 9; $i++) {
            $value = ((int) $nationalId[$i]) * $coefficients[$i];
            $sum += $value >= 10 ? $value - 9 : $value;
        }

        $checkDigit = (10 - ($sum % 10)) % 10;

        return $checkDigit === (int) $nationalId[9];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{first_name: ?string, last_name: ?string, age: ?int, gender: ?string}
     */
    private function extractPersonData(array $payload): array
    {
        $source = $this->firstArrayPayload($payload);

        $fullName = $this->firstString($source, [
            'nombre',
            'nombres',
            'nombreCompleto',
            'nombre_completo',
            'razonSocial',
            'razon_social',
            'fullname',
            'full_name',
        ]);
        $firstName = $this->firstString($source, ['first_name', 'primer_nombre', 'nombres']);
        $lastName = $this->firstString($source, ['last_name', 'apellidos', 'apellido', 'primer_apellido']);

        if (($firstName === null || $lastName === null) && $fullName !== null) {
            [$firstName, $lastName] = $this->splitFullName($fullName);
        }

        return [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'age' => $this->firstInteger($source, ['edad', 'age']) ?? $this->ageFromBirthDate($source),
            'gender' => $this->firstString($source, ['genero', 'gender', 'sexo']),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function firstArrayPayload(array $payload): array
    {
        $columnPayload = $this->columnPayload($payload);

        if ($columnPayload !== []) {
            return $columnPayload;
        }

        foreach (['data', 'datos', 'persona', 'result', 'resultado'] as $key) {
            $value = Arr::get($payload, $key);

            if (is_array($value)) {
                return $value;
            }
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function columnPayload(array $payload): array
    {
        $entities = Arr::get($payload, 'paquete.entidades.entidad');

        if (! is_array($entities)) {
            return [];
        }

        $normalized = [];

        foreach ($entities as $entity) {
            if (! is_array($entity)) {
                continue;
            }

            $rows = Arr::get($entity, 'filas.fila', []);
            $rows = $this->listValue($rows);

            foreach ($rows as $row) {
                if (! is_array($row)) {
                    continue;
                }

                $columns = Arr::get($row, 'columnas.columna', []);
                $columns = $this->listValue($columns);

                foreach ($columns as $column) {
                    if (! is_array($column)) {
                        continue;
                    }

                    $field = $column['campo'] ?? null;
                    $value = $column['valor'] ?? null;

                    if (is_string($field) && $field !== '') {
                        $normalized[$field] = $value;
                    }
                }
            }
        }

        return $normalized;
    }

    /**
     * @return list<mixed>
     */
    private function listValue(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        if (array_is_list($value)) {
            return $value;
        }

        return [$value];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<string>  $keys
     */
    private function firstString(array $payload, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = Arr::get($payload, $key);

            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<string>  $keys
     */
    private function firstInteger(array $payload, array $keys): ?int
    {
        foreach ($keys as $key) {
            $value = Arr::get($payload, $key);

            if (is_numeric($value)) {
                return max((int) $value, 0);
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function ageFromBirthDate(array $payload): ?int
    {
        $birthDate = $this->firstString($payload, ['fechaNacimiento', 'birth_date', 'date_of_birth']);

        if ($birthDate === null) {
            return null;
        }

        $date = \DateTimeImmutable::createFromFormat('d/m/Y', $birthDate)
            ?: \DateTimeImmutable::createFromFormat('Y-m-d', $birthDate);

        if (! $date instanceof \DateTimeImmutable) {
            return null;
        }

        return (int) $date->diff(new \DateTimeImmutable('today'))->y;
    }

    /**
     * @return array{0: ?string, 1: ?string}
     */
    private function splitFullName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName)) ?: [];

        if (count($parts) <= 1) {
            return [$fullName, null];
        }

        $middle = max(1, (int) floor(count($parts) / 2));

        return [
            implode(' ', array_slice($parts, 0, $middle)),
            implode(' ', array_slice($parts, $middle)),
        ];
    }
}
