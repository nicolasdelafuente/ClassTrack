#Requires -Version 5.1
<#
.SYNOPSIS
  Crea la épica CT-E10 y tickets CT-081 / CT-082 en el tablero ClassTrack.
  Preferí usar .trello-board-ids.json (ya existente) si no hay env.
#>
$ErrorActionPreference = 'Stop'
$BoardId = if ($env:TRELLO_BOARD_ID) { $env:TRELLO_BOARD_ID } else { 'jizP2m9a' }
$Key = $env:TRELLO_API_KEY
$Token = $env:TRELLO_TOKEN
$Root = Join-Path $PSScriptRoot '..'

if (-not $Key -or -not $Token) {
  $idsFile = Join-Path $Root '.trello-board-ids.json'
  if (Test-Path $idsFile) {
    $ids = Get-Content $idsFile -Raw | ConvertFrom-Json
    $Key = $ids.k
    $Token = $ids.t
    if ($ids.b) { $BoardId = $ids.b }
  }
}

if (-not $Key -or -not $Token) {
  $envFile = Join-Path $Root '.trello-env'
  if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
      if ($_ -match '^\s*TRELLO_API_KEY=(.+)$') { $Key = $Matches[1].Trim().Trim('"') }
      if ($_ -match '^\s*TRELLO_TOKEN=(.+)$') { $Token = $Matches[1].Trim().Trim('"') }
    }
  }
}

if (-not $Key -or -not $Token) {
  Write-Error 'Faltan credenciales Trello (env, .trello-board-ids.json o .trello-env).'
}

function Invoke-Trello([string]$Method, [string]$Path, [hashtable]$Body = $null) {
  $uri = "https://api.trello.com/1$path"
  $sep = if ($Path.Contains('?')) { '&' } else { '?' }
  $uri = "$uri${sep}key=$Key&token=$Token"
  if ($Method -eq 'GET') {
    return Invoke-RestMethod -Method GET -Uri $uri
  }
  return Invoke-RestMethod -Method $Method -Uri $uri -Body $Body
}

$lists = Invoke-Trello GET "/boards/$BoardId/lists"
$epicas = ($lists | Where-Object { $_.name -match '^[ÉE]picas$' } | Select-Object -First 1).id
$porHacer = ($lists | Where-Object { $_.name -match 'Por hacer' } | Select-Object -First 1).id
if (-not $epicas -or -not $porHacer) {
  Write-Error "No encontré listas Épicas / Por hacer. Listas: $($lists.name -join ', ')"
}

$labels = Invoke-Trello GET "/boards/$BoardId/labels?limit=1000"
function LabelId([string]$Name) {
  ($labels | Where-Object { $_.name -eq $Name } | Select-Object -First 1).id
}
$idEpica = LabelId 'épica'
$idMvp = LabelId 'mvp'
$idInfra = LabelId 'infra'
$idDocs = LabelId 'docs'

$epicDesc = @"
Persistir logs estructurados de ClassTrack en archivo JSONL (además de stdout), con rotación, para no perder errores de BD / 500 al cerrar la terminal.

**Alcance**
- Sink a ``apps/api/logs/classtrack-api.jsonl``
- Rotación por tamaño
- Docs de consulta
- Sin pino/winston (logger propio)

Ver ``docs/trello-ct-e10-logs.md`` y ``docs/logging-policy.md``.
"@

$epic = Invoke-Trello POST '/cards' @{
  idList = $epicas
  name   = 'CT-E10 — Observabilidad: logs en archivo'
  desc   = $epicDesc
}
foreach ($lid in @($idEpica, $idMvp, $idInfra)) {
  if ($lid) { Invoke-Trello POST "/cards/$($epic.id)/idLabels" @{ value = $lid } | Out-Null }
}

$check = Invoke-Trello POST "/cards/$($epic.id)/checklists" @{ name = 'Tickets de la épica' }

function New-Ticket([string]$Name, [string]$Desc, [string[]]$LabelIds) {
  $card = Invoke-Trello POST '/cards' @{
    idList = $porHacer
    name   = $Name
    desc   = $Desc
  }
  foreach ($lid in $LabelIds) {
    if ($lid) { Invoke-Trello POST "/cards/$($card.id)/idLabels" @{ value = $lid } | Out-Null }
  }
  $itemName = "$Name — https://trello.com/c/$($card.shortLink)"
  Invoke-Trello POST "/checklists/$($check.id)/checkItems" @{ name = $itemName } | Out-Null
  return $card
}

$t81 = New-Ticket 'CT-081 — Sink de logs JSONL + rotación' @"
**Épica:** CT-E10

Implementar escritura durable de eventos ``AppLogger`` / ``AuditLogger`` a ``apps/api/logs/classtrack-api.jsonl`` (JSON lines), con rotación por tamaño y flags ``LOG_TO_FILE`` / ``LOG_DIR``.

## Criterio de hecho
- Error de BD / 500 queda en el archivo aunque se cierre la terminal
- ``LOG_TO_FILE=0`` desactiva el archivo
- tests de append + rotación
"@ @($idMvp, $idInfra)

$t82 = New-Ticket 'CT-082 — Docs: cómo ver logs y errores de BD' @"
**Épica:** CT-E10

Documentar en ``logging-policy`` / ``.env.example`` cómo abrir y filtrar ``classtrack-api.jsonl``.

## Criterio de hecho
- Instrucciones PowerShell claras
- Variables de entorno documentadas
"@ @($idMvp, $idDocs)

Write-Output "Épica: https://trello.com/c/$($epic.shortLink)"
Write-Output "CT-081: https://trello.com/c/$($t81.shortLink)"
Write-Output "CT-082: https://trello.com/c/$($t82.shortLink)"
