const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "data", "mods.json");
const itemDir = path.join(root, "data", "items");

function compactSearch(items) {
  return items
    .map((item) => `${item.name} ${item.id}`)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 500000);
}

if (!fs.existsSync(dataPath)) {
  console.error("Missing data/mods.json. Run the data build first.");
  process.exit(1);
}

fs.mkdirSync(itemDir, { recursive: true });

for (const file of fs.readdirSync(itemDir)) {
  if (file.endsWith(".json")) fs.unlinkSync(path.join(itemDir, file));
}

const data = JSON.parse(fs.readFileSync(dataPath, "utf8").replace(/^\uFEFF/, ""));
let splitCount = 0;
let itemCount = 0;

for (const mod of data.mods) {
  const items = Array.isArray(mod.items) ? mod.items : [];
  mod.itemCount = Number(mod.itemCount || items.length || 0);
  if (items.length) {
    const fileName = `${mod.id}.json`;
    fs.writeFileSync(path.join(itemDir, fileName), `${JSON.stringify(items)}\n`);
    mod.itemDataFile = `data/items/${fileName}`;
    mod.itemSearch = compactSearch(items);
    splitCount += 1;
    itemCount += items.length;
  } else {
    delete mod.itemDataFile;
    delete mod.itemSearch;
  }
  delete mod.items;
}

if (!data.pack.counts) data.pack.counts = {};
data.pack.counts.itemEntries = itemCount;
data.pack.counts.modsWithItemEntries = splitCount;
data.pack.itemDataSplitAt = new Date().toISOString();

fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Split ${itemCount} item/block entries into ${splitCount} files.`);
