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

  if ($text -match "spawn_egg|spawn egg") { return "Spawns the matching mob directly, mostly for creative mode, testing, maps, or server admin work." }
  if ($text -match "music_disc|music disc") { return "Music disc that plays its track in a jukebox." }
  if ($text -match "bucket") { return "Portable fluid container used to place, pick up, transport, or craft with the named fluid." }
  if ($text -match "fluid_tank|fluid tank|dynamic_tank|dynamic tank") { return "Stores fluid in-world and connects to compatible pipes, machines, or multiblock systems." }
  if ($text -match "energy_cube|energy cube|capacitor|battery|energy_cell|energy cell|flux_storage|power cell|induction_cell|induction provider") { return "Stores energy as a buffer so machines, tools, or networks keep running when generation fluctuates." }
  if ($text -match "generator|dynamo|reactor|turbine|solar_panel|thermo|bio[-_ ]?generator|wind_generator|heat_generator|gas.burning|fission|fusion") { return "Generates power or is part of a power-generation chain for machines and automation." }
  if ($text -match "pipe|cable|duct|conduit|transporter|tube|mechanical_pipe|pressurized_tube|logistical_transporter|universal_cable|smart cable|covered cable|glass cable|dense cable") { return "Transfers resources between blocks, such as items, fluids, gases, energy, redstone signals, or network channels." }
  if ($text -match "controller|terminal|grid|drive|interface|import_bus|export_bus|storage_bus|pattern_provider|crafting_monitor|requester") { return "Network block used to access, store, import, export, or automate items inside a storage/crafting system." }
  if ($text -match "storage_cell|cell_housing|crafting_storage|portable_cell|disk|drive") { return "Digital storage component that holds items, fluids, chemicals, or autocrafting data inside a storage network." }
  if ($text -match "processor|printed_|logic_processor|calculation_processor|engineering_processor|circuit|control_circuit|basic_coil|advanced_coil|coil|electron_tube|precision_mechanism|mechanism") { return "Intermediate component used to craft machines, network parts, upgrades, and higher-tier automation blocks." }
  if ($text -match "pattern|template|blueprint|schematic") { return "Stores a recipe, layout, or crafting instruction so machines or players can reproduce it." }
  if ($text -match "upgrade|augment|module|card|addon|speed|capacity|range|stack|filter|void|magnet|pickup|feeding") { return "Upgrade part that changes capacity, speed, filtering, range, transfer behavior, or utility features of a compatible block/tool." }
  if ($text -match "configurator|wrench|hammer|gadget|wand|linker|binder|tuner|remote|key") { return "Utility tool used to configure, rotate, link, copy, bind, tune, or remotely control modded blocks." }
  if ($text -match "ingot|nugget|dust|gem|crystal|shard|plate|gear|rod|wire|alloy|essence|component|frame|casing|sheet|mesh|clump|dirty_dust|slurry|pellet") { return "Crafting or processing material that moves the mod's progression chain toward machines, tools, upgrades, or resource production." }
  if ($text -match "ore|raw_|deepslate_.*ore|nether_.*ore|end_.*ore") { return "World resource block or raw resource that is mined and processed into usable crafting materials." }
  if ($text -match "seed|sapling|spore|crop|fruit|bean|berry") { return "Growable resource that produces food, plants, wood, essence, or crafting ingredients when planted under the right conditions." }
  if ($text -match "comb|honey|bee_|bee |hive|nest|gene|spawn_egg") { return "Bee-related item or block used for bee housing, breeding, genetics, resource production, or comb processing." }
  if ($text -match "food|meal|soup|stew|sandwich|burger|pie|cake|cookie|juice|tea|coffee|smoothie|salad|toast|cheese|sushi|curry|noodle|pasta|pizza") { return "Food or drink item that restores hunger/saturation and may be part of cooking or nutrition progression." }
  if ($text -match "helmet|chestplate|leggings|boots|armor|shield") { return "Defensive equipment worn or held to improve protection, survivability, or special combat utility." }
  if ($text -match "(^|[_\s:-])(sword|bow|crossbow|trident|knife|mace|dagger|spear)([_\s:-]|$)") { return "Weapon used for melee or ranged combat, often with modded damage, durability, effects, or upgrade paths." }
  if ($text -match "pickaxe|shovel|hoe|axe|hammer|excavator|paxel|saw") { return "Tool used to mine, dig, chop, till, or process blocks faster than bare hands or vanilla tools." }
  if ($text -match "staff|scepter|wand") { return "Held magic or utility tool used to cast effects, trigger abilities, configure blocks, or interact with mod systems." }
  if ($text -match "manual|guide|book|lexicon|tome|notebook|codex|journal") { return "In-game documentation item that explains recipes, progression, mechanics, or lore for its mod." }
  if ($text -match "source_jar|source jar") { return "Stores Ars Nouveau Source so nearby devices, rituals, automation blocks, and spell systems can draw magical power." }
  if ($text -match "sourcelink") { return "Generates Ars Nouveau Source from a specific activity or resource and sends it into nearby source storage." }
  if ($text -match "glyph|spell|scroll|focus|ritual|mana|rune|reagent|charm|amulet|ring|relic|artifact") { return "Magic progression item used for spells, rituals, mana/source handling, magical crafting, or wearable effects." }
  if ($text -match "machine|factory|furnace|crusher|press|infuser|assembler|enricher|smelter|sawmill|pulverizer|macerator|mixer|centrifuge|separator|washer|purifier|injector|dissolution|combiner|compressor|crafter") { return "Functional processing block that transforms inputs into outputs for automation, crafting, smelting, crushing, mixing, or resource refinement." }
  if ($text -match "shaft|cogwheel|gearbox|belt|depot|chute|funnel|basin|mixer|millstone|crushing_wheel|encased_fan|blaze_burner|deployer|contraption|train|bogey|track") { return "Create-style kinetic component used to move rotation, process items, build contraptions, or automate factory lines." }
  if ($text -match "door|trapdoor|window|roof|stair|slab|wall|fence|bridge|lamp|lantern|chair|table|sofa|cabinet|shelf|sign|panel|pillar|brick|tiles|glass|frame|trim|plank|beam") { return "Building or decoration piece used to shape bases, villages, machines rooms, roads, interiors, or themed builds." }
  if ($Topic -eq "Building & Decoration" -and $text -match "barrel|chest|crate|cabinet|shelf|locker") { return "Decorative storage-themed building block used for interiors, workshops, villages, or themed base detailing." }
  if ($text -match "drawer|barrel|chest|crate|cabinet|shelf|locker|backpack|bag|pouch|tank|bin") { return "Storage block or portable container used to hold items, fluids, or resources with mod-specific capacity and upgrade behavior." }
  if ($text -match "portal|waystone|teleporter|elevator|anchor|warp|tempad|tablet") { return "Travel or teleportation item/block used to move players, connect locations, or manage fast travel." }
  if ($text -match "spawner|mob|dna|prediction|model|simulation|loot_fabricator|swab|feed") { return "Mob/resource automation item used to spawn, simulate, collect, or convert mob drops." }
  if ($text -match "map|compass|scanner|locator|analyzer|meter|probe") { return "Information tool used to locate structures/resources, inspect blocks, analyze networks, or measure world data." }
  if ($text -match "coin|currency|ticket|token|trophy|statue|plush|painting|banner") { return "Collectible, reward, decoration, or progression marker rather than a core machine component." }
  if ($Kind -eq "block") {
    if ($Topic -eq "Building & Decoration") { return "Placeable decorative/building block, usually part of a larger block family or palette." }
    if ($Topic -eq "World & Exploration") { return "World, dungeon, biome, structure, or dimension block used as terrain, loot, progression, or decoration." }
    if ($Topic -eq "Storage") { return "Placeable storage or logistics block used to hold, expose, move, or organize resources." }
    if ($Topic -eq "Tech") { return "Placeable tech block used as a machine part, automation component, casing, frame, or infrastructure block." }
    if ($Topic -eq "Magic") { return "Placeable magic block used in rituals, spell systems, magical crafting, resource storage, or themed building." }
    return "Placeable block with a role in building, automation, crafting, world content, or mod progression."
  }
  if ($Topic -eq "Library / Dependency") { return "Internal support item from a dependency mod; it normally exists for compatibility, testing, or another mod's systems." }
  if ($Topic -eq "QoL & UI") { return "Utility item tied to interface, configuration, mapping, shortcuts, or client-side quality-of-life features." }
  if ($Topic -eq "Performance & Rendering") { return "Rendering or visual-system item, usually present for configuration, compatibility, or resource-pack/shader support." }
  if ($Topic -eq "Farming & Resources") { return "Resource, crop, drop, or farming item used to produce materials, food, or crafting inputs." }
  if ($Topic -eq "World & Exploration") { return "Exploration item tied to mobs, structures, biomes, dimensions, loot, or adventure progression." }
  if ($Topic -eq "Storage") { return "Storage or logistics item used to move, hold, filter, upgrade, or access resources." }
  if ($Topic -eq "Tech") { return "Technology item used in machines, automation, power, transport, or multi-step crafting chains." }
  if ($Topic -eq "Magic") { return "Magic item used for spellcraft, rituals, magical resources, artifacts, or progression." }
  return "General mod item used as content, crafting material, utility gear, loot, or progression within its mod."
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
