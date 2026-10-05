param([Parameter(Mandatory = $true)][string]$ProfileDir)
$ErrorActionPreference = 'Stop'
$receiptPath = Join-Path $ProfileDir '.hsl-firefly-login.json'
if (-not (Test-Path -LiteralPath $receiptPath)) { exit 0 }
$receipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
$resolvedProfile = (Resolve-Path -LiteralPath $ProfileDir).Path
if ($receipt.schema -ne 'hsl.firefly-login.v1' -or $receipt.profileDir -ne $resolvedProfile -or $receipt.pid -le 0) {
  throw 'FIREFLY_LOGIN_RECEIPT_INVALID'
}
$escapedProfile = [regex]::Escape($resolvedProfile)
$owner = Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$receipt.pid)"
if (-not $owner) {
  $owner = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object {
    $_.CommandLine -and
    $_.CommandLine -match "(?i)--user-data-dir=[`"']?$escapedProfile[`"']?(\s|$)" -and
    $_.CommandLine -notmatch '--type=|--remote-debugging' -and
    $_.CommandLine.Contains('https://firefly.adobe.com/generate/video')
  } | Select-Object -First 1
}
if ($owner) {
  $browser = Get-Process -Id $owner.ProcessId -ErrorAction SilentlyContinue
  if ($browser) {
    $hasProfile = $owner.CommandLine -match "(?i)--user-data-dir=[`"']?$escapedProfile[`"']?(\s|$)"
    if ($owner.Name -ne 'chrome.exe' -or -not $hasProfile -or
        $owner.CommandLine -match '--type=|--remote-debugging' -or
        -not $owner.CommandLine.Contains('https://firefly.adobe.com/generate/video')) {
      throw 'FIREFLY_LOGIN_OWNER_UNVERIFIED'
    }
    if (-not $browser.CloseMainWindow()) {
      $browser.Kill()
    } else {
      if (-not $browser.WaitForExit(8000)) {
        $browser.Kill()
      }
    }
    Write-Output "FIREFLY_LOGIN_CLOSED:$($owner.ProcessId)"
  }
}
Remove-Item -LiteralPath $receiptPath -Force -ErrorAction SilentlyContinue
