$ErrorActionPreference = 'Stop'
$testProfile = Join-Path ([IO.Path]::GetTempPath()) ('hsl-login-test-' + [Guid]::NewGuid())
New-Item -ItemType Directory -Path $testProfile | Out-Null
$receiptPath = Join-Path $testProfile '.hsl-firefly-login.json'
$closeScript = Join-Path $PSScriptRoot '../closeFireflyLogin.ps1'
$self = Get-Process -Id $PID
$receipt = @{schema='hsl.firefly-login.v1'; pid=$PID; startedAt=$self.StartTime.ToUniversalTime().ToString('o'); profileDir=$testProfile}
function Expect-Rejection([string]$reason) {
  try { & $closeScript -ProfileDir $testProfile; throw 'EXPECTED_REJECTION_MISSING' }
  catch { if ($_.Exception.Message -notlike "*$reason*") { throw } }
  if (-not (Test-Path -LiteralPath $receiptPath)) { throw 'RECEIPT_EVIDENCE_LOST' }
  if (-not (Get-Process -Id $PID)) { throw 'UNRELATED_PROCESS_CLOSED' }
}
$receipt | ConvertTo-Json | Set-Content -LiteralPath $receiptPath -Encoding UTF8
Expect-Rejection 'FIREFLY_LOGIN_OWNER_UNVERIFIED'
$receipt.startedAt = '1900-01-01T00:00:00.0000000Z'
$receipt | ConvertTo-Json | Set-Content -LiteralPath $receiptPath -Encoding UTF8
Expect-Rejection 'FIREFLY_LOGIN_OWNER_CHANGED'
$receipt.profileDir = $testProfile + '-different'
$receipt | ConvertTo-Json | Set-Content -LiteralPath $receiptPath -Encoding UTF8
Expect-Rejection 'FIREFLY_LOGIN_RECEIPT_INVALID'
# No recursive cleanup, and never touch production Chrome/profile files.
Remove-Item -LiteralPath $receiptPath
Remove-Item -LiteralPath $testProfile
Write-Output 'FIREFLY_LOGIN_IDENTITY_TEST_OK (unrelated process, PID reuse, profile mismatch)'
