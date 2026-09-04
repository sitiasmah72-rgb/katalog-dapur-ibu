// ==============================================================
// DEMO admin logic — sama fungsi macam admin.js sebenar,
// tapi semua data dalam memori sahaja (tiada Supabase, tiada login)
// ==============================================================

let categories = DEMO_CATEGORIES;
let products = DEMO_PRODUCTS;
let settings = DEMO_SETTINGS;
let editingProductId = null;
let pendingImageDataUrl = null;

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { t.style.display = "none"; }, 2200);
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach(p => p.style.display = "none");
    document.getElementById(`tab-${btn.dataset.tab}`).style.display = "block";
    if (btn.dataset.tab === "qr") renderQrCode();
  });
});

document.getElementById("resetBtn").addEventListener("click", () => location.reload());

function loadAll() {
  renderProductList();
  renderCategoryList();
  populateCategorySelect();
  fillSettingsForm();
}

function categoryName(id) {
  const c = categories.find(c => c.id === id);
  return c ? c.name : "—";
}

function renderProductList() {
  const wrap = document.getElementById("productList");
  wrap.innerHTML = "";
  if (!products.length) {
    wrap.innerHTML = `<div class="empty-state">Belum ada produk.</div>`;
    return;
  }
  products.forEach(p => {
    const row = document.createElement("div");
    row.className = "admin-product-row";
    row.innerHTML = `
      <img src="${p.image_url || ''}" alt="${p.name}" />
      <div class="info">
        <div class="name">${p.name}</div>
        <div class="sub">${categoryName(p.category_id)} · RM${Number(p.price).toFixed(2)}</div>
        <div class="stock-stepper" style="margin-top:6px;">
          <button data-action="dec" data-id="${p.id}">−</button>
          <span class="qty">${p.stock_quantity}</span>
          <button data-action="inc" data-id="${p.id}">+</button>
          <select class="status-select" data-id="${p.id}" data-action="status">
            <option value="AVAILABLE" ${p.stock_status === "AVAILABLE" ? "selected" : ""}>🟢 AVAILABLE</option>
            <option value="LOW_STOCK" ${p.stock_status === "LOW_STOCK" ? "selected" : ""}>🟡 LOW STOCK</option>
            <option value="SOLD_OUT" ${p.stock_status === "SOLD_OUT" ? "selected" : ""}>🔴 SOLD OUT</option>
            <option value="HIDDEN" ${p.stock_status === "HIDDEN" ? "selected" : ""}>⚪ HIDDEN</option>
          </select>
        </div>
      </div>
      <button class="btn-outline" data-action="edit" data-id="${p.id}" style="align-self:flex-start;">Edit</button>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll('[data-action="edit"]').forEach(b => b.onclick = () => openProductForm(b.dataset.id));
  wrap.querySelectorAll('[data-action="inc"]').forEach(b => b.onclick = () => stepStock(b.dataset.id, 1));
  wrap.querySelectorAll('[data-action="dec"]').forEach(b => b.onclick = () => stepStock(b.dataset.id, -1));
  wrap.querySelectorAll('[data-action="status"]').forEach(sel => sel.onchange = () => quickSetStatus(sel.dataset.id, sel.value));
}

function stepStock(id, delta) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  p.stock_quantity = Math.max(0, p.stock_quantity + delta);
  if (p.auto_stock_status) {
    const t = settings.low_stock_threshold;
    p.stock_status = p.stock_quantity <= 0 ? "SOLD_OUT" : (p.stock_quantity <= t ? "LOW_STOCK" : "AVAILABLE");
  }
  loadAll();
  showToast("Stock dikemaskini (demo)");
}

function quickSetStatus(id, status) {
  const p = products.find(p => p.id === id);
  p.stock_status = status;
  p.auto_stock_status = false;
  loadAll();
  showToast("Status dikemaskini (demo)");
}

function populateCategorySelect() {
  const sel = document.getElementById("p_category_id");
  sel.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}

document.getElementById("addProductBtn").addEventListener("click", () => openProductForm(null));
document.getElementById("cancelProductBtn").addEventListener("click", closeProductForm);

function openProductForm(id) {
  editingProductId = id;
  pendingImageDataUrl = null;
  const p = id ? products.find(p => p.id === id) : null;

  document.getElementById("productFormTitle").textContent = p ? "Edit Product" : "Add Product";
  document.getElementById("p_name").value = p?.name || "";
  document.getElementById("p_category_id").value = p?.category_id || (categories[0]?.id || "");
  document.getElementById("p_price").value = p?.price ?? "";
  document.getElementById("p_stock_quantity").value = p?.stock_quantity ?? 0;
  document.getElementById("p_description").value = p?.description || "";
  document.getElementById("p_size").value = p?.size || "";
  document.getElementById("p_portion").value = p?.portion || "";
  document.getElementById("p_ingredients").value = p?.ingredients || "";
  document.getElementById("p_notes").value = p?.notes || "";
  document.getElementById("p_stock_status").value = p?.stock_status || "AVAILABLE";
  document.getElementById("p_auto_stock_status").checked = p ? p.auto_stock_status : true;
  document.getElementById("p_is_featured").checked = p?.is_featured || false;
  document.getElementById("p_is_seasonal").checked = p?.is_seasonal || false;
  document.getElementById("p_is_visible").checked = p ? p.is_visible : true;

  const preview = document.getElementById("imgPreview");
  if (p?.image_url) { preview.src = p.image_url; preview.style.display = "block"; }
  else { preview.style.display = "none"; }

  document.getElementById("deleteProductBtn").style.display = p ? "inline-flex" : "none";
  document.getElementById("productModalOverlay").style.display = "flex";
}

function closeProductForm() {
  document.getElementById("productModalOverlay").style.display = "none";
}

document.getElementById("imageDropZone").addEventListener("click", () => {
  document.getElementById("imageFileInput").click();
});
document.getElementById("imageFileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    pendingImageDataUrl = ev.target.result;
    const preview = document.getElementById("imgPreview");
    preview.src = pendingImageDataUrl;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
});

document.getElementById("saveProductBtn").addEventListener("click", () => {
  const name = document.getElementById("p_name").value.trim();
  if (!name) { showToast("Nama produk diperlukan"); return; }

  const payload = {
    name,
    category_id: document.getElementById("p_category_id").value || null,
    price: parseFloat(document.getElementById("p_price").value || 0),
    stock_quantity: parseInt(document.getElementById("p_stock_quantity").value || 0, 10),
    description: document.getElementById("p_description").value.trim(),
    size: document.getElementById("p_size").value.trim(),
    portion: document.getElementById("p_portion").value.trim(),
    ingredients: document.getElementById("p_ingredients").value.trim(),
    notes: document.getElementById("p_notes").value.trim(),
    stock_status: document.getElementById("p_stock_status").value,
    auto_stock_status: document.getElementById("p_auto_stock_status").checked,
    is_featured: document.getElementById("p_is_featured").checked,
    is_seasonal: document.getElementById("p_is_seasonal").checked,
    is_visible: document.getElementById("p_is_visible").checked,
  };

  if (editingProductId) {
    const p = products.find(p => p.id === editingProductId);
    Object.assign(p, payload);
    if (pendingImageDataUrl) p.image_url = pendingImageDataUrl;
  } else {
    products.unshift({ id: "p" + Date.now(), image_url: pendingImageDataUrl || "", ...payload });
  }

  closeProductForm();
  loadAll();
  showToast("Produk disimpan (demo)");
});

document.getElementById("deleteProductBtn").addEventListener("click", () => {
  if (!editingProductId) return;
  if (!confirm("Padam produk ini? (demo)")) return;
  products = products.filter(p => p.id !== editingProductId);
  closeProductForm();
  loadAll();
  showToast("Produk dipadam (demo)");
});

function renderCategoryList() {
  const wrap = document.getElementById("categoryList");
  wrap.innerHTML = "";
  categories.forEach(c => {
    const row = document.createElement("div");
    row.className = "admin-product-row";
    row.innerHTML = `
      <div class="info">
        <div class="name">${c.name}</div>
        <div class="sub">${c.is_visible ? "Visible" : "Hidden"}</div>
      </div>
      <button class="btn-outline" data-action="toggle" data-id="${c.id}">${c.is_visible ? "Hide" : "Show"}</button>
      <button class="btn-danger" data-action="delete" data-id="${c.id}">Padam</button>
    `;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll('[data-action="toggle"]').forEach(b => b.onclick = () => {
    const c = categories.find(c => c.id === b.dataset.id);
    c.is_visible = !c.is_visible;
    loadAll();
  });
  wrap.querySelectorAll('[data-action="delete"]').forEach(b => b.onclick = () => {
    if (!confirm("Padam kategori ini? (demo)")) return;
    categories = categories.filter(c => c.id !== b.dataset.id);
    loadAll();
    showToast("Kategori dipadam (demo)");
  });
}

document.getElementById("addCategoryBtn").addEventListener("click", () => {
  const input = document.getElementById("newCategoryName");
  const name = input.value.trim();
  if (!name) return;
  categories.push({ id: "c" + Date.now(), name, sort_order: categories.length + 1, is_visible: true });
  input.value = "";
  loadAll();
  showToast("Kategori ditambah (demo)");
});

function fillSettingsForm() {
  document.getElementById("s_store_name").value = settings.store_name || "";
  document.getElementById("s_tagline").value = settings.tagline || "";
  document.getElementById("s_whatsapp").value = settings.whatsapp || "";
  document.getElementById("s_address").value = settings.address || "";
  document.getElementById("s_operating_hours").value = settings.operating_hours || "";
  document.getElementById("s_show_price").checked = settings.show_price;
  document.getElementById("s_show_sold_out").checked = settings.show_sold_out;
  document.getElementById("s_show_ingredients").checked = settings.show_ingredients;
  document.getElementById("s_enable_whatsapp_button").checked = settings.enable_whatsapp_button;
}

document.getElementById("saveSettingsBtn").addEventListener("click", () => {
  settings.store_name = document.getElementById("s_store_name").value.trim();
  settings.tagline = document.getElementById("s_tagline").value.trim();
  settings.whatsapp = document.getElementById("s_whatsapp").value.trim();
  settings.address = document.getElementById("s_address").value.trim();
  settings.operating_hours = document.getElementById("s_operating_hours").value.trim();
  settings.show_price = document.getElementById("s_show_price").checked;
  settings.show_sold_out = document.getElementById("s_show_sold_out").checked;
  settings.show_ingredients = document.getElementById("s_show_ingredients").checked;
  settings.enable_whatsapp_button = document.getElementById("s_enable_whatsapp_button").checked;
  showToast("Settings disimpan (demo — buka demo-index.html baru untuk lihat perubahan)");
});

function renderQrCode() {
  const url = "https://contoh-katalog-ibu.github.io/index.html";
  document.getElementById("qrUrlDisplay").textContent = url + "  (contoh — akan jadi URL sebenar selepas deploy)";
  const box = document.getElementById("qrcode-canvas");
  box.innerHTML = "";
  const canvas = document.createElement("canvas");
  box.appendChild(canvas);
  QRCode.toCanvas(canvas, url, { width: 240, margin: 1, color: { dark: "#2B1B14", light: "#FFFFFF" } });
}

loadAll();
