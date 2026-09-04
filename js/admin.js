// ==============================================================
// Rumah Dessert Dapur Ibu — Admin dashboard logic
// ==============================================================

let categories = [];
let products = [];
let settings = {};
let editingProductId = null;
let pendingImageFile = null;

// ---------- Toast ----------
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { t.style.display = "none"; }, 2200);
}

// ---------- Auth ----------
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    document.getElementById("loginView").style.display = "none";
    document.getElementById("dashView").style.display = "block";
    await loadAll();
  } else {
    document.getElementById("loginView").style.display = "block";
    document.getElementById("dashView").style.display = "none";
  }
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) { errEl.textContent = "Email atau password salah."; return; }
  checkAuth();
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  checkAuth();
});

// ---------- Tabs ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach(p => p.style.display = "none");
    document.getElementById(`tab-${btn.dataset.tab}`).style.display = "block";
    if (btn.dataset.tab === "qr") renderQrCode();
  });
});

// ---------- Load data ----------
async function loadAll() {
  const [{ data: cats }, { data: prods }, { data: sett }] = await Promise.all([
    supabaseClient.from("categories").select("*").order("sort_order"),
    supabaseClient.from("products").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("settings").select("*").eq("id", 1).single(),
  ]);
  categories = cats || [];
  products = prods || [];
  settings = sett || {};
  renderProductList();
  renderCategoryList();
  populateCategorySelect();
  fillSettingsForm();
}

// ================================================================
// PRODUCTS
// ================================================================
function categoryName(id) {
  const c = categories.find(c => c.id === id);
  return c ? c.name : "—";
}

function renderProductList() {
  const wrap = document.getElementById("productList");
  wrap.innerHTML = "";
  if (!products.length) {
    wrap.innerHTML = `<div class="empty-state">Belum ada produk. Tekan "Add New Product" untuk mula.</div>`;
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

async function stepStock(id, delta) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  const newQty = Math.max(0, p.stock_quantity + delta);
  const { error } = await supabaseClient.from("products")
    .update({ stock_quantity: newQty })
    .eq("id", id);
  if (error) { showToast("Gagal update stock"); return; }
  p.stock_quantity = newQty;
  await loadAll();
  showToast("Stock dikemaskini");
}

async function quickSetStatus(id, status) {
  // manual status override -> auto_stock_status = false
  const { error } = await supabaseClient.from("products")
    .update({ stock_status: status, auto_stock_status: false })
    .eq("id", id);
  if (error) { showToast("Gagal update status"); return; }
  await loadAll();
  showToast("Status dikemaskini");
}

function populateCategorySelect() {
  const sel = document.getElementById("p_category_id");
  sel.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
}

document.getElementById("addProductBtn").addEventListener("click", () => openProductForm(null));
document.getElementById("cancelProductBtn").addEventListener("click", closeProductForm);

function openProductForm(id) {
  editingProductId = id;
  pendingImageFile = null;
  document.getElementById("productFormError").textContent = "";
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
  pendingImageFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const preview = document.getElementById("imgPreview");
    preview.src = ev.target.result;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
});

// Compress + upload image to Supabase Storage, return public URL
async function uploadImageIfNeeded(existingUrl) {
  if (!pendingImageFile) return existingUrl || null;
  const compressed = await compressImage(pendingImageFile, 1000, 0.8);
  const ext = "jpg";
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabaseClient.storage.from(STORAGE_BUCKET).upload(path, compressed, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function compressImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
      else if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("saveProductBtn").addEventListener("click", async () => {
  const errEl = document.getElementById("productFormError");
  errEl.textContent = "";
  const name = document.getElementById("p_name").value.trim();
  if (!name) { errEl.textContent = "Nama produk diperlukan."; return; }

  const saveBtn = document.getElementById("saveProductBtn");
  saveBtn.textContent = "Menyimpan...";
  saveBtn.disabled = true;

  try {
    const existing = editingProductId ? products.find(p => p.id === editingProductId) : null;
    const image_url = await uploadImageIfNeeded(existing?.image_url);

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
      image_url,
    };

    let error;
    if (editingProductId) {
      ({ error } = await supabaseClient.from("products").update(payload).eq("id", editingProductId));
    } else {
      ({ error } = await supabaseClient.from("products").insert(payload));
    }
    if (error) throw error;

    closeProductForm();
    await loadAll();
    showToast("Produk disimpan");
  } catch (err) {
    errEl.textContent = "Gagal simpan: " + (err.message || err);
  } finally {
    saveBtn.textContent = "Save";
    saveBtn.disabled = false;
  }
});

document.getElementById("deleteProductBtn").addEventListener("click", async () => {
  if (!editingProductId) return;
  if (!confirm("Padam produk ini? Tindakan ini tidak boleh diundur.")) return;
  const { error } = await supabaseClient.from("products").delete().eq("id", editingProductId);
  if (error) { showToast("Gagal padam"); return; }
  closeProductForm();
  await loadAll();
  showToast("Produk dipadam");
});

// ================================================================
// CATEGORIES
// ================================================================
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
  wrap.querySelectorAll('[data-action="toggle"]').forEach(b => b.onclick = () => toggleCategory(b.dataset.id));
  wrap.querySelectorAll('[data-action="delete"]').forEach(b => b.onclick = () => deleteCategory(b.dataset.id));
}

document.getElementById("addCategoryBtn").addEventListener("click", async () => {
  const input = document.getElementById("newCategoryName");
  const name = input.value.trim();
  if (!name) return;
  const { error } = await supabaseClient.from("categories").insert({ name, sort_order: categories.length + 1 });
  if (error) { showToast("Gagal tambah kategori"); return; }
  input.value = "";
  await loadAll();
  showToast("Kategori ditambah");
});

async function toggleCategory(id) {
  const c = categories.find(c => c.id === id);
  const { error } = await supabaseClient.from("categories").update({ is_visible: !c.is_visible }).eq("id", id);
  if (error) { showToast("Gagal"); return; }
  await loadAll();
}

async function deleteCategory(id) {
  if (!confirm("Padam kategori ini?")) return;
  const { error } = await supabaseClient.from("categories").delete().eq("id", id);
  if (error) { showToast("Gagal padam kategori"); return; }
  await loadAll();
  showToast("Kategori dipadam");
}

// ================================================================
// SETTINGS
// ================================================================
function fillSettingsForm() {
  document.getElementById("s_store_name").value = settings.store_name || "";
  document.getElementById("s_logo_url").value = settings.logo_url || "";
  document.getElementById("s_tagline").value = settings.tagline || "";
  document.getElementById("s_whatsapp").value = settings.whatsapp || "";
  document.getElementById("s_address").value = settings.address || "";
  document.getElementById("s_operating_hours").value = settings.operating_hours || "";
  document.getElementById("s_instagram").value = settings.instagram || "";
  document.getElementById("s_facebook").value = settings.facebook || "";
  document.getElementById("s_tiktok").value = settings.tiktok || "";
  document.getElementById("s_google_maps").value = settings.google_maps || "";
  document.getElementById("s_currency").value = settings.currency || "RM";
  document.getElementById("s_show_price").checked = settings.show_price;
  document.getElementById("s_show_sold_out").checked = settings.show_sold_out;
  document.getElementById("s_show_ingredients").checked = settings.show_ingredients;
  document.getElementById("s_show_stock_quantity").checked = settings.show_stock_quantity;
  document.getElementById("s_enable_whatsapp_button").checked = settings.enable_whatsapp_button;
  document.getElementById("s_low_stock_threshold").value = settings.low_stock_threshold ?? 3;
}

document.getElementById("saveSettingsBtn").addEventListener("click", async () => {
  const payload = {
    store_name: document.getElementById("s_store_name").value.trim(),
    logo_url: document.getElementById("s_logo_url").value.trim(),
    tagline: document.getElementById("s_tagline").value.trim(),
    whatsapp: document.getElementById("s_whatsapp").value.trim(),
    address: document.getElementById("s_address").value.trim(),
    operating_hours: document.getElementById("s_operating_hours").value.trim(),
    instagram: document.getElementById("s_instagram").value.trim(),
    facebook: document.getElementById("s_facebook").value.trim(),
    tiktok: document.getElementById("s_tiktok").value.trim(),
    google_maps: document.getElementById("s_google_maps").value.trim(),
    currency: document.getElementById("s_currency").value.trim() || "RM",
    show_price: document.getElementById("s_show_price").checked,
    show_sold_out: document.getElementById("s_show_sold_out").checked,
    show_ingredients: document.getElementById("s_show_ingredients").checked,
    show_stock_quantity: document.getElementById("s_show_stock_quantity").checked,
    enable_whatsapp_button: document.getElementById("s_enable_whatsapp_button").checked,
    low_stock_threshold: parseInt(document.getElementById("s_low_stock_threshold").value || 3, 10),
  };
  const { error } = await supabaseClient.from("settings").update(payload).eq("id", 1);
  if (error) { showToast("Gagal simpan settings"); return; }
  await loadAll();
  showToast("Settings disimpan");
});

// ================================================================
// QR CODE
// ================================================================
function catalogUrl() {
  // Katalog pelanggan = index.html pada domain yang sama
  return location.origin + location.pathname.replace(/admin\.html$/, "index.html");
}

function renderQrCode() {
  const url = catalogUrl();
  document.getElementById("qrUrlDisplay").textContent = url;
  const box = document.getElementById("qrcode-canvas");
  box.innerHTML = "";
  const canvas = document.createElement("canvas");
  box.appendChild(canvas);
  QRCode.toCanvas(canvas, url, { width: 240, margin: 1, color: { dark: "#2B1B14", light: "#FFFFFF" } });
}

document.getElementById("downloadPngBtn").addEventListener("click", () => {
  const canvas = document.querySelector("#qrcode-canvas canvas");
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = "qrcode-dapur-ibu.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

document.getElementById("downloadSvgBtn").addEventListener("click", () => {
  QRCode.toString(catalogUrl(), { type: "svg", margin: 1, color: { dark: "#2B1B14", light: "#FFFFFF" } }, (err, svg) => {
    if (err) { showToast("Gagal jana SVG"); return; }
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = "qrcode-dapur-ibu.svg";
    link.href = URL.createObjectURL(blob);
    link.click();
  });
});

document.getElementById("printQrBtn").addEventListener("click", () => {
  const canvas = document.querySelector("#qrcode-canvas canvas");
  if (!canvas) return;
  const dataUrl = canvas.toDataURL("image/png");
  const win = window.open("", "_blank");
  win.document.write(`
    <html><head><title>Print QR Code</title></head>
    <body style="text-align:center; font-family:sans-serif; padding:40px;">
      <h2>${settings.store_name || "Rumah Dessert Dapur Ibu"}</h2>
      <img src="${dataUrl}" style="width:300px;height:300px;" />
      <p>Scan untuk lihat katalog</p>
      <script>window.print();</script>
    </body></html>
  `);
  win.document.close();
});

// ---------- Boot ----------
checkAuth();
