$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$logPath = Join-Path $workspace "localtunnel.log"

if (-not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) {
    throw "npx.cmd was not found. Install Node.js before starting the tunnel."
}

if (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 5678 -InformationLevel Quiet)) {
    throw "n8n is not reachable on 127.0.0.1:5678. Start n8n before starting the tunnel."
}

if (Test-Path $logPath) {
    Remove-Item $logPath -Force
}

Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npx.cmd localtunnel --port 5678 > `"$logPath`" 2>&1" `
    -WindowStyle Hidden

for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1

    if (Test-Path $logPath) {
        $content = Get-Content $logPath -Raw
        if ($content -match "https://[^\s]+") {
            $baseUrl = $matches[0]
            Write-Output "Tunnel URL: $baseUrl"
            Write-Output "GitHub secret N8N_WEBHOOK_URL value: $baseUrl/webhook/github-ci"
            exit 0
        }
    }
}

Write-Output "Tunnel started, but no URL was found yet. Check $logPath."
exit 1

