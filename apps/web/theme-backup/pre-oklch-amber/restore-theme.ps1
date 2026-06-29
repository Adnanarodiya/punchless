# Restores the pre-oklch-amber theme from this backup folder.
# Run from repo root: .\apps\web\theme-backup\pre-oklch-amber\restore-theme.ps1

$ErrorActionPreference = "Stop"
$backupDir = $PSScriptRoot
$webRoot = Resolve-Path (Join-Path $backupDir "..\..")

$restores = @(
  @{ Source = "globals.css"; Target = "src\app\globals.css" },
  @{ Source = "tailwind.config.ts"; Target = "tailwind.config.ts" },
  @{ Source = "layout.tsx"; Target = "src\app\layout.tsx" }
)

foreach ($item in $restores) {
  $from = Join-Path $backupDir $item.Source
  $to = Join-Path $webRoot $item.Target
  if (-not (Test-Path $from)) {
    throw "Backup file missing: $from"
  }
  Copy-Item -Path $from -Destination $to -Force
  Write-Host "Restored $($item.Source) -> $($item.Target)"
}

Write-Host ""
Write-Host "Old theme restored. Restart dev server and hard-refresh the browser."