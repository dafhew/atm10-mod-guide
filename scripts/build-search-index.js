const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const modsPath = path.join(root, "data", "mods.json");
const bossesPath = path.join(root, "data", "bosses.json");
const outputPath = path.join(root, "data", "search-index.json");

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function compact(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function entryText(parts) {
  return compact(parts.filter(Boolean).join(" ")).toLowerCase();
}

const data = readJson(modsPath, { mods: [] });
const bossData = readJson(bossesPath, {});
const entries = [];

for (const mod of data.mods) {
  entries.push({
    type: "mod",
    modId: mod.id,
    modName: mod.name,
    name: mod.name,
    id: mod.modId || mod.id,
    text: entryText([mod.name, mod.modId, mod.topic, mod.summary, mod.author, mod.installedFile]),
  });

  for (const boss of bossData[mod.id]?.bosses || []) {
    entries.push({
      type: "boss",
      modId: mod.id,
      modName: mod.name,
      name: boss.name,
      id: boss.name,
      text: entryText([
        boss.name,
        mod.name,
        boss.find?.join(" "),
        boss.drops?.map((drop) => `${drop.name} ${drop.use}`).join(" "),
        boss.special?.join(" "),
      ]),
    });
  }

  if (!mod.itemDataFile) continue;
  const itemPath = path.join(root, mod.itemDataFile);
  const items = readJson(itemPath, []);
  for (const item of items) {
    entries.push({
      type: item.type === "block" ? "block" : "item",
      modId: mod.id,
      modName: mod.name,
      name: item.name,
      id: item.id,
      text: entryText([item.name, item.id, item.type, mod.name]),
    });
  }
}

entries.sort((a, b) => a.name.localeCompare(b.name) || a.modName.localeCompare(b.modName));

fs.writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      count: entries.length,
      entries,
    },
    null,
    0
  )}\n`
);

console.log(`Wrote ${entries.length.toLocaleString()} search entries to ${path.relative(root, outputPath)}`);
