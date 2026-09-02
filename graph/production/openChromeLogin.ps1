param(
  [string]$Url = 'https://smith.langchain.com/studio'
)

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path -LiteralPath $chrome)) {
  throw "Google Chrome não encontrado em $chrome"
}

$profile = Join-Path $env:LOCALAPPDATA 'HSLVideoStudio\ChromeProfile'
New-Item -ItemType Directory -Force -Path $profile | Out-Null
Start-Process -FilePath $chrome -ArgumentList @("--user-data-dir=$profile", '--no-first-run', $Url)
Write-Output "Chrome aberto. O login ficará salvo em: $profile"
