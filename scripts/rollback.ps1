param([string]$AgentDir = $(if ($env:PI_CODING_AGENT_DIR) { $env:PI_CODING_AGENT_DIR } else { Join-Path $env:USERPROFILE '.pi\agent' }))
$ErrorActionPreference = 'Stop'
$settingsPath = Join-Path $AgentDir 'settings.json'
$targetRoot = [IO.Path]::GetFullPath((Join-Path $AgentDir 'local\pi-goal-retry'))
$settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json -AsHashtable
$replaced = $false
$settings.packages = @($settings.packages | ForEach-Object {
    $source = if ($_ -is [string]) { $_ } else { $_.source }
    if ($source -eq $targetRoot) { $replaced = $true; 'npm:@narumitw/pi-goal' } else { $_ }
})
if (-not $replaced) { throw 'The local fork is not configured; no settings were changed.' }
$backup = $settingsPath + '.before-goal-rollback-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff')
Copy-Item -LiteralPath $settingsPath -Destination $backup
$temporaryPath = $settingsPath + '.goal-rollback-' + [guid]::NewGuid().ToString('N') + '.tmp'
$settings | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $temporaryPath -Encoding utf8NoBOM
Move-Item -LiteralPath $temporaryPath -Destination $settingsPath -Force
Write-Output 'Restored npm:@narumitw/pi-goal. Run /reload in Pi. Local source and backups are retained.'
