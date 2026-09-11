# One-click sync for DSA Compass.
#
# The app can only hand you a downloaded file - a browser cannot touch git.
# This script closes that gap: it picks up the newest export from Downloads,
# drops it into the repo, and commits + pushes.
#
#   sync.bat        run once
#   sync-auto.bat   keep watching and sync whenever a new export appears

param(
    [switch]$Watch,
    [int]$IntervalSeconds = 20
)

Set-Location -LiteralPath $PSScriptRoot
$DataFile  = 'dsa-compass-data.json'
$Downloads = Join-Path $env:USERPROFILE 'Downloads'

function Get-NewestExport {
    # Browsers save repeats as "dsa-compass-data (1).json", so take the newest match.
    Get-ChildItem -LiteralPath $Downloads -Filter 'dsa-compass-data*.json' -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

function Move-ExportIntoRepo {
    $newest = Get-NewestExport
    if (-not $newest) { return $false }
    Move-Item -LiteralPath $newest.FullName -Destination (Join-Path $PSScriptRoot $DataFile) -Force
    Write-Host "  picked up $($newest.Name) from Downloads" -ForegroundColor Cyan
    return $true
}

# The data file can hold chat transcripts and private notes. If this repo is
# public, so are they - say so rather than pushing them silently.
function Warn-IfPersonal {
    $path = Join-Path $PSScriptRoot $DataFile
    if (-not (Test-Path -LiteralPath $path)) { return }
    try { $d = (Get-Content -LiteralPath $path -Raw | ConvertFrom-Json).data } catch { return }
    $msgs = 0
    foreach ($c in @($d.chatSessions)) { if ($c.msgs) { $msgs += @($c.msgs).Count } }
    $logs  = @($d.sessionLog).Count
    $notes = 0
    foreach ($v in @($d.lcProgress.PSObject.Properties.Value)) { if ($v.note) { $notes++ } }
    if (($msgs + $logs + $notes) -eq 0) { return }
    Write-Host "  note: this export carries $msgs chat message(s), $logs log entry(ies), $notes problem note(s)." -ForegroundColor Yellow
    Write-Host "        If this repo is public, so are they. Use a private repo if that matters." -ForegroundColor Yellow
}

function Invoke-SyncOnce {
    Move-ExportIntoRepo | Out-Null
    Warn-IfPersonal

    git add -A 2>&1 | Out-Null
    git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  nothing to sync" -ForegroundColor DarkGray
        return
    }

    $files = (git diff --cached --name-only) -join ', '
    $msg   = "sync: " + (Get-Date -Format 'yyyy-MM-dd HH:mm')
    git commit -q -m $msg
    if ($LASTEXITCODE -ne 0) { Write-Host "  commit failed" -ForegroundColor Red; return }

    git push -q
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  pushed ($files)" -ForegroundColor Green
    } else {
        Write-Host "  commit made, but push failed - run 'git push' yourself to see why" -ForegroundColor Red
    }
}

if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot '.git'))) {
    Write-Host "This folder is not a git repository." -ForegroundColor Red
    exit 1
}

if ($Watch) {
    Write-Host "Watching for new exports every $IntervalSeconds s. Press Ctrl+C to stop." -ForegroundColor Yellow
    while ($true) {
        if (Get-NewestExport) { Invoke-SyncOnce }
        Start-Sleep -Seconds $IntervalSeconds
    }
} else {
    Invoke-SyncOnce
}
