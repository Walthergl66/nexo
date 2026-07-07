param(
    [int]$Port = 8010
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot "mobile/.env.local"
$backendEnvPath = Join-Path $repoRoot "backend/.env"

if (-not (Test-Path $envPath)) {
    $examplePath = Join-Path $repoRoot "mobile/.env.example"

    if (Test-Path $examplePath) {
        Copy-Item $examplePath $envPath
    } else {
        New-Item -ItemType File -Path $envPath -Force | Out-Null
    }
}

$ip = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.AddressState -eq "Preferred" -and
        $_.IPAddress -notlike "127.*" -and
        $_.InterfaceAlias -notmatch "vEthernet|Docker|Loopback|WSL"
    } |
    Sort-Object {
        if ($_.InterfaceAlias -match "Wi-Fi|WLAN|Wireless") { 0 } else { 1 }
    }, InterfaceMetric |
    Select-Object -First 1 -ExpandProperty IPAddress

if (-not $ip) {
    throw "No se pudo detectar una IP local valida. Conectate a Wi-Fi o Ethernet e intenta de nuevo."
}

$apiUrl = "http://${ip}:${Port}/api"
$lines = @()

if (Test-Path $envPath) {
    $lines = Get-Content $envPath
}

$key = "EXPO_PUBLIC_API_BASE_URL"
$replacement = "$key=$apiUrl"
$updated = $false

$lines = $lines | ForEach-Object {
    if ($_ -match "^$key=") {
        $updated = $true
        $replacement
    } else {
        $_
    }
}

if (-not $updated) {
    $lines += $replacement
}

Set-Content -Path $envPath -Value $lines

Write-Host "Mobile API URL actualizada:"
Write-Host $replacement

$phpServers = Get-CimInstance Win32_Process -Filter "Name = 'php.exe'" |
    Where-Object { $_.CommandLine -match "-S\s+0\.0\.0\.0:$Port|-S\s+127\.0\.0\.1:$Port|-S\s+localhost:$Port" }

if ($phpServers) {
    Write-Host ""
    Write-Host "Advertencia: hay un servidor PHP local usando el puerto $Port."
    Write-Host "Eso puede competir con Docker. Detenlo con:"
    $phpServers | ForEach-Object {
        Write-Host "Stop-Process -Id $($_.ProcessId) -Force"
    }
    Write-Host ""
}

if (Test-Path $backendEnvPath) {
    $backendLines = Get-Content $backendEnvPath
    $corsKey = "CORS_ALLOWED_ORIGINS"
    $corsOrigins = @(
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8100",
        "http://127.0.0.1:8100",
        "http://${ip}:3000",
        "http://${ip}:8081",
        "http://${ip}:19006"
    ) -join ","
    $corsReplacement = "$corsKey=$corsOrigins"
    $corsUpdated = $false

    $backendLines = $backendLines | ForEach-Object {
        if ($_ -match "^$corsKey=") {
            $corsUpdated = $true
            $corsReplacement
        } else {
            $_
        }
    }

    if (-not $corsUpdated) {
        $backendLines += $corsReplacement
    }

    Set-Content -Path $backendEnvPath -Value $backendLines

    Write-Host "Backend CORS actualizado:"
    Write-Host $corsReplacement
    Write-Host "Si Docker ya esta levantado, ejecuta: docker compose exec backend php artisan config:clear"
}
