// ==============================================================
// Rumah Dessert Dapur Ibu — Customer catalog logic
// ==============================================================

let state = {
  settings: null,
  categories: [],
  products: [],
  activeCategory: "Semua",
  search: "",
};

async function init() {
  const [{ data: settings }, { data: categories }, { data: products }] = await Promise.all([
    supabaseClient.from("settings").select("*").eq("id", 1).single(),
    supabaseClient.from("categories").select("*").eq("is_visible", true).order("sort_order"),
    supabaseClient.from("products").select("*").eq("is_visible", true),
  ]);

  state.settings = settings || {};
  state.categories = categories || [];
  state.products = (products || []).filter(p => {
    if (p.stock_status === "HIDDEN") return false;
    if (p.stock_status === "SOLD_OUT" && state.settings.show_sold_out === false) return false;
    return true;
  });

  applySettingsToDOM();
  renderCategoryChips();
  renderSpecials();
  renderGrid();
  wireEvents();
}

function applySettingsToDOM() {
  const s = state.settings;
 document.getElementById("storeName").innerHTML = `<img src="logo-rumah-dessert.png" alt="Rumah Dessert Dapur Ibu" style="max-width:150px;height:auto;">`;
  document.getElementById("footerStoreName").textContent = s.store_name || "Rumah Dessert Dapur Ibu";
  document.getElementById("tagline").textContent = s.tagline || "";
  document.title = `${s.store_name || "Katalog"} — Katalog`;

  document.getElementById("footerHours").textContent = s.operating_hours ? `🕒 ${s.operating_hours}` : "";
  document.getElementById("footerAddress").textContent = s.address ? `📍 ${s.address}` : "";
  document.getElementById("footerWhatsapp").textContent = s.whatsapp ? `📞 ${s.whatsapp}` : "";

  const socialWrap = document.getElementById("footerSocial");
  socialWrap.innerHTML = "";
  const socials = [
    ["Instagram", s.instagram], ["Facebook", s.facebook],
    ["TikTok", s.tiktok], ["Google Maps", s.google_maps],
  ];
  socials.forEach(([label, url]) => {
    if (url) {
      const a = document.createElement("a");
      a.href = url; a.target = "_blank"; a.rel = "noopener"; a.textContent = label;
      socialWrap.appendChild(a);
    }
  });

  const fab = document.getElementById("fabWhatsapp");
  if (s.enable_whatsapp_button && s.whatsapp) {
    fab.style.display = "flex";
    fab.href = whatsappLink(s.whatsapp, `Hi ${s.store_name || "Rumah Dessert Dapur Ibu"}, saya berminat untuk order.`);
    fab.target = "_blank";
  }
}

function renderCategoryChips() {
  const wrap = document.getElementById("catScroll");
  wrap.innerHTML = "";
  const all = ["Semua", ...state.categories.map(c => c.name)];
  all.forEach(name => {
    const chip = document.createElement("button");
    chip.className = "chip" + (name === state.activeCategory ? " active" : "");
    chip.textContent = name;
    chip.onclick = () => {
      state.activeCategory = name;
      renderCategoryChips();
      renderGrid();
    };
    wrap.appendChild(chip);
  });
}

function renderSpecials() {
  const specials = state.products.filter(p => p.is_featured && p.stock_status !== "HIDDEN");
  const strip = document.getElementById("specialStrip");
  const scroll = document.getElementById("specialScroll");
  if (!specials.length) { strip.style.display = "none"; return; }
  strip.style.display = "block";
  scroll.innerHTML = "";
  specials.forEach(p => {
    const el = document.createElement("div");
    el.className = "special-card";
    el.onclick = () => openModal(p);
    el.innerHTML = `
      <img src="${p.image_url || ''}" alt="${p.name}" loading="lazy" />
      <div class="info">
        <div class="name">${p.name}</div>
        ${state.settings.show_price ? `<div class="price">${formatPrice(state.settings.currency, p.price)}</div>` : ""}
      </div>`;
    scroll.appendChild(el);
  });
}

function categoryNameById(id) {
  const c = state.categories.find(c => c.id === id);
  return c ? c.name : "";
}

function renderGrid() {
  const grid = document.getElementById("productGrid");
  const q = state.search.trim().toLowerCase();

  const filtered = state.products.filter(p => {
    if (state.activeCategory !== "Semua" && categoryNameById(p.category_id) !== state.activeCategory) return false;
    if (q) {
      const hay = `${p.name} ${categoryNameById(p.category_id)} ${p.description || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  grid.innerHTML = "";
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Tiada dessert dijumpai. Cuba carian lain 🍰</div>`;
    return;
  }

  filtered.forEach(p => {
    const badge = stockBadge(p.stock_status);
    const card = document.createElement("div");
    card.className = "card" + (p.stock_status === "SOLD_OUT" ? " soldout" : "");
    card.onclick = () => openModal(p);
    card.innerHTML = `
      <div class="img-wrap">
        <img src="${p.image_url || ''}" alt="${p.name}" loading="lazy" />
        <span class="stock-tag ${badge.cls}">${badge.dot} ${badge.label}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-desc">${p.description || ""}</div>
        ${state.settings.show_price ? `<div class="card-price">${formatPrice(state.settings.currency, p.price)}</div>` : ""}
      </div>`;
    grid.appendChild(card);
  });
}

function openModal(p) {
  document.getElementById("modalImg").src = p.image_url || "";
  document.getElementById("modalImg").alt = p.name;
  document.getElementById("modalName").textContent = p.name;
  document.getElementById("modalPrice").textContent = state.settings.show_price ? formatPrice(state.settings.currency, p.price) : "";

  const metaParts = [];
  if (p.size) metaParts.push(`Saiz: ${p.size}`);
  if (p.portion) metaParts.push(`Portion: ${p.portion}`);
  if (state.settings.show_stock_quantity) metaParts.push(`Stock: ${p.stock_quantity}`);
  const badge = stockBadge(p.stock_status);
  metaParts.push(`${badge.dot} ${badge.label}`);
  document.getElementById("modalMeta").innerHTML = metaParts.map(m => `<span>${m}</span>`).join("");

  document.getElementById("modalDesc").textContent = p.description || "-";

  const ingWrap = document.getElementById("modalIngWrap");
  if (state.settings.show_ingredients && p.ingredients) {
    ingWrap.style.display = "block";
    document.getElementById("modalIng").textContent = p.ingredients;
  } else ingWrap.style.display = "none";

  const notesWrap = document.getElementById("modalNotesWrap");
  if (p.notes) {
    notesWrap.style.display = "block";
    document.getElementById("modalNotes").textContent = p.notes;
  } else notesWrap.style.display = "none";

  const waBtn = document.getElementById("modalWhatsapp");
  if (state.settings.enable_whatsapp_button && p.stock_status !== "SOLD_OUT") {
    waBtn.style.display = "flex";
    waBtn.classList.remove("disabled");
    waBtn.href = whatsappLink(
      state.settings.whatsapp,
      `Hi ${state.settings.store_name || "Rumah Dessert Dapur Ibu"}, saya berminat untuk order ${p.name}.`
    );
  } else if (p.stock_status === "SOLD_OUT") {
    waBtn.style.display = "flex";
    waBtn.classList.add("disabled");
    waBtn.textContent = "Sold Out";
  } else {
    waBtn.style.display = "none";
  }

  document.getElementById("modalOverlay").style.display = "flex";
  document.body.style.overflow = "hidden";

  // Kemaskini URL supaya boleh "share product"
  history.replaceState(null, "", `#product-${p.id}`);
}

function closeModal() {
  document.getElementById("modalOverlay").style.display = "none";
  document.body.style.overflow = "";
  history.replaceState(null, "", location.pathname);
}

function wireEvents() {
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });
  document.getElementById("searchInput").addEventListener("input", (e) => {
    state.search = e.target.value;
    renderGrid();
  });

  // Buka terus produk jika URL ada #product-<id> (untuk "share product")
  if (location.hash.startsWith("#product-")) {
    const id = location.hash.replace("#product-", "");
    const p = state.products.find(p => p.id === id);
    if (p) openModal(p);
  }
}

init();
