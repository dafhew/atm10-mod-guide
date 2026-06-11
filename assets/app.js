const state = {
  data: null,
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
  categoryTools: document.querySelector("#categoryTools"),
  visibleCount: document.querySelector("#visibleCount"),
  modSelect: document.querySelector("#modSelect"),
  searchInput: document.querySelector("#searchInput"),
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
  elements.homeMeta.textContent = `${pack.name} ${pack.version} | ${pack.minecraftVersion} | ${pack.loader}`;
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
  elements.categoryTools.innerHTML = filters
    .map((topic) => {
      const active = state.topic === topic ? " active" : "";
      return `<button class="filter${active}" type="button" data-topic="${escapeHtml(topic)}">${escapeHtml(topicLabel(topic))}</button>`;
    })
    .join("");

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

function renderList() {
  const mods = filteredMods();
  elements.visibleCount.textContent = mods.length.toLocaleString();
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
  return `
    <button class="mod-button${active}" type="button" data-id="${escapeHtml(mod.id)}">
      <strong>${escapeHtml(mod.name)}</strong>
      <span>${escapeHtml(mod.installedVersion)}${escapeHtml(itemCount)}</span>
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
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
      return `
        <details ${index < 2 ? "open" : ""}>
          <summary>${escapeHtml(section.title)}</summary>
          <div class="detail-body">
            ${section.intro ? `<p>${escapeHtml(section.intro)}</p>` : ""}
            <${listTag}>${items}</${listTag}>
          </div>
        </details>
      `;
    }),
    renderItemsSection(mod, state.itemCache.get(mod.id)),
  ].join("");

  renderSources(mod);

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

async function loadItems(mod) {
  const response = await fetch(mod.itemDataFile, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${mod.itemDataFile}`);
  return response.json();
}

function renderItemsSection(mod, loadedItems) {
  const expectedCount = Number(mod.itemCount || 0);
  if (!expectedCount) {
    return `
      <details>
        <summary>Items & blocks (0)</summary>
        <div class="detail-body">
          <p>No item/block entries were found in this mod jar's English language file. This usually means the mod is a library, client tool, performance mod, structure mod, integration, shader pack, or uses another namespace for content.</p>
        </div>
      </details>
    `;
  }

  if (!loadedItems) {
    return `
      <details>
        <summary>Items & blocks (${escapeHtml(expectedCount.toLocaleString())})</summary>
        <div class="detail-body">
          <p>Loading item and block details for this mod...</p>
        </div>
      </details>
    `;
  }

  const items = loadedItems;

  return `
    <details>
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

function renderItemCard(item) {
  const recipeTypeList = asArray(item.recipeTypes);
  const recipeTypes = recipeTypeList.length
    ? `<div class="recipe-types">${recipeTypeList.map((type) => `<span class="pill">${escapeHtml(type)}</span>`).join("")}</div>`
    : "";
  return `
    <article class="item-card">
      <div class="item-card-head">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.type)} | ${escapeHtml(item.id)}</span>
      </div>
      <dl>
        <dt>What it does</dt>
        <dd>${escapeHtml(item.purpose)}</dd>
        <dt>How to acquire it</dt>
        <dd>${escapeHtml(item.acquire)}</dd>
        <dt>How to use it</dt>
        <dd>${escapeHtml(item.use)}</dd>
      </dl>
      ${recipeTypes}
    </article>
  `;
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
    renderList();
    if (!mods.some((mod) => mod.id === state.selectedId)) setSelected(mods[0]?.id);
  });
  elements.categoryTools.addEventListener("click", (event) => {
    const button = event.target.closest("[data-topic]");
    if (!button) return;
    state.topic = button.dataset.topic;
    renderFilters();
    renderList();
    const mods = filteredMods();
    if (!mods.some((mod) => mod.id === state.selectedId)) setSelected(mods[0]?.id);
  });
  elements.categoryStrip.addEventListener("click", (event) => {
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
}

async function init() {
  const response = await fetch("data/mods.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load data/mods.json. Run npm run build:data first.");
  state.data = await response.json();
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
