const fs = require("fs");
const path = require("path");

const DEFAULT_INSTANCE =
  "C:/Users/dafyd/curseforge/minecraft/Instances/All the Mods 10 - ATM10";

const instancePath = process.env.ATM10_INSTANCE || process.argv[2] || DEFAULT_INSTANCE;
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(instancePath, "manifest.json");
const instanceJsonPath = path.join(instancePath, "minecraftinstance.json");
const cachePath = path.join(
  instancePath,
  "local",
  "crash_assistant",
  "mod_data_cache_v4"
);

const USER_AGENT = "atm10-mod-guide/1.0 (local static website generator)";

const topicRules = [
  {
    key: "Tech",
    words: [
      "mekanism",
      "applied energistics",
      "ae2",
      "create",
      "thermal",
      "industrial",
      "rftools",
      "xnet",
      "powah",
      "ender io",
      "factory",
      "machine",
      "energy",
      "pipe",
      "flux",
      "generator",
    ],
  },
  {
    key: "Magic",
    words: [
      "ars",
      "occultism",
      "forbidden",
      "theurgy",
      "irons",
      "spell",
      "apoth",
      "blood",
      "reliquary",
      "roots",
      "evilcraft",
    ],
  },
  {
    key: "Storage",
    words: [
      "storage",
      "backpack",
      "drawer",
      "sophisticated",
      "functional",
      "refined",
      "import",
      "export",
      "tesseract",
      "ender chest",
    ],
  },
  {
    key: "World & Exploration",
    words: [
      "biome",
      "dungeon",
      "structure",
      "yung",
      "twilight",
      "aether",
      "undergarden",
      "bumblezone",
      "cataclysm",
      "blue skies",
      "eternal starlight",
      "deeper",
      "ad astra",
      "village",
    ],
  },
  {
    key: "Building & Decoration",
    words: [
      "chipped",
      "rechiseled",
      "decoration",
      "furniture",
      "light",
      "building",
      "framed",
      "macaw",
      "supplementaries",
      "copycats",
    ],
  },
  {
    key: "Farming & Resources",
    words: [
      "bee",
      "agriculture",
      "crop",
      "botany",
      "farm",
      "chicken",
      "resource",
      "ore",
      "mystical",
      "productive",
    ],
  },
  {
    key: "QoL & UI",
    words: [
      "jei",
      "emi",
      "jade",
      "journey",
      "map",
      "inventory",
      "mouse",
      "tooltip",
      "search",
      "configured",
      "trash",
      "toast",
      "client",
    ],
  },
  {
    key: "Library / Dependency",
    words: [
      "lib",
      "library",
      "api",
      "core",
      "architectury",
      "cloth",
      "kotlin",
      "caelus",
      "citadel",
      "geckolib",
      "placebo",
      "moonlight",
      "resourceful",
      "balm",
    ],
  },
  {
    key: "Performance & Rendering",
    words: [
      "sodium",
      "iris",
      "embeddium",
      "modernfix",
      "spark",
      "shader",
      "oculus",
      "fps",
      "render",
      "dynamic fps",
    ],
  },
];

const majorGuides = [
  {
    match: ["applied energistics", "ae2"],
    title: "Applied Energistics 2 starter route",
    steps: [
      "Find certus quartz, fluix materials, and presses before building a permanent base network.",
      "Start with an Energy Acceptor, ME Controller if needed by the pack config, ME Drive, storage cells, Crafting Terminal, and cables.",
      "Use JEI/EMI to follow processor and printed circuit recipes, then automate those recipes early.",
      "After storage works, add import/export buses, pattern providers, molecular assemblers, and subnetworks for automation.",
      "Keep channels, power, and cable color separation visible so later machine rooms do not become hard to debug.",
    ],
  },
  {
    match: ["mekanism"],
    title: "Mekanism progression route",
    steps: [
      "Begin with basic generators, metallurgic infusers, enrichment chambers, and universal cables.",
      "Upgrade ore processing in stages: enrichment, purification, injection, crystallization, and dissolution lines.",
      "Use gas pipes and chemical tanks deliberately; most Mekanism problems are missing gases, wrong side configs, or no power.",
      "Move into digital miner, induction matrix, fission, and fusion once stable power and waste handling are solved.",
      "For reactors, build containment and test the full fuel and coolant chain before running at high burn rates.",
    ],
  },
  {
    match: ["create"],
    title: "Create progression route",
    steps: [
      "Start with water wheels or windmills, shafts, gearboxes, belts, depots, and mechanical presses.",
      "Use ponder/tutorial views in-game whenever available; they are the fastest way to understand contraptions.",
      "Build compact lines for crushing, washing, pressing, mixing, and deploying before building large factories.",
      "Watch stress units and rotation direction; gearboxes, clutches, and speed controllers solve most routing issues.",
      "Use trains, contraptions, and Create add-ons after core processing is reliable.",
    ],
  },
  {
    match: ["ars nouveau"],
    title: "Ars Nouveau progression route",
    steps: [
      "Craft the worn notebook and use it as the main in-game manual.",
      "Start with basic glyphs, mana regeneration, source generation, and simple spell books.",
      "Automate source with jars, relays, agronomic sourcelinks, and wixies before scaling rituals or spell turrets.",
      "Use armor perks and spell modifiers to specialize for mining, mobility, combat, or automation.",
      "In ATM10, compare Ars automation with tech mods when deciding whether a farm should use magic, machines, or both.",
    ],
  },
  {
    match: ["productive bees"],
    title: "Productive Bees progression route",
    steps: [
      "Start with vanilla bees, nests, treats, cages, and basic hives.",
      "Use JEI/EMI to check each bee's breeding or conversion method and its required flower/block.",
      "Build simulation upgrades, bottlers, centrifuges, and gene tools once basic production works.",
      "Keep bees organized by resource tier and automate comb processing before expanding to rare bees.",
      "Use the official wiki for mutation details because individual bee requirements change between versions.",
    ],
  },
  {
    match: ["minecolonies"],
    title: "MineColonies progression route",
    steps: [
      "Place the supply camp or ship, town hall, builder hut, and warehouse/courier chain first.",
      "Keep the builder supplied with tools, food, and requested blocks before adding more work buildings.",
      "Expand with lumberjack, miner, farmer, guard, and university in an order that supports colony needs.",
      "Use building levels and research to unlock better speed, recipes, and citizen capabilities.",
      "Give the colony room; pathing, housing, and worker travel distance matter more as the settlement grows.",
    ],
  },
  {
    match: ["mystical agriculture"],
    title: "Mystical Agriculture progression route",
    steps: [
      "Start with inferium seeds, essence farmland, and a reliable harvesting setup.",
      "Upgrade essence tiers and farmland tiers before investing in many high-tier resource seeds.",
      "Use growth accelerators, watering tools, or compatible automation to scale production.",
      "Route essence into compact storage and autocrafting so resources become passive inputs for other mods.",
      "Check ATM10 recipe changes in JEI/EMI because pack scripts often rebalance seed costs.",
    ],
  },
  {
    match: ["sophisticated backpacks", "sophisticated storage"],
    title: "Sophisticated storage progression route",
    steps: [
      "Upgrade early backpacks with pickup, filter, stack, feeding, and void upgrades as needed.",
      "For base storage, use barrels/chests with controller-style access and filter upgrades where available.",
      "Separate personal inventory utility from bulk base storage so upgrades do not fight each other.",
      "Use compacting, crafting, and compression upgrades for resources that appear in many variants.",
      "Back up important gear before experimenting with destructive filters or void settings.",
    ],
  },
  {
    match: ["powah"],
    title: "Powah progression route",
    steps: [
      "Start with thermo generators, energy cells, cables, and basic crystals.",
      "Upgrade power tiers as your machines exceed the output of early generators.",
      "Use energizing rods and an energizing orb for crystal and component crafting.",
      "Place wireless energy tools after the base has stable generation and buffer capacity.",
      "Compare reactor fuel costs against Mekanism, Extreme Reactors, or other ATM10 power options.",
    ],
  },
  {
    match: ["industrial foregoing"],
    title: "Industrial Foregoing progression route",
    steps: [
      "Start with latex production, dissolution chamber recipes, and basic machine frames.",
      "Use plant gatherers/sowers, mob machines, and fluid handling as your first practical automation.",
      "Add range upgrades carefully so farms do not create lag or harvest unintended areas.",
      "Route outputs through drawers, AE2, or other bulk storage before scaling farms.",
      "Use JEI/EMI for machine additives and special recipes; many machines have non-obvious fluid inputs.",
    ],
  },
  {
    match: ["silent gear"],
    title: "Silent Gear progression route",
    steps: [
      "Use the in-game guide and JEI/EMI to inspect material traits before crafting expensive parts.",
      "Start with simple tools, then upgrade with better main parts, rods, bindings, coatings, and tip upgrades.",
      "Prioritize durability, mining speed, harvest tier, and repair access over raw damage early.",
      "Save strong materials for gear you will keep, not temporary tools.",
      "Compare Silent Gear options against allthemodium and other ATM10 gear paths before committing rare materials.",
    ],
  },
  {
    match: ["twilight forest"],
    title: "Twilight Forest progression route",
    steps: [
      "Create the portal, enter with food and basic gear, and follow the biome/boss progression gates.",
      "Use the magic map and boss structures to move from Naga to Lich and later bosses.",
      "Respect progression locks; if an area punishes you, a previous boss or trophy requirement is likely missing.",
      "Bring storage and waystones or other teleport tools because dungeon loot volume is high.",
      "Check official docs/wiki for boss order if ATM10 config changes make progression unclear.",
    ],
  },
  {
    match: ["cataclysm"],
    title: "Cataclysm progression route",
    steps: [
      "Treat this as late exploration/combat content unless you already have strong armor and recovery tools.",
      "Use structure maps or exploration tools to find bosses and dungeons.",
      "Read each boss arena before engaging; movement, ranged options, and damage mitigation matter.",
      "Keep backup gear and graves/waypoints prepared before first attempts.",
      "Use JEI/EMI to inspect boss drops and decide which fights unlock your next equipment upgrade.",
    ],
  },
  {
    match: ["rftools", "xnet"],
    title: "McJty tech progression route",
    steps: [
      "Use RFTools utility blocks for power, teleportation, storage, and builder-style automation where available.",
      "Use XNet for compact item/fluid/energy routing when simpler pipes become hard to manage.",
      "Name channels clearly and build one connection at a time when debugging.",
      "Keep controller power buffered; routing networks failing under low power can look like filter mistakes.",
      "Use the wiki/source links for block-specific behavior because many blocks have dense GUIs.",
    ],
  },
  {
    match: ["iron's spells", "irons spells"],
    title: "Iron's Spells progression route",
    steps: [
      "Find spell books, upgrade materials, and scroll sources through structures, mobs, and crafting.",
      "Choose a school of magic that complements your armor and weapon path.",
      "Bind combat, movement, and utility spells separately so fights do not depend on menu time.",
      "Upgrade mana, cooldown, and spell power stats before relying on high-cost spells.",
      "Use JEI/EMI and any in-game guide entries to track upgrade chains and rare drops.",
    ],
  },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function cleanText(value, maxLength = 320) {
  let text = String(value || "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\(([^)]*)\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > maxLength) text = `${text.slice(0, maxLength - 1).trim()}...`;
  return text;
}

function slugify(value) {
  return String(value || "mod")
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function inferTopic(name, modrinthProject, addon) {
  const haystack = [
    name,
    addon.fileNameOnDisk,
    modrinthProject?.description,
    ...(modrinthProject?.categories || []),
    ...(modrinthProject?.additional_categories || []),
  ]
    .join(" ")
    .toLowerCase();

  for (const rule of topicRules) {
    if (rule.words.some((word) => haystack.includes(word))) return rule.key;
  }
  return addon.categorySection?.name === "Shaders" ? "Performance & Rendering" : "General";
}

function inferComplexity(topic, addon, project) {
  const text = normalize(`${addon.name} ${addon.fileNameOnDisk} ${project?.description || ""}`);
  if (topic === "Library / Dependency") return "Low: dependency mod, usually no direct player progression.";
  if (topic === "QoL & UI" || topic === "Performance & Rendering") return "Low to medium: configure it once, then adjust as needed.";
  if (["Tech", "Magic", "Farming & Resources"].includes(topic)) return "Medium to high: best learned through staged progression and JEI/EMI recipes.";
  if (text.includes("boss") || text.includes("dimension") || text.includes("colon")) return "Medium to high: progression, exploration, or settlement planning involved.";
  return "Medium: check recipes, config, and official docs before scaling it in a shared world.";
}

function inferWhatItAdds(name, topic, project, addon) {
  const desc = cleanText(project?.description || "", 220);
  if (desc) return desc;
  const lower = normalize(name);
  if (topic === "Library / Dependency") return "A support library or API used by other mods in the pack.";
  if (topic === "Tech") return "Machines, power, automation, transport, or processing systems.";
  if (topic === "Magic") return "Magic progression, spells, rituals, artifacts, or supernatural resources.";
  if (topic === "Storage") return "Storage blocks, item transport, inventory tools, or automation helpers.";
  if (topic === "World & Exploration") return "World generation, structures, mobs, dimensions, bosses, or exploration content.";
  if (topic === "Building & Decoration") return "Blocks, textures, furniture, lights, or building-focused variants.";
  if (topic === "Farming & Resources") return "Resource generation, farming, crops, bees, ore processing, or passive production.";
  if (topic === "QoL & UI") return "Interface, mapping, inventory, tooltip, configuration, or quality-of-life features.";
  if (lower.includes("shader")) return "A visual preset included with the modpack.";
  return "A gameplay, utility, content, or compatibility mod included in ATM10.";
}

function genericTutorial(name, topic) {
  const common = [
    "Open JEI/EMI and search the mod name to see its blocks, items, and recipes in this pack.",
    "Check the official project page, wiki, or source links in the Sources section before assuming older tutorials still match ATM10.",
    "Test one small setup in creative or a safe base area before scaling it on a shared server.",
  ];

  const topicSteps = {
    Tech: [
      "Identify the mod's power system, machine casing/frame, first generator, and basic cable/pipe block.",
      "Build a one-machine test line with input storage, output storage, power, and a visible recipe from JEI/EMI.",
      "Only expand after you understand side configuration, upgrades, and whether the machine accepts items, fluids, gases, or energy.",
    ],
    Magic: [
      "Craft or find the mod's guide book if it has one, then unlock the first crafting station or ritual block.",
      "Learn the resource loop first: mana/source/aureal/essence generation, storage, and transfer.",
      "Make a low-risk spell, ritual, or artifact setup before using it near important builds.",
    ],
    Storage: [
      "Start with a small inventory setup, then add filtering, upgrades, and external access.",
      "Route common bulk items separately from rare gear so filters and void upgrades are safer.",
      "Connect to AE2 or another main storage network only after insert/extract rules are tested.",
    ],
    "World & Exploration": [
      "Read any progression requirements before entering new structures, dimensions, or boss arenas.",
      "Bring waypoint tools, spare food, recovery gear, blocks, and an escape method.",
      "Check loot, mob drops, and boss rewards in JEI/EMI to decide when the content is worth tackling.",
    ],
    "Building & Decoration": [
      "Search the mod in JEI/EMI and preview block families, variants, and crafting stations.",
      "Build a small palette wall before committing resources to a large structure.",
      "Use connected-texture, copy, chisel, or variant tools carefully around machines and storage blocks.",
    ],
    "Farming & Resources": [
      "Find the first seed, hive, pot, machine, or resource block and confirm its growth/production condition.",
      "Automate harvesting and output collection before adding many resource types.",
      "Buffer outputs in drawers or AE2 to avoid item overflow on a server.",
    ],
    "QoL & UI": [
      "Open the mod config or keybind menu and check the default controls.",
      "Use it during normal play, then tune overlays, search behavior, map settings, or client performance options.",
      "For shared servers, avoid settings that expose unwanted map or claim information.",
    ],
    "Library / Dependency": [
      "This mod is mainly present because another mod depends on it.",
      "Do not remove it from the pack; missing libraries usually prevent Minecraft from launching.",
      "Use its source/project page when troubleshooting crashes that mention its mod id.",
    ],
    "Performance & Rendering": [
      "Start from the default ATM10 profile and change one visual/performance option at a time.",
      "Keep a known-good shader and video settings profile before experimenting.",
      "If crashes or visual bugs appear, disable shaders first, then test performance mods one by one.",
    ],
    General: [
      "Search the mod's item list and recipes in JEI/EMI.",
      "Look for an in-game guide book, advancements, quest entries, or config screen.",
      "Try a small sample of its blocks/items, then follow the official docs for deeper progression.",
    ],
  };

  return [...(topicSteps[topic] || topicSteps.General), ...common].slice(0, 6);
}

function majorTutorial(name) {
  const lower = normalize(name);
  const directMatches = [
    ["Applied Energistics 2 starter route", lower === "applied energistics 2"],
    ["Mekanism progression route", lower === "mekanism" || lower.startsWith("mekanism ")],
    ["Create progression route", lower === "create"],
    ["Ars Nouveau progression route", lower === "ars nouveau"],
    ["Productive Bees progression route", lower === "productive bees"],
    ["MineColonies progression route", lower === "minecolonies"],
    ["Mystical Agriculture progression route", lower === "mystical agriculture"],
    [
      "Sophisticated storage progression route",
      lower.startsWith("sophisticated backpacks") || lower.startsWith("sophisticated storage"),
    ],
    ["Powah progression route", lower === "powah"],
    ["Industrial Foregoing progression route", lower === "industrial foregoing"],
    ["Silent Gear progression route", lower === "silent gear"],
    ["Twilight Forest progression route", lower === "the twilight forest"],
    ["Cataclysm progression route", lower.includes("cataclysm") && !lower.includes("jei")],
    ["McJty tech progression route", lower.startsWith("rftools") || lower === "xnet"],
    ["Iron's Spells progression route", lower.startsWith("iron's spells") || lower.startsWith("irons spells")],
  ];
  const match = directMatches.find(([, isMatch]) => isMatch);
  return match ? majorGuides.find((guide) => guide.title === match[0]) : null;
}

function sourceList(addon, project, version, cacheEntry) {
  const sources = [];
  if (addon.webSiteURL) sources.push({ label: "CurseForge project", url: addon.webSiteURL });
  if (project?.slug) sources.push({ label: "Modrinth project", url: `https://modrinth.com/mod/${project.slug}` });
  if (project?.source_url) sources.push({ label: "Source code", url: project.source_url });
  if (project?.wiki_url) sources.push({ label: "Official wiki/docs", url: project.wiki_url });
  if (addon.wikiURL && !sources.some((s) => s.url === addon.wikiURL)) {
    sources.push({ label: "CurseForge wiki", url: addon.wikiURL });
  }
  if (addon.issuesURL) sources.push({ label: "Issue tracker", url: addon.issuesURL });
  if (project?.discord_url) sources.push({ label: "Community Discord", url: project.discord_url });
  if (version?.id) sources.push({ label: "Matched Modrinth version", url: `https://modrinth.com/mod/${project?.slug || project?.id}/version/${version.id}` });
  if (cacheEntry?.modrinthHash) {
    sources.push({ label: "Modrinth hash match", url: `https://api.modrinth.com/v2/version_file/${cacheEntry.modrinthHash}?algorithm=sha1` });
  }
  return sources;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": USER_AGENT,
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function fetchModrinthData(hashByJar) {
  const hashes = [...new Set(Object.values(hashByJar).filter(Boolean))];
  const versionsByHash = {};

  for (const group of chunk(hashes, 100)) {
    try {
      const result = await fetchJson("https://api.modrinth.com/v2/version_files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hashes: group, algorithm: "sha1" }),
      });
      Object.assign(versionsByHash, result);
    } catch (error) {
      console.warn(`Modrinth version lookup failed for ${group.length} hashes: ${error.message}`);
    }
  }

  const projectIds = [
    ...new Set(
      Object.values(versionsByHash)
        .map((version) => version?.project_id)
        .filter(Boolean)
    ),
  ];
  const projectsById = {};

  for (const group of chunk(projectIds, 100)) {
    try {
      const url = `https://api.modrinth.com/v2/projects?ids=${encodeURIComponent(
        JSON.stringify(group)
      )}`;
      const projects = await fetchJson(url);
      for (const project of projects) projectsById[project.id] = project;
    } catch (error) {
      console.warn(`Modrinth project lookup failed for ${group.length} projects: ${error.message}`);
    }
  }

  return { versionsByHash, projectsById };
}

function readCrashCache() {
  const byJar = new Map();
  if (!fs.existsSync(cachePath)) return byJar;

  for (const file of fs.readdirSync(cachePath)) {
    if (!file.endsWith(".mod_data.json")) continue;
    try {
      const entry = readJson(path.join(cachePath, file));
      if (entry.jarName) byJar.set(entry.jarName, entry);
    } catch {
      // Ignore corrupt cache files; the CurseForge instance metadata still has a fallback.
    }
  }
  return byJar;
}

function buildModEntry(addon, index, cacheEntry, version, project) {
  const name = addon.name || cacheEntry?.name || addon.fileNameOnDisk || `Mod ${index + 1}`;
  const topic = inferTopic(name, project, addon);
  const guide = majorTutorial(name);
  const tutorial = guide?.steps || genericTutorial(name, topic);
  const tutorialTitle = guide?.title || `${topic} learning path`;
  const installedFile = addon.installedFile || {};
  const latestFile = addon.latestFile || {};
  const modType = addon.categorySection?.name === "Shaders" ? "shader" : "mod";
  const sources = sourceList(addon, project, version, cacheEntry);
  const fileName = addon.fileNameOnDisk || installedFile.fileName || cacheEntry?.jarName || "";

  return {
    id: `${slugify(name)}-${addon.addonID || cacheEntry?.modId || index}`,
    name,
    type: modType,
    topic,
    summary: inferWhatItAdds(name, topic, project, addon),
    installedVersion: cacheEntry?.version || version?.version_number || installedFile.displayName || installedFile.fileName || "Unknown",
    installedFile: fileName,
    modId: cacheEntry?.modId || null,
    author: addon.primaryAuthor || addon.authors?.map((a) => a.name).join(", ") || project?.team || "Unknown",
    authors: addon.authors?.map((author) => author.name).filter(Boolean) || [],
    curseForgeProjectId: addon.addonID || installedFile.projectId || null,
    curseForgeFileId: installedFile.id || addon.fileID || null,
    modrinthProjectId: project?.id || null,
    modrinthSlug: project?.slug || null,
    modrinthVersionId: version?.id || null,
    projectStatus: project?.status || null,
    clientSide: project?.client_side || null,
    serverSide: project?.server_side || null,
    gameVersions: version?.game_versions || installedFile.gameVersion || [],
    loaders: version?.loaders || ["neoforge"],
    dateInstalled: addon.dateInstalled || null,
    fileDate: installedFile.fileDate || null,
    latestKnownFile: latestFile.fileName || null,
    thumbnailUrl: addon.thumbnailUrl || project?.icon_url || null,
    complexity: inferComplexity(topic, addon, project),
    sections: [
      {
        title: "Overview",
        items: [
          inferWhatItAdds(name, topic, project, addon),
          `ATM10 includes it as ${modType === "shader" ? "an included shader/resource pack" : `a ${topic.toLowerCase()} mod`}.`,
          `Installed file: ${fileName || "not listed"}.`,
        ],
      },
      {
        title: "Tutorial",
        intro: tutorialTitle,
        items: tutorial,
      },
      {
        title: "Important parts",
        items: [
          `Main role: ${topic}.`,
          `Complexity: ${inferComplexity(topic, addon, project)}`,
          `Best first tool: JEI/EMI search for "${name}" plus any guide book or wiki linked below.`,
          "For shared servers, test chunk loading, automation loops, and high-volume farms before leaving them unattended.",
        ],
      },
      {
        title: "ATM10 notes",
        items: [
          "ATM10 can change recipes and progression through pack scripts, so JEI/EMI inside the pack is the final authority for crafting.",
          "Quest book entries, advancements, and in-game manuals should be checked before following old videos.",
          "When a mod has no direct player-facing content, keep it installed because another mod may require it.",
        ],
      },
    ],
    sources,
  };
}

async function main() {
  if (!fs.existsSync(manifestPath) || !fs.existsSync(instanceJsonPath)) {
    throw new Error(`Could not find ATM10 manifest/minecraftinstance under: ${instancePath}`);
  }

  const manifest = readJson(manifestPath);
  const instance = readJson(instanceJsonPath);
  const cacheByJar = readCrashCache();
  const hashByJar = {};

  for (const [jar, entry] of cacheByJar.entries()) {
    if (entry.modrinthHash) hashByJar[jar] = entry.modrinthHash;
  }

  console.log(`Found ${instance.installedAddons.length} installed entries.`);
  console.log(`Found ${Object.keys(hashByJar).length} local SHA-1 hashes for Modrinth matching.`);

  const { versionsByHash, projectsById } = await fetchModrinthData(hashByJar);
  console.log(`Matched ${Object.keys(versionsByHash).length} entries on Modrinth.`);

  const mods = instance.installedAddons
    .filter((addon) => addon.isEnabled !== false)
    .map((addon, index) => {
      const cacheEntry = cacheByJar.get(addon.fileNameOnDisk) || null;
      const hash = cacheEntry?.modrinthHash;
      const version = hash ? versionsByHash[hash] : null;
      const project = version?.project_id ? projectsById[version.project_id] : null;
      return buildModEntry(addon, index, cacheEntry, version, project);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const topics = [...new Set(mods.map((mod) => mod.topic))].sort();
  const data = {
    pack: {
      name: manifest.name || instance.name,
      version: manifest.version || instance.manifest?.version || "Unknown",
      minecraftVersion: manifest.minecraft?.version || instance.gameVersion || "Unknown",
      loader:
        manifest.minecraft?.modLoaders?.find((loader) => loader.primary)?.id ||
        instance.baseModLoader?.name ||
        "NeoForge",
      generatedAt: new Date().toISOString(),
      sourceInstancePath: instancePath,
      counts: {
        totalEntries: mods.length,
        mods: mods.filter((mod) => mod.type === "mod").length,
        shaders: mods.filter((mod) => mod.type === "shader").length,
        modrinthMatches: mods.filter((mod) => mod.modrinthProjectId).length,
      },
      sources: [
        {
          label: "All The Mods 10 CurseForge project",
          url: "https://www.curseforge.com/minecraft/modpacks/all-the-mods-10",
        },
        {
          label: "ATM10 GitHub repository",
          url: "https://github.com/AllTheMods/ATM-10",
        },
        {
          label: "ATM10 6.6 to 7.0 changelog",
          url: "https://github.com/AllTheMods/ATM-10/blob/main/changelogs/CHANGELOG-ATM10-6.6-7.0.md",
        },
        {
          label: "Modrinth API",
          url: "https://docs.modrinth.com/api/",
        },
      ],
    },
    topics,
    mods,
  };

  const outputPath = path.join(root, "data", "mods.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Wrote ${outputPath}`);
  console.log(
    `Included ${data.pack.counts.mods} mods, ${data.pack.counts.shaders} shader packs, ${data.pack.counts.modrinthMatches} Modrinth matches.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
