param(
    [int]$Port = 8010
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot "mobile/.env.local"

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
