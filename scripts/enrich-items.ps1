param(
  [string]$InstancePath = "C:\Users\dafyd\curseforge\minecraft\Instances\All the Mods 10 - ATM10",
  [string]$DataPath = "C:\Users\dafyd\atm10-mod-guide\data\mods.json"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Read-ZipEntryText {
  param($Entry)
  $stream = $Entry.Open()
  try {
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8)
    try {
      return $reader.ReadToEnd()
    } finally {
      $reader.Dispose()
    }
  } finally {
    $stream.Dispose()
  }
}

function Get-JsonObject {
  param([string]$Text)
  try {
    return $Text | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Get-RecipeResultIds {
  param($Recipe)
  $ids = New-Object System.Collections.Generic.List[string]

  function Add-ResultValue {
    param($Value)
    if ($null -eq $Value) { return }
    if ($Value -is [string]) {
      if ($Value -match "^[a-z0-9_.-]+:[a-z0-9_./-]+$") { $ids.Add($Value) }
      return
    }
    if ($Value.id) { Add-ResultValue $Value.id }
    if ($Value.item) { Add-ResultValue $Value.item }
  }

  Add-ResultValue $Recipe.result
  Add-ResultValue $Recipe.output
  Add-ResultValue $Recipe.item
  if ($Recipe.results) {
    foreach ($result in $Recipe.results) { Add-ResultValue $result }
  }
  return @($ids | Select-Object -Unique)
}

function Get-ShortRecipeType {
  param([string]$RecipeType)
  if ([string]::IsNullOrWhiteSpace($RecipeType)) { return "recipe" }
  return ($RecipeType -replace "^minecraft:", "" -replace "^forge:", "" -replace "^neoforge:", "" -replace "^.+:", "") -replace "_", " "
}

function Get-ItemPurpose {
  param([string]$Name, [string]$Id, [string]$Kind, [string]$Topic)
  $text = "$Name $Id".ToLowerInvariant()

  if ($text -match "spawn_egg|spawn egg") { return "Spawns the matching mob, mainly for creative testing, maps, or admin use." }
  if ($text -match "bucket") { return "Holds or places a fluid from this mod; also works as a crafting or machine input when JEI/EMI shows it." }
  if ($text -match "ingot|nugget|dust|gem|crystal|shard|plate|gear|rod|wire|coil|alloy|essence|component|circuit|processor|frame|casing") { return "Crafting or processing material used in this mod's recipes and upgrade chains." }
  if ($text -match "seed|sapling|spore") { return "Growable resource or plant entry; use farmland, pots, bees, or the mod's growth rules as shown in JEI/EMI." }
  if ($text -match "upgrade|augment|module|card|pattern") { return "Upgrade or configuration part that changes a machine, tool, storage block, or network behavior." }
  if ($text -match "sword|axe|pickaxe|shovel|hoe|bow|helmet|chestplate|leggings|boots|armor|shield|tool") { return "Equipment item; compare stats, durability, enchantability, and repair material before committing resources." }
  if ($text -match "manual|guide|book|lexicon|tome|notebook") { return "In-game documentation item; read it first for this mod's intended progression." }
  if ($text -match "machine|generator|furnace|crusher|press|infuser|assembler|controller|terminal|drive|tank|cell|pipe|cable|duct|conduit") { return "Functional block for automation, storage, power, fluids, or item processing." }
  if ($Kind -eq "block") {
    if ($Topic -eq "Building & Decoration") { return "Placeable decorative/building block, usually part of a larger block family or palette." }
    return "Placeable block from this mod; it may be decorative, functional, or a recipe ingredient depending on JEI/EMI uses."
  }
  return "Mod item; use JEI/EMI's recipe and usage views to see its exact role in ATM10."
}

function Get-AcquisitionText {
  param($RecipeInfo, [string]$Name, [string]$Id, [string]$Kind)
  $text = "$Name $Id".ToLowerInvariant()
  if ($RecipeInfo) {
    $types = @($RecipeInfo.types | Select-Object -First 3) -join ", "
    return "Craft or process it with $types. Press R on the item in JEI/EMI for the exact ATM10 recipe."
  }
  if ($text -match "spawn_egg|spawn egg") { return "Usually creative/admin only unless a pack recipe or loot table adds it." }
  if ($text -match "ore") { return "Find it through world generation or mining if enabled; confirm biome/dimension rules with JEI/EMI or the mod docs." }
  if ($text -match "seed|sapling|spore") { return "Obtain through drops, crafting, market/trading, mutations, or the mod's progression system; check JEI/EMI recipes and uses." }
  if ($text -match "bee") { return "Usually obtained through bee breeding, conversion, nests, or spawn items; check Productive Bees-style JEI entries when relevant." }
  if ($Kind -eq "block") { return "Acquire through crafting, stonecutting, loot, worldgen, or creative depending on the block; JEI/EMI is the final recipe source." }
  return "No direct recipe was found in this jar; check JEI/EMI for loot, mob drops, worldgen, trading, tags, or pack-added recipes."
}

function Get-UseText {
  param([string]$Name, [string]$Id, [string]$Kind, [string]$Topic)
  $text = "$Name $Id".ToLowerInvariant()
  if ($text -match "manual|guide|book|lexicon|tome|notebook") { return "Right-click/open it and follow the mod's in-game entries." }
  if ($text -match "upgrade|augment|module|card|pattern") { return "Insert it into the matching block, tool, or network UI; press U in JEI/EMI to find compatible uses." }
  if ($text -match "bucket") { return "Right-click to place/pick up fluid, or pipe it into machines and recipes that accept that fluid." }
  if ($text -match "seed|sapling|spore") { return "Plant or place it under the required growth conditions, then automate harvesting once stable." }
  if ($text -match "machine|generator|crusher|press|infuser|assembler|controller|terminal|drive|tank|cell") { return "Place it, provide required power/items/fluids, configure sides if available, and use JEI/EMI recipes to feed it." }
  if ($text -match "pipe|cable|duct|conduit") { return "Place between inventories, machines, tanks, or energy blocks; configure filters and directions before scaling." }
  if ($Kind -eq "block") { return "Place it in-world; press U in JEI/EMI to see recipes, multiblock roles, or crafting uses." }
  if ($Topic -eq "Magic") { return "Use it as part of the mod's crafting, spell, ritual, or progression chain; check the guide book when present." }
  if ($Topic -eq "Tech") { return "Use it in crafting or automation chains; press U in JEI/EMI to see machines and recipes that consume it." }
  return "Press U in JEI/EMI to see every recipe, machine, or crafting use in this ATM10 version."
}

function Read-ModItemsFromJar {
  param($Mod, [string]$JarPath)
  $itemsById = @{}
  $recipesByResult = @{}

  $zip = [System.IO.Compression.ZipFile]::OpenRead($JarPath)
  try {
    $langEntries = @($zip.Entries | Where-Object { $_.FullName -match "^assets/[^/]+/lang/en_us\.json$" })
    foreach ($entry in $langEntries) {
      $namespace = ($entry.FullName -split "/")[1]
      if ($Mod.modId -and $namespace -ne $Mod.modId) {
        # Many jars bundle helper assets. Keep the owning namespace tight when the mod id is known.
        continue
      }

      $json = Get-JsonObject (Read-ZipEntryText $entry)
      if ($null -eq $json) { continue }

      foreach ($property in $json.PSObject.Properties) {
        $key = [string]$property.Name
        if ($key -notmatch "^(item|block)\.$([regex]::Escape($namespace))\.([a-z0-9_./-]+)$") { continue }
        $localId = $Matches[2]
        if ($localId -match "\.") { continue }
        $id = "$namespace`:$localId"
        if (-not $itemsById.ContainsKey($id)) {
          $itemsById[$id] = [ordered]@{
            id = $id
            name = [string]$property.Value
            type = $Matches[1]
          }
        }
      }
    }

    $recipeEntries = @($zip.Entries | Where-Object { $_.FullName -match "^data/[^/]+/recipes?/.*\.json$" })
    foreach ($entry in $recipeEntries) {
      $recipe = Get-JsonObject (Read-ZipEntryText $entry)
      if ($null -eq $recipe) { continue }
      $resultIds = @(Get-RecipeResultIds $recipe)
      if ($resultIds.Count -eq 0) { continue }
      $recipeType = Get-ShortRecipeType $recipe.type
      foreach ($resultId in $resultIds) {
        if (-not $recipesByResult.ContainsKey($resultId)) {
          $recipesByResult[$resultId] = @{
            types = New-Object System.Collections.Generic.List[string]
            files = New-Object System.Collections.Generic.List[string]
          }
        }
        if (-not $recipesByResult[$resultId].types.Contains($recipeType)) {
          $recipesByResult[$resultId].types.Add($recipeType)
        }
        if ($recipesByResult[$resultId].files.Count -lt 5) {
          $recipesByResult[$resultId].files.Add($entry.FullName)
        }
      }
    }
  } finally {
    $zip.Dispose()
  }

  $items = @()
  foreach ($key in ($itemsById.Keys | Sort-Object)) {
    $base = $itemsById[$key]
    $recipeInfo = $recipesByResult[$key]
    $items += [PSCustomObject][ordered]@{
      id = $base.id
      name = $base.name
      type = $base.type
      purpose = Get-ItemPurpose $base.name $base.id $base.type $Mod.topic
      acquire = Get-AcquisitionText $recipeInfo $base.name $base.id $base.type
      use = Get-UseText $base.name $base.id $base.type $Mod.topic
      recipeTypes = if ($recipeInfo) { @($recipeInfo.types | Select-Object -First 6) } else { @() }
      recipeFiles = if ($recipeInfo) { @($recipeInfo.files | Select-Object -First 5) } else { @() }
    }
  }

  return @($items)
}

$data = Get-Content -Raw $DataPath | ConvertFrom-Json
$modsPath = Join-Path $InstancePath "mods"
$totalItems = 0
$modsWithItems = 0

foreach ($mod in $data.mods) {
  if ($mod.type -ne "mod" -or [string]::IsNullOrWhiteSpace($mod.installedFile)) {
    $mod | Add-Member -NotePropertyName items -NotePropertyValue @() -Force
    $mod | Add-Member -NotePropertyName itemCount -NotePropertyValue 0 -Force
    continue
  }

  $jarPath = Join-Path $modsPath $mod.installedFile
  if (-not (Test-Path -LiteralPath $jarPath)) {
    $mod | Add-Member -NotePropertyName items -NotePropertyValue @() -Force
    $mod | Add-Member -NotePropertyName itemCount -NotePropertyValue 0 -Force
    continue
  }

  try {
    $items = @(Read-ModItemsFromJar $mod $jarPath)
    $mod | Add-Member -NotePropertyName items -NotePropertyValue $items -Force
    $mod | Add-Member -NotePropertyName itemCount -NotePropertyValue $items.Count -Force
    if ($items.Count -gt 0) {
      $modsWithItems += 1
      $totalItems += $items.Count
    }
    Write-Host "$($mod.name): $($items.Count) items/blocks"
  } catch {
    Write-Warning "Could not read items from $($mod.name): $($_.Exception.Message) $($_.ScriptStackTrace)"
    $mod | Add-Member -NotePropertyName items -NotePropertyValue @() -Force
    $mod | Add-Member -NotePropertyName itemCount -NotePropertyValue 0 -Force
  }
}

$data.pack.counts | Add-Member -NotePropertyName itemEntries -NotePropertyValue $totalItems -Force
$data.pack.counts | Add-Member -NotePropertyName modsWithItemEntries -NotePropertyValue $modsWithItems -Force
$data.pack | Add-Member -NotePropertyName itemDataGeneratedAt -NotePropertyValue ([DateTimeOffset]::UtcNow.ToString("o")) -Force

$json = $data | ConvertTo-Json -Depth 30
[System.IO.File]::WriteAllText($DataPath, "$json`n", [System.Text.Encoding]::UTF8)

Write-Host "Added $totalItems item/block entries across $modsWithItems mods."
