param(
    [string]$AgentDir = $(if ($env:PI_CODING_AGENT_DIR) { $env:PI_CODING_AGENT_DIR } else { Join-Path $env:USERPROFILE '.pi\agent' }),
    [ValidateRange(0, 1000)][int]$MaxRetries = 10
)
$ErrorActionPreference = 'Stop'
$packageRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$agentRoot = [IO.Path]::GetFullPath($AgentDir)
$localRoot = Join-Path $agentRoot 'local'
$targetRoot = [IO.Path]::GetFullPath((Join-Path $localRoot 'pi-goal-retry'))
if ([IO.Path]::GetDirectoryName($targetRoot) -ne [IO.Path]::GetFullPath($localRoot)) { throw 'Invalid installation path.' }
if (-not (Test-Path -LiteralPath (Join-Path $packageRoot 'dist\index.ts'))) { throw 'Build the package before installing.' }
if ($targetRoot -eq $packageRoot) { throw 'Run this installer from the delivered source package.' }

$settingsPath = Join-Path $agentRoot 'settings.json'
$goalSettingsPath = Join-Path $agentRoot 'pi-goal.json'
$backupRoot = Join-Path $agentRoot ('backups\pi-goal-retry-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
$settings = if (Test-Path -LiteralPath $settingsPath) {
    Copy-Item -LiteralPath $settingsPath -Destination (Join-Path $backupRoot 'settings.json')
    Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json -AsHashtable
} else { @{} }
$goalSettings = if (Test-Path -LiteralPath $goalSettingsPath) {
    Copy-Item -LiteralPath $goalSettingsPath -Destination (Join-Path $backupRoot 'pi-goal.json')
    Get-Content -LiteralPath $goalSettingsPath -Raw | ConvertFrom-Json -AsHashtable
} else { @{} }
if ($null -eq $settings -or $null -eq $goalSettings) { throw 'Existing settings must contain JSON objects.' }
if (Test-Path -LiteralPath $targetRoot) {
    $existingManifest = Get-Content -LiteralPath (Join-Path $targetRoot 'package.json') -Raw | ConvertFrom-Json
    if ($existingManifest.name -notin @('pi-goal-retry', 'pi-goal-retry-local')) { throw 'Installation target contains another package.' }
    Copy-Item -LiteralPath $targetRoot -Destination (Join-Path $backupRoot 'previous-fork') -Recurse
}
New-Item -ItemType Directory -Path $localRoot, $targetRoot -Force | Out-Null
foreach ($item in Get-ChildItem -LiteralPath $packageRoot -Force) {
    if ($item.Name -ne 'node_modules') { Copy-Item -LiteralPath $item.FullName -Destination $targetRoot -Recurse -Force }
}

# Replace the original /goal declaration in place; keep its cached npm installation for rollback.
$packages = [Collections.Generic.List[object]]::new()
$inserted = $false
foreach ($entry in @($settings.packages)) {
    if ($null -eq $entry) { continue }
    $source = if ($entry -is [string]) { $entry } else { $entry.source }
    if ($source -match '^npm:@narumitw/pi-goal(?:@.*)?$' -or $source -eq $targetRoot) {
        if (-not $inserted) { $packages.Add($targetRoot); $inserted = $true }
    } else { $packages.Add($entry) }
}
if (-not $inserted) { $packages.Add($targetRoot) }
$settings.packages = $packages.ToArray()
if (-not $goalSettings.ContainsKey('providerRetry')) { $goalSettings.providerRetry = @{} }
$goalSettings.providerRetry.enabled = $true
$goalSettings.providerRetry.maxRetries = $MaxRetries
if (-not $goalSettings.providerRetry.ContainsKey('baseDelayMs')) { $goalSettings.providerRetry.baseDelayMs = 10000 }
if (-not $goalSettings.providerRetry.ContainsKey('maxDelayMs')) { $goalSettings.providerRetry.maxDelayMs = 120000 }

function Save-JsonAtomically([string]$Path, $Value) {
    $temporaryPath = $Path + '.pi-goal-retry-' + [guid]::NewGuid().ToString('N') + '.tmp'
    $Value | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $temporaryPath -Encoding utf8NoBOM
    Move-Item -LiteralPath $temporaryPath -Destination $Path -Force
}
try {
    Save-JsonAtomically $goalSettingsPath $goalSettings
    Save-JsonAtomically $settingsPath $settings
} catch {
    foreach ($name in @('settings.json','pi-goal.json')) {
        $backup = Join-Path $backupRoot $name
        if (Test-Path -LiteralPath $backup) { Copy-Item -LiteralPath $backup -Destination (Join-Path $agentRoot $name) -Force }
    }
    throw
}
[pscustomobject]@{ Package = 'pi-goal-retry'; Version = '0.55.0-retry.1'; MaxRetries = $MaxRetries; InstalledAt = $targetRoot; Backup = $backupRoot; Next = 'In the current Pi session run /reload, then /goal resume.' } | ConvertTo-Json
