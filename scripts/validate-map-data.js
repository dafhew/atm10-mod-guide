const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "..", "data", "server-map.json");
const map = JSON.parse(fs.readFileSync(filePath, "utf8"));
const dimensions = new Set((map.dimensions || []).map((dimension) => dimension.id));
const validTypes = new Set(["structures", "ores"]);

if (!map.seed) throw new Error("server-map.json is missing seed");
if (!dimensions.size) throw new Error("server-map.json is missing dimensions");

for (const [index, location] of (map.locations || []).entries()) {
  if (!validTypes.has(location.type)) throw new Error(`Location ${index} has invalid type: ${location.type}`);
  if (!dimensions.has(location.dimension)) throw new Error(`Location ${index} uses unknown dimension: ${location.dimension}`);
  if (!location.name) throw new Error(`Location ${index} is missing name`);
  for (const axis of ["x", "z"]) {
    if (!Number.isFinite(Number(location[axis]))) throw new Error(`Location ${index} has invalid ${axis}`);
  }
  if (location.y !== "~" && location.y !== null && location.y !== undefined && !Number.isFinite(Number(location.y))) {
    throw new Error(`Location ${index} has invalid y`);
  }
}

console.log(`Validated seed ${map.seed} with ${map.dimensions.length} dimensions and ${(map.locations || []).length} locations.`);
