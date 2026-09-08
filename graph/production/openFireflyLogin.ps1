param(
  [Parameter(Mandatory = $true)]
  [string]$ChromePath,
  [Parameter(Mandatory = $true)]
  [string]$ProfileDir,
  [Parameter(Mandatory = $true)]
  [string]$Url
)

if (-not (Test-Path -LiteralPath $ChromePath -PathType Leaf)) {
  throw "Google Chrome não encontrado em $ChromePath"
}
New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null
$quotedProfile = '"' + $ProfileDir + '"'
$quotedUrl = '"' + $Url + '"'
$ErrorActionPreference = 'Stop'
$browser = Start-Process -FilePath $ChromePath -PassThru -ArgumentList @(
  "--user-data-dir=$quotedProfile",
  '--new-window',
  '--no-first-run',
  '--no-default-browser-check',
  $quotedUrl
)
$receipt = @{
  schema = 'hsl.firefly-login.v1'
  pid = $browser.Id
  startedAt = $browser.StartTime.ToUniversalTime().ToString('o')
  profileDir = (Resolve-Path -LiteralPath $ProfileDir).Path
}
$receiptPath = Join-Path $ProfileDir '.hsl-firefly-login.json'
$receipt | ConvertTo-Json | Set-Content -LiteralPath $receiptPath -Encoding UTF8
Write-Output 'Chrome Firefly aberto. Autentique e use Continuar episodio; o Matrix encerrara esta janela antes de validar a sessao.'
