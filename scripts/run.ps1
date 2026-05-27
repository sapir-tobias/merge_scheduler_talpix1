<#
.SYNOPSIS
    Local verification gate for the Scheduler workspace.

.DESCRIPTION
    Runs the static + test gates that must stay green:
      1. Frontend TypeScript typecheck   (tsc --noEmit)
      2. Backend unit/integration tests  (pytest)

    With -Dev it instead launches the full dev stack (FastAPI + Vite) via the
    root `npm run dev`.

.EXAMPLE
    pwsh scripts/run.ps1            # run the verification gates
    pwsh scripts/run.ps1 -Dev      # launch the dev stack
#>
[CmdletBinding()]
param(
    [switch]$Dev
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($Dev) {
    Write-Host '== Launching dev stack (backend :8000 + frontend :5173) ==' -ForegroundColor Cyan
    npm run dev
    return
}

$failures = @()

Write-Host '== [1/2] Frontend typecheck (tsc --noEmit) ==' -ForegroundColor Cyan
Push-Location (Join-Path $root 'frontend')
try {
    & npm exec tsc -- --noEmit
    if ($LASTEXITCODE -ne 0) { $failures += 'frontend tsc' }
} finally {
    Pop-Location
}

Write-Host '== [2/2] Backend tests (pytest) ==' -ForegroundColor Cyan
Push-Location (Join-Path $root 'backend')
try {
    & python -m pytest tests -q
    if ($LASTEXITCODE -ne 0) { $failures += 'backend pytest' }
} finally {
    Pop-Location
}

if ($failures.Count -gt 0) {
    Write-Host ("FAILED: {0}" -f ($failures -join ', ')) -ForegroundColor Red
    exit 1
}
Write-Host 'All verification gates passed.' -ForegroundColor Green
