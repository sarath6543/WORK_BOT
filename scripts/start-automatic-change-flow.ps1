param(
  [switch]$AutoPush
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$logDir = Join-Path $root "logs"

function Test-LocalPort {
  param([int]$Port)

  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $result = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    if (-not $result.AsyncWaitHandle.WaitOne(500)) {
      return $false
    }

    $client.EndConnect($result)
    return $true
  }
  catch {
    return $false
  }
  finally {
    $client.Close()
  }
}

Push-Location $root
try {
  New-Item -ItemType Directory -Force $logDir | Out-Null
  $env:CR_AUTO_PUSH = if ($AutoPush) { "1" } else { "0" }

  if (-not (Test-LocalPort -Port 8787)) {
    Start-Process `
      -WindowStyle Hidden `
      -FilePath "node" `
      -ArgumentList ".\scripts\change-request-server.js" `
      -WorkingDirectory $root `
      -RedirectStandardOutput (Join-Path $logDir "change-request-server.out.log") `
      -RedirectStandardError (Join-Path $logDir "change-request-server.err.log")
  }

  Start-Process `
    -WindowStyle Hidden `
    -FilePath "node" `
    -ArgumentList ".\scripts\auto-change-request-worker.js" `
    -WorkingDirectory $root `
    -RedirectStandardOutput (Join-Path $logDir "auto-change-request-worker.out.log") `
    -RedirectStandardError (Join-Path $logDir "auto-change-request-worker.err.log")

  Write-Host "Change request server: http://127.0.0.1:8787/change-request"
  Write-Host "Automatic worker: running"
  Write-Host "Auto push:" $(if ($AutoPush) { "enabled" } else { "disabled" })
  Write-Host "Logs:" $logDir
}
finally {
  Pop-Location
}
