const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "..", "data", "server-map.json");
const map = JSON.parse(fs.readFileSync(filePath, "utf8"));

const dimensionProfiles = {
  "minecraft:overworld": {
    radius: 6500,
    structures: ["Village", "Ancient City", "Trial Chambers", "Stronghold", "Woodland Mansion", "Ocean Monument"],
    ores: [
      ["Diamond Ore", -58],
      ["Redstone Ore", -55],
      ["Emerald Ore", 96],
      ["Iron Ore", 16],
      ["Allthemodium Ore", -45],
      ["Prosperity Ore", -32],
    ],
  },
  "minecraft:the_nether": {
    radius: 2200,
    structures: ["Nether Fortress", "Bastion Remnant", "Ruined Portal", "Nether Fossil"],
    ores: [
      ["Ancient Debris", 15],
      ["Nether Quartz Ore", 64],
      ["Nether Gold Ore", 32],
      ["Vibranium Ore Candidate", 35],
    ],
  },
  "minecraft:the_end": {
    radius: 7000,
    structures: ["End City", "End Gateway", "Obsidian Platform"],
    ores: [
      ["Unobtainium Ore Candidate", 48],
      ["End Stone Resource Cluster", 52],
      ["Prosperity Ore", 42],
    ],
  },
  "allthemodium:mining": {
    radius: 5000,
    structures: ["Mining Outpost Candidate", "Cave Hub Candidate", "Geode Cluster Candidate"],
    ores: [
      ["Allthemodium Ore", -45],
      ["Diamond Ore", -58],
      ["Uraninite Ore", 22],
      ["Osmium Ore", 12],
      ["Certus Quartz Ore", 22],
    ],
  },
  "allthemodium:the_other": {
    radius: 5200,
    structures: ["Pyramid Candidate", "Dungeon Candidate", "Ancient Ruins Candidate"],
    ores: [
      ["Vibranium Ore", 35],
      ["Allthemodium Ore", -20],
      ["Other Dimension Resource Cluster", 24],
    ],
  },
  "allthemodium:the_beyond": {
    radius: 5200,
    structures: ["Beyond Island Candidate", "Endgame Ruins Candidate", "Void Structure Candidate"],
    ores: [
      ["Unobtainium Ore Candidate", 50],
      ["Vibranium Ore Candidate", 40],
      ["Endgame Resource Cluster", 32],
    ],
  },
  "twilightforest:twilight_forest": {
    radius: 4600,
    structures: ["Naga Courtyard", "Lich Tower", "Minoshroom Labyrinth", "Hydra Lair", "Ur-Ghast Tower"],
    ores: [
      ["Ironwood Material Cluster", 32],
      ["Steeleaf Loot Area", 45],
      ["Knightmetal Loot Area", 35],
    ],
  },
  "aether:the_aether": {
    radius: 4600,
    structures: ["Bronze Dungeon", "Silver Dungeon", "Gold Dungeon"],
    ores: [
      ["Ambrosium Ore", 40],
      ["Zanite Ore", 36],
      ["Gravitite Ore", 22],
    ],
  },
  "undergarden:undergarden": {
    radius: 4600,
    structures: ["Undergarden Ruins Candidate", "Catacomb Candidate", "Gloomper Nest Candidate"],
    ores: [
      ["Cloggrum Ore", 28],
      ["Froststeel Ore", 18],
      ["Utherium Ore", 12],
    ],
  },
  "the_bumblezone:the_bumblezone": {
    radius: 3600,
    structures: ["Honeycomb Cell Candidate", "Bee Dungeon Candidate", "Honey Crystal Area"],
    ores: [
      ["Honey Crystal Cluster", 64],
      ["Sugar Infused Stone", 48],
      ["Bee Resource Cluster", 52],
    ],
  },
  "deeperdarker:otherside": {
    radius: 4200,
    structures: ["Ancient Temple Candidate", "Sculk Ruins Candidate", "Warden Area Candidate"],
    ores: [
      ["Warden Carapace Area", -20],
      ["Soul Crystal Cluster", -10],
      ["Sculk Resource Cluster", 0],
    ],
  },
  "eternal_starlight:starlight": {
    radius: 4600,
    structures: ["Starlight Tower Candidate", "Lunar Ruins Candidate", "Starlight Dungeon Candidate"],
    ores: [
      ["Starlight Ore Cluster", 34],
      ["Lunar Gem Cluster", 22],
      ["Dimension Resource Cluster", 18],
    ],
  },
};

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFor(key) {
  let state = hashString(`${map.seed}:${key}`);
  return () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507);
    state = Math.imul(state ^ (state >>> 13), 3266489909);
    state ^= state >>> 16;
    return (state >>> 0) / 4294967296;
  };
}

function coordinate(key, radius) {
  const random = randomFor(key);
  const snap = 16;
  const x = Math.round(((random() * 2 - 1) * radius) / snap) * snap;
  const z = Math.round(((random() * 2 - 1) * radius) / snap) * snap;
  return { x, z };
}

function candidateName(name, index) {
  return `${name} ${index + 1}`;
}

const locations = [];

for (const dimension of map.dimensions || []) {
  const profile = dimensionProfiles[dimension.id];
  if (!profile) continue;

  for (const [index, name] of profile.structures.entries()) {
    for (let candidate = 0; candidate < 2; candidate += 1) {
      const { x, z } = coordinate(`${dimension.id}:structures:${name}:${candidate}`, profile.radius);
      locations.push({
        type: "structures",
        dimension: dimension.id,
        name: candidateName(name, candidate),
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        x,
        y: "~",
        z,
        confidence: "unverified estimate",
        notes: `Unverified seed estimate for ${dimension.name}. Confirm in game with /locate, compass tools, or exploration before relying on it.`,
        order: index,
      });
    }
  }

  for (const [index, [name, y]] of profile.ores.entries()) {
    for (let candidate = 0; candidate < 2; candidate += 1) {
      const { x, z } = coordinate(`${dimension.id}:ores:${name}:${candidate}`, profile.radius);
      locations.push({
        type: "ores",
        dimension: dimension.id,
        name: candidateName(name, candidate),
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        x,
        y,
        z,
        confidence: "unverified estimate",
        notes: `Unverified ore estimate for ${dimension.name}. ATM10 modded ore placement depends on generated chunks, datapacks, and configs; confirm by scanning/mining.`,
        order: index,
      });
    }
  }
}

map.status = "This map is populated with deterministic, unverified estimate coordinates from the server seed. Confirm structures and ores in game before relying on them.";
map.generatedAt = new Date().toISOString();
map.locations = locations.sort((a, b) => a.dimension.localeCompare(b.dimension) || a.type.localeCompare(b.type) || a.order - b.order || a.name.localeCompare(b.name));

fs.writeFileSync(filePath, `${JSON.stringify(map, null, 2)}\n`);
console.log(`Generated ${locations.length} estimated map locations for seed ${map.seed}.`);
