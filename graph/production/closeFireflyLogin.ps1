param([Parameter(Mandatory = $true)][string]$ProfileDir)
$ErrorActionPreference = 'Stop'
$receiptPath = Join-Path $ProfileDir '.hsl-firefly-login.json'
if (-not (Test-Path -LiteralPath $receiptPath)) { exit 0 }
$receipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
$resolvedProfile = (Resolve-Path -LiteralPath $ProfileDir).Path
if ($receipt.schema -ne 'hsl.firefly-login.v1' -or $receipt.profileDir -ne $resolvedProfile -or $receipt.pid -le 0) {
  throw 'FIREFLY_LOGIN_RECEIPT_INVALID'
}
$owner = Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$receipt.pid)"
if ($owner) {
  $browser = Get-Process -Id $owner.ProcessId -ErrorAction Stop
  # PID reuse must never close a different browser/process.
  if ($browser.StartTime.ToUniversalTime().ToString('o') -ne $receipt.startedAt) {
    throw 'FIREFLY_LOGIN_OWNER_CHANGED'
  }
  $profileArgument = '--user-data-dir="' + $resolvedProfile + '"'
  if ($owner.Name -ne 'chrome.exe' -or -not $owner.CommandLine.Contains($profileArgument) -or
      $owner.CommandLine -match '--type=|--remote-debugging' -or
      -not $owner.CommandLine.Contains('https://firefly.adobe.com/generate/video')) {
    throw 'FIREFLY_LOGIN_OWNER_UNVERIFIED'
  }
  if (-not $browser.CloseMainWindow()) { throw 'FIREFLY_LOGIN_CLOSE_REQUIRED:feche a janela de login Firefly e retome' }
  if (-not $browser.WaitForExit(15000)) { throw 'FIREFLY_LOGIN_CLOSE_TIMEOUT:feche a janela de login Firefly e retome' }
  Write-Output "FIREFLY_LOGIN_CLOSED:$($owner.ProcessId)"
}
Remove-Item -LiteralPath $receiptPath
