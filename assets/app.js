const state = {
  data: null,
  bossData: {},
  searchIndex: [],
  searchResults: [],
  focusTarget: null,
  linkTargetsByMod: new Map(),
  bossDropIndex: new Map(),
  selectedId: null,
  topic: "All",
  query: "",
  itemCache: new Map(),
};

const elements = {
  packStats: document.querySelector("#packStats"),
  packMeta: document.querySelector("#packMeta"),
  homeMeta: document.querySelector("#homeMeta"),
  homeGrid: document.querySelector("#homeGrid"),
  categoryStrip: document.querySelector("#categoryStrip"),
  categoryTools: document.querySelector("#categoryTools") || document.querySelector("#topicFilters"),
  visibleCount: document.querySelector("#visibleCount"),
  modSelect: document.querySelector("#modSelect"),
  searchInput: document.querySelector("#searchInput"),
  searchResults: document.querySelector("#searchResults"),
  modList: document.querySelector("#modList"),
  selectedName: document.querySelector("#selectedName"),
  selectedSummary: document.querySelector("#selectedSummary"),
  selectedMeta: document.querySelector("#selectedMeta"),
  details: document.querySelector("#details"),
  sources: document.querySelector("#sources"),
  primarySource: document.querySelector("#primarySource"),
  tutorialSearch: document.querySelector("#tutorialSearch"),
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sourceHost(source) {
  try {
    return new URL(source.url).hostname.replace(/^www\./, "");
  } catch {
    return source.label;
  }
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value === "object") return [];
  return [value];
}

function asObjectArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object" || !Object.keys(value).length) return [];
  return [value];
}

function targetDomId(prefix, value) {
  return `${prefix}-${encodeURIComponent(String(value)).replace(/%/g, "_")}`;
}

function targetMatches(type, id) {
  return state.focusTarget?.type === type && state.focusTarget.id === id;
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function targetKey(target) {
  return `${target?.type || ""}:${target?.id || ""}`;
}

function buildBossDropIndex() {
  state.bossDropIndex = new Map();
  for (const [modId, entry] of Object.entries(state.bossData || {})) {
    for (const boss of asArray(entry?.bosses)) {
      for (const drop of asArray(boss.drops)) {
        const key = normalizeKey(drop.name);
        if (!key) continue;
        if (!state.bossDropIndex.has(key)) state.bossDropIndex.set(key, []);
        state.bossDropIndex.get(key).push({
          bossName: boss.name,
          modId,
          dropName: drop.name,
          use: drop.use,
        });
      }
    }
  }
}

function getGuideLinkTargets(modId) {
  if (state.linkTargetsByMod.has(modId)) return state.linkTargetsByMod.get(modId);
  const seen = new Set();
  const targets = [];
  for (const entry of state.searchIndex) {
    if (entry.modId !== modId || !["boss", "item", "block"].includes(entry.type)) continue;
    for (const phrase of [entry.name, entry.id]) {
      const cleanPhrase = String(phrase || "").trim();
      const normalized = normalizeKey(cleanPhrase);
      if (cleanPhrase.length < 4 || normalized.length < 4 || seen.has(normalized)) continue;
      seen.add(normalized);
      targets.push({
        phrase: cleanPhrase,
        lower: cleanPhrase.toLowerCase(),
        type: entry.type,
        modId: entry.modId,
        id: entry.type === "boss" ? entry.name : entry.id,
      });
    }
  }
  targets.sort((a, b) => b.phrase.length - a.phrase.length);
  state.linkTargetsByMod.set(modId, targets);
  return targets;
}

function canLinkAtBoundary(text, start, end) {
  const before = start > 0 ? text[start - 1] : "";
  const after = end < text.length ? text[end] : "";
  return !/[a-z0-9_:-]/i.test(before) && !/[a-z0-9_:-]/i.test(after);
}

function renderLinkedText(value, currentTarget = null, modId = state.selectedId) {
  const text = String(value ?? "");
  if (!text) return "";
  const lowerText = text.toLowerCase();
  const targets = getGuideLinkTargets(modId).filter((target) => targetKey(target) !== targetKey(currentTarget));
  let output = "";
  let index = 0;

  while (index < text.length) {
    const match = targets.find((target) => lowerText.startsWith(target.lower, index) && canLinkAtBoundary(text, index, index + target.phrase.length));
    if (!match) {
      output += escapeHtml(text[index]);
      index += 1;
      continue;
    }
    const label = text.slice(index, index + match.phrase.length);
    output += `<a class="guide-link" href="#" data-guide-link="1" data-target-type="${escapeHtml(match.type)}" data-target-mod-id="${escapeHtml(match.modId)}" data-target-id="${escapeHtml(match.id)}">${escapeHtml(label)}</a>`;
    index += match.phrase.length;
  }

  return output;
}

function renderLinkedList(items, currentTarget = null) {
  return asArray(items)
    .map((item) => `<li>${renderLinkedText(item, currentTarget)}</li>`)
    .join("");
}

function getBossDropsForItem(item) {
  const keys = new Set([normalizeKey(item.name), normalizeKey(item.id?.split(":").pop()?.replace(/_/g, " "))].filter(Boolean));
  const drops = [];
  const seen = new Set();
  for (const key of keys) {
    for (const drop of state.bossDropIndex.get(key) || []) {
      const dropKey = `${drop.modId}:${drop.bossName}:${drop.dropName}`;
      if (seen.has(dropKey)) continue;
      seen.add(dropKey);
      drops.push(drop);
    }
  }
  return drops;
}

function matches(mod) {
  const query = state.query.trim().toLowerCase();
  const topicMatch = state.topic === "All" || mod.topic === state.topic || mod.type === state.topic;
  if (!query) return topicMatch;
  const text = [
    mod.name,
    mod.topic,
    mod.summary,
    mod.installedFile,
    mod.modId,
    mod.author,
    mod.itemSearch,
    state.bossData[mod.id]?.bosses
      ?.map((boss) => [boss.name, boss.find?.join(" "), boss.drops?.map((drop) => `${drop.name} ${drop.use}`).join(" ")].join(" "))
      .join(" "),
    mod.sources?.map((source) => source.label).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return topicMatch && text.includes(query);
}

function filteredMods() {
  return state.data.mods.filter(matches);
}

function setSelected(id) {
  state.selectedId = id;
  const mod = state.data.mods.find((entry) => entry.id === id) || filteredMods()[0] || state.data.mods[0];
  if (!mod) return;
  state.selectedId = mod.id;
  renderSelected(mod);
  renderList();
  elements.modSelect.value = mod.id;
  history.replaceState(null, "", `#${encodeURIComponent(mod.id)}`);
}

function resultTypeLabel(type) {
  return {
    mod: "Mod",
    boss: "Boss",
    block: "Block",
    item: "Item",
  }[type] || type;
}

function scoreSearchEntry(entry, query, tokens) {
  const name = String(entry.name || "").toLowerCase();
  const id = String(entry.id || "").toLowerCase();
  const text = String(entry.text || "").toLowerCase();
  if (!tokens.every((token) => text.includes(token) || name.includes(token) || id.includes(token))) return 0;

  let score = 10;
  if (name === query) score += 1000;
  else if (name.startsWith(query)) score += 700;
  else if (name.includes(query)) score += 350;
  if (id === query) score += 850;
  else if (id.startsWith(query)) score += 500;
  else if (id.includes(query)) score += 260;
  if (entry.modName?.toLowerCase?.().includes(query)) score += 80;
  score += tokens.reduce((total, token) => total + (name.includes(token) ? 30 : 0) + (id.includes(token) ? 20 : 0), 0);
  if (entry.type === "mod") score += 60;
  if (entry.type === "boss") score += 40;
  if (entry.type === "block") score += 20;
  return score;
}

function findSearchResults(query) {
  const cleaned = query.trim().toLowerCase();
  if (cleaned.length < 2) return [];
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  return state.searchIndex
    .map((entry) => ({ entry, score: scoreSearchEntry(entry, cleaned, tokens) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .slice(0, 14)
    .map((result) => result.entry);
}

function renderSearchResults() {
  if (!elements.searchResults) return;
  const query = state.query.trim();
  state.searchResults = findSearchResults(query);
  if (!query) {
    elements.searchResults.innerHTML = "";
    return;
  }
  if (!state.searchResults.length) {
    elements.searchResults.innerHTML = '<div class="search-empty">No direct matches found.</div>';
    return;
  }

  elements.searchResults.innerHTML = `
    <div class="search-result-list">
      ${state.searchResults
        .map(
          (result, index) => `
            <button class="search-result" type="button" data-result-index="${index}">
              <span class="result-kind">${escapeHtml(resultTypeLabel(result.type))}</span>
              <strong>${escapeHtml(result.name)}</strong>
              <span>${escapeHtml(result.modName)}${result.id && result.id !== result.name ? ` | ${escapeHtml(result.id)}` : ""}</span>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function selectSearchResult(result) {
  if (!result) return;
  elements.searchInput.value = result.name;
  state.query = result.name;
  state.focusTarget = {
    type: result.type,
    modId: result.modId,
    id: result.type === "mod" ? result.modId : result.id,
  };
  renderSearchResults();
  setSelected(result.modId);
}

function selectGuideTarget(type, modId, id) {
  state.focusTarget = { type, modId, id };
  const entry = state.searchIndex.find((item) => item.type === type && item.modId === modId && (item.id === id || item.name === id));
  if (entry) {
    elements.searchInput.value = entry.name;
    state.query = entry.name;
    renderSearchResults();
  }
  setSelected(modId);
}

function renderStats() {
  const { pack } = state.data;
  elements.packStats.innerHTML = [
    `${pack.counts.mods} mods`,
    `${pack.counts.shaders} shader packs`,
    pack.counts.itemEntries ? `${pack.counts.itemEntries.toLocaleString()} items/blocks` : null,
    `${pack.version}`,
    pack.minecraftVersion,
    pack.loader,
  ]
    .filter(Boolean)
    .map((item) => `<span class="pill">${escapeHtml(item)}</span>`)
    .join("");
  elements.packMeta.textContent = `${pack.name} ${pack.version} | Minecraft ${pack.minecraftVersion} | ${pack.loader}`;
  if (elements.homeMeta) {
    elements.homeMeta.textContent = `${pack.name} ${pack.version} | ${pack.minecraftVersion} | ${pack.loader}`;
  }
  if (elements.homeGrid) {
    elements.homeGrid.innerHTML = [
      ["Mods", pack.counts.mods],
      ["Items / blocks", pack.counts.itemEntries?.toLocaleString?.() || 0],
      ["Categories", state.data.topics.length],
      ["Item files", pack.counts.modsWithItemEntries || 0],
    ]
      .map(
        ([label, value]) => `
          <div class="home-stat">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
        `
      )
      .join("");
  }
}

function renderSelect() {
  elements.modSelect.innerHTML = state.data.mods
    .map((mod) => `<option value="${escapeHtml(mod.id)}">${escapeHtml(mod.name)}</option>`)
    .join("");
}

function topicCount(topic) {
  if (topic === "All") return state.data.mods.length;
  if (topic === "shader") return state.data.mods.filter((mod) => mod.type === "shader").length;
  return state.data.mods.filter((mod) => mod.topic === topic).length;
}

function topicLabel(topic) {
  return topic === "shader" ? "Included packs" : topic;
}

function renderFilters() {
  const filters = ["All", ...state.data.topics, "shader"];
  if (elements.categoryTools) {
    elements.categoryTools.innerHTML = filters
      .map((topic) => {
        const active = state.topic === topic ? " active" : "";
        return `<button class="filter${active}" type="button" data-topic="${escapeHtml(topic)}">${escapeHtml(topicLabel(topic))}</button>`;
      })
      .join("");
  }

  if (elements.categoryStrip) {
    elements.categoryStrip.innerHTML = filters
      .filter((topic) => topic !== "All")
      .map(
        (topic) => `
          <button class="category-card${state.topic === topic ? " active" : ""}" type="button" data-topic="${escapeHtml(topic)}">
            <span>${escapeHtml(topicLabel(topic))}</span>
            <strong>${escapeHtml(topicCount(topic))}</strong>
          </button>
        `
      )
      .join("");
  }
}

function renderList() {
  const mods = filteredMods();
  if (elements.visibleCount) elements.visibleCount.textContent = mods.length.toLocaleString();
  if (!mods.length) {
    elements.modList.innerHTML = '<div class="empty">No mods match the current filters.</div>';
    return;
  }

  const groups = new Map();
  for (const mod of mods) {
    const key = mod.type === "shader" ? "Included packs" : mod.topic;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(mod);
  }

  elements.modList.innerHTML = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([topic, entries], index) => {
      const containsSelected = entries.some((mod) => mod.id === state.selectedId);
      return `
        <details class="category-group" ${containsSelected || index === 0 ? "open" : ""}>
          <summary>
            <span>${escapeHtml(topic)}</span>
            <strong>${escapeHtml(entries.length)}</strong>
          </summary>
          <div class="mod-list">
            ${entries.map(renderModButton).join("")}
          </div>
        </details>
      `;
    })
    .join("");
}

function renderModButton(mod) {
  const active = mod.id === state.selectedId ? " active" : "";
  const itemCount = mod.itemCount ? ` | ${Number(mod.itemCount).toLocaleString()} items` : "";
  const bossCount = state.bossData[mod.id]?.bosses?.length;
  const bossLabel = bossCount ? ` | ${bossCount} boss${bossCount === 1 ? "" : "es"}` : "";
  return `
    <button class="mod-button${active}" type="button" data-id="${escapeHtml(mod.id)}">
      <strong>${escapeHtml(mod.name)}</strong>
      <span>${escapeHtml(mod.installedVersion)}${escapeHtml(itemCount)}${escapeHtml(bossLabel)}</span>
    </button>
  `;
}

function metaItem(label, value) {
  return `
    <div class="meta-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || "Not listed")}</strong>
    </div>
  `;
}

function renderSelected(mod) {
  elements.selectedName.textContent = mod.name;
  elements.selectedSummary.textContent = mod.summary;

  const primary = mod.sources?.[0] || state.data.pack.sources[0];
  elements.primarySource.href = primary.url;
  elements.primarySource.textContent = `Open ${primary.label}`;
  elements.tutorialSearch.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${mod.name} Minecraft 1.21 ATM10 tutorial`)}`;

  elements.selectedMeta.innerHTML = [
    metaItem("Topic", mod.topic),
    metaItem("Installed version", mod.installedVersion),
    metaItem("Author", mod.author),
    metaItem("Mod ID", mod.modId),
    metaItem("Client side", mod.clientSide),
    metaItem("Server side", mod.serverSide),
    metaItem("Items/blocks", mod.itemCount?.toLocaleString?.() || mod.items?.length || 0),
    metaItem("CurseForge ID", mod.curseForgeProjectId),
    metaItem("Modrinth", mod.modrinthSlug || mod.modrinthProjectId),
  ].join("");

  elements.details.innerHTML = [
    ...mod.sections.map((section, index) => {
      const listTag = section.title === "Tutorial" ? "ol" : "ul";
      const items = section.items
        .map((item) => `<li>${renderLinkedText(item, null, mod.id)}</li>`)
        .join("");
      return `
        <details ${index < 2 ? "open" : ""}>
          <summary>${escapeHtml(section.title)}</summary>
          <div class="detail-body">
            ${section.intro ? `<p>${renderLinkedText(section.intro, null, mod.id)}</p>` : ""}
            <${listTag}>${items}</${listTag}>
          </div>
        </details>
      `;
    }),
    renderBossesSection(mod),
    renderItemsSection(mod, state.itemCache.get(mod.id)),
  ].join("");

  renderSources(mod);
  queueFocusTarget();

  if (mod.itemDataFile && !state.itemCache.has(mod.id)) {
    loadItems(mod)
      .then((items) => {
        if (state.selectedId !== mod.id) return;
        state.itemCache.set(mod.id, items);
        renderSelected(mod);
      })
      .catch((error) => {
        console.error(error);
        state.itemCache.set(mod.id, []);
        if (state.selectedId === mod.id) renderSelected(mod);
      });
  }
}

function renderDrop(drop, currentTarget) {
  return `
    <li>
      <strong>${renderLinkedText(drop.name, currentTarget)}</strong>
      ${drop.use ? `<span>${renderLinkedText(drop.use, currentTarget)}</span>` : ""}
    </li>
  `;
}

function renderPhotoSource(source) {
  return `<a class="photo-link" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label || "Online photos")}</a>`;
}

function renderBossCard(boss) {
  const drops = asArray(boss.drops);
  const special = asArray(boss.special);
  const photoSources = asArray(boss.photoSources);
  const currentTarget = { type: "boss", id: boss.name };
  const targetClass = targetMatches("boss", boss.name) ? " target-card" : "";
  return `
    <article class="boss-card${targetClass}" id="${escapeHtml(targetDomId("boss", boss.name))}">
      <div class="boss-image-frame">
        <img src="${escapeHtml(boss.image)}" alt="${escapeHtml(boss.imageAlt || boss.name)}" loading="lazy" />
      </div>
      <div class="boss-content">
        <h4>${escapeHtml(boss.name)}</h4>
        <dl>
          <dt>How to find</dt>
          <dd><ul>${renderLinkedList(boss.find, currentTarget)}</ul></dd>
          <dt>Drops</dt>
          <dd>
            <ul class="drop-list">
              ${drops.length ? drops.map((drop) => renderDrop(drop, currentTarget)).join("") : "<li>No direct entity drops were found in the installed loot table; check structure chests and JEI/EMI.</li>"}
            </ul>
          </dd>
          ${
            special.length
              ? `
                <dt>Special notes</dt>
                <dd><ul>${renderLinkedList(special, currentTarget)}</ul></dd>
              `
              : ""
          }
        </dl>
        ${
          photoSources.length
            ? `
              <div class="photo-links">
                ${photoSources.map(renderPhotoSource).join("")}
              </div>
            `
            : ""
        }
      </div>
    </article>
  `;
}

function renderBossesSection(mod) {
  const entry = state.bossData[mod.id];
  const bosses = asArray(entry?.bosses);
  if (!bosses.length) return "";

  return `
    <details open>
      <summary>Bosses (${escapeHtml(bosses.length.toLocaleString())})</summary>
      <div class="detail-body">
        ${entry.intro ? `<p>${escapeHtml(entry.intro)}</p>` : ""}
        <div class="boss-grid">
          ${bosses.map(renderBossCard).join("")}
        </div>
      </div>
    </details>
  `;
}

async function loadItems(mod) {
  const response = await fetch(mod.itemDataFile, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${mod.itemDataFile}`);
  return response.json();
}

function renderItemsSection(mod, loadedItems) {
  const expectedCount = Number(mod.itemCount || 0);
  const shouldOpen = state.focusTarget?.modId === mod.id && ["item", "block"].includes(state.focusTarget.type);
  if (!expectedCount) {
    return `
      <details ${shouldOpen ? "open" : ""}>
        <summary>Items & blocks (0)</summary>
        <div class="detail-body">
          <p>No item/block entries were found in this mod jar's English language file. This usually means the mod is a library, client tool, performance mod, structure mod, integration, shader pack, or uses another namespace for content.</p>
        </div>
      </details>
    `;
  }

  if (!loadedItems) {
    return `
      <details ${shouldOpen ? "open" : ""}>
        <summary>Items & blocks (${escapeHtml(expectedCount.toLocaleString())})</summary>
        <div class="detail-body">
          <p>Loading item and block details for this mod...</p>
        </div>
      </details>
    `;
  }

  const items = loadedItems;

  return `
    <details ${shouldOpen ? "open" : ""}>
      <summary>Items & blocks (${escapeHtml(items.length.toLocaleString())})</summary>
      <div class="detail-body">
        <p>Extracted from the installed jar's language keys and recipe files. Recipe text points you to JEI/EMI because ATM10 pack scripts can add or alter recipes outside the mod jar.</p>
        <div class="item-grid">
          ${items.map(renderItemCard).join("")}
        </div>
      </div>
    </details>
  `;
}

function renderBossDropAcquisition(drops) {
  return `
    <ul class="boss-drop-sources">
      ${drops
        .map(
          (drop) => `
            <li>
              Dropped by
              <a class="guide-link" href="#" data-guide-link="1" data-target-type="boss" data-target-mod-id="${escapeHtml(drop.modId)}" data-target-id="${escapeHtml(drop.bossName)}">${escapeHtml(drop.bossName)}</a>
              ${drop.use ? `<span>${renderLinkedText(drop.use, { type: "boss", id: drop.bossName }, drop.modId)}</span>` : ""}
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

function renderRecipe(recipe, currentTarget) {
  const pattern = asArray(recipe.pattern);
  const key = asArray(recipe.key);
  const ingredients = asArray(recipe.ingredients);
  return `
    <div class="recipe-card">
      <div class="recipe-title">
        <strong>${escapeHtml(recipe.type || "recipe")}</strong>
        ${recipe.result ? `<span>${renderLinkedText(recipe.result, currentTarget)}</span>` : ""}
      </div>
      ${
        pattern.length
          ? `
            <div class="recipe-pattern" aria-label="Recipe pattern">
              ${pattern.map((row) => `<code>${escapeHtml(row)}</code>`).join("")}
            </div>
          `
          : ""
      }
      ${
        key.length
          ? `
            <ul class="recipe-ingredients">
              ${key.map((entry) => `<li>${renderLinkedText(entry, currentTarget)}</li>`).join("")}
            </ul>
          `
          : ""
      }
      ${
        ingredients.length
          ? `
            <ul class="recipe-ingredients">
              ${ingredients.map((entry) => `<li>${renderLinkedText(entry, currentTarget)}</li>`).join("")}
            </ul>
          `
          : ""
      }
      ${recipe.source ? `<span class="recipe-source">${escapeHtml(recipe.source)}</span>` : ""}
    </div>
  `;
}

function renderRecipeList(item, recipeTypeList, currentTarget) {
  const recipes = asObjectArray(item.recipes);
  if (recipes.length) {
    return `
      <div class="recipe-list">
        ${recipes.map((recipe) => renderRecipe(recipe, currentTarget)).join("")}
      </div>
    `;
  }
  if (recipeTypeList.length) {
    return `Craft or process it with ${escapeHtml(recipeTypeList.join(", "))}. Press R on the item in JEI/EMI for pack-script changes or alternate recipes.`;
  }
  return "";
}

function renderItemCard(item) {
  const recipeTypeList = asArray(item.recipeTypes);
  const hasRecipe = recipeTypeList.length > 0 || asObjectArray(item.recipes).length > 0;
  const bossDrops = hasRecipe ? [] : getBossDropsForItem(item);
  const currentTarget = { type: item.type === "block" ? "block" : "item", id: item.id };
  const targetClass = targetMatches(item.type === "block" ? "block" : "item", item.id) ? " target-card" : "";
  const recipeTypes = recipeTypeList.length
    ? `<div class="recipe-types">${recipeTypeList.map((type) => `<span class="pill">${escapeHtml(type)}</span>`).join("")}</div>`
    : "";
  const acquisitionLabel = hasRecipe ? "Recipe" : bossDrops.length ? "Dropped by" : "How to acquire it";
  const acquisitionBody = hasRecipe
    ? renderRecipeList(item, recipeTypeList, currentTarget)
    : bossDrops.length
      ? renderBossDropAcquisition(bossDrops)
      : renderLinkedText(item.acquire, currentTarget);
  return `
    <article class="item-card${targetClass}" id="${escapeHtml(targetDomId("item", item.id))}">
      <div class="item-card-head">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.type)} | ${escapeHtml(item.id)}</span>
      </div>
      <dl>
        <dt>What it does</dt>
        <dd>${renderLinkedText(item.purpose, currentTarget)}</dd>
        <dt>${escapeHtml(acquisitionLabel)}</dt>
        <dd>${acquisitionBody}</dd>
        <dt>How to use it</dt>
        <dd>${renderLinkedText(item.use, currentTarget)}</dd>
      </dl>
      ${recipeTypes}
    </article>
  `;
}

function queueFocusTarget() {
  const target = state.focusTarget;
  if (!target || target.modId !== state.selectedId) return;
  window.setTimeout(() => {
    const element =
      target.type === "mod"
        ? document.querySelector(".hero")
        : document.getElementById(targetDomId(target.type === "boss" ? "boss" : "item", target.id));
    if (!element) return;
    element.closest("details")?.setAttribute("open", "");
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 80);
}

function renderSources(mod) {
  const sources = [...(mod.sources || []), ...state.data.pack.sources];
  const unique = [];
  const seen = new Set();
  for (const source of sources) {
    if (!source?.url || seen.has(source.url)) continue;
    seen.add(source.url);
    unique.push(source);
  }
  elements.sources.innerHTML = `
    <div class="sources">
      ${unique
        .map(
          (source) =>
            `<a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)} <span class="pill">${escapeHtml(sourceHost(source))}</span></a>`
        )
        .join("")}
    </div>
  `;
}

function bindEvents() {
  elements.modSelect.addEventListener("change", (event) => setSelected(event.target.value));
  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    const mods = filteredMods();
    renderSearchResults();
    renderList();
    if (!mods.some((mod) => mod.id === state.selectedId)) setSelected(mods[0]?.id);
  });
  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      selectSearchResult(state.searchResults[0] || findSearchResults(state.query)[0]);
    }
    if (event.key === "Escape") {
      elements.searchInput.value = "";
      state.query = "";
      state.searchResults = [];
      renderSearchResults();
      renderList();
    }
  });
  elements.searchResults?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-result-index]");
    if (!button) return;
    selectSearchResult(state.searchResults[Number(button.dataset.resultIndex)]);
  });
  elements.categoryTools?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-topic]");
    if (!button) return;
    state.topic = button.dataset.topic;
    renderFilters();
    renderList();
    const mods = filteredMods();
    if (!mods.some((mod) => mod.id === state.selectedId)) setSelected(mods[0]?.id);
  });
  elements.categoryStrip?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-topic]");
    if (!button) return;
    state.topic = button.dataset.topic;
    renderFilters();
    renderList();
    const mods = filteredMods();
    if (!mods.some((mod) => mod.id === state.selectedId)) setSelected(mods[0]?.id);
  });
  elements.modList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (button) setSelected(button.dataset.id);
  });
  elements.details.addEventListener("click", (event) => {
    const link = event.target.closest("[data-guide-link]");
    if (!link) return;
    event.preventDefault();
    selectGuideTarget(link.dataset.targetType, link.dataset.targetModId, link.dataset.targetId);
  });
}

async function init() {
  const [modsResponse, bossesResponse, searchResponse] = await Promise.all([
    fetch("data/mods.json", { cache: "no-store" }),
    fetch("data/bosses.json", { cache: "no-store" }),
    fetch("data/search-index.json", { cache: "no-store" }),
  ]);
  if (!modsResponse.ok) throw new Error("Could not load data/mods.json. Run npm run build:data first.");
  state.data = await modsResponse.json();
  state.bossData = bossesResponse.ok ? await bossesResponse.json() : {};
  state.searchIndex = searchResponse.ok ? (await searchResponse.json()).entries || [] : [];
  buildBossDropIndex();
  renderStats();
  renderSelect();
  renderFilters();
  bindEvents();

  const hashId = decodeURIComponent(location.hash.replace(/^#/, ""));
  const initial = state.data.mods.find((mod) => mod.id === hashId) || state.data.mods[0];
  setSelected(initial?.id);
}

init().catch((error) => {
  elements.selectedName.textContent = "Could not load the ATM10 guide";
  elements.selectedSummary.textContent = error.message;
  console.error(error);
});
