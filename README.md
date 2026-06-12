# ATM10 Mod Guide

Static website for browsing the mods included in All The Mods 10.

## Use

```powershell
node scripts\build-data.js
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\enrich-items.ps1
node scripts\split-items.js
npm run serve
```

Open `http://localhost:4173`.

Friends on the same network can try `http://YOUR-PC-IP:4173`. For friends outside your network, deploy the folder to GitHub Pages, Netlify, Cloudflare Pages, or another static host.

## Server Map Coordinates

The home page seed map reads `data/server-map.json`. The seed and dimensions are configured there; exact structure and ore coordinates should be added under `locations` after scanning the generated world or recording `/locate` results.

Example location:

```json
{
  "type": "structures",
  "dimension": "minecraft:overworld",
  "name": "Ancient City",
  "x": 1200,
  "y": -51,
  "z": -840,
  "notes": "Found with /locate structure minecraft:ancient_city"
}
```

Use `type: "ores"` for ore markers. Run `npm run check` after editing; it validates the map data.

## Data Sources

- Local CurseForge ATM10 instance manifest and `minecraftinstance.json`
- All The Mods 10 CurseForge project: https://www.curseforge.com/minecraft/modpacks/all-the-mods-10
- ATM10 GitHub repository and 7.0 changelog: https://github.com/AllTheMods/ATM-10
- Modrinth API hash matching: https://docs.modrinth.com/api/

The generator stores short sourced summaries and links. It does not copy full external mod pages.
