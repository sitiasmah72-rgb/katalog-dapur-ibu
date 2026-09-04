// ============================================================
// KONFIGURASI SUPABASE
// Isikan SUPABASE_URL dan SUPABASE_ANON_KEY di bawah.
// Dapatkan nilai ini dari: Supabase Dashboard > Project Settings > API
//
// PENTING: "anon key" ini SELAMAT untuk diletakkan di sini (front-end),
// kerana ia direka untuk didedahkan secara terbuka — keselamatan
// sebenar dikawal oleh Row Level Security (RLS) yang telah disediakan
// dalam schema.sql. JANGAN sekali-kali letakkan "service_role key" di sini.
// ============================================================

const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_BUCKET = "catalog-images";

// Utiliti kongsi -------------------------------------------------
function formatPrice(currency, price) {
  return `${currency}${Number(price).toFixed(2)}`;
}

function stockBadge(status) {
  switch (status) {
    case "AVAILABLE": return { label: "AVAILABLE", cls: "badge-available", dot: "🟢" };
    case "LOW_STOCK": return { label: "LOW STOCK", cls: "badge-low", dot: "🟡" };
    case "SOLD_OUT": return { label: "SOLD OUT", cls: "badge-soldout", dot: "🔴" };
    case "HIDDEN": return { label: "HIDDEN", cls: "badge-hidden", dot: "⚪" };
    default: return { label: status, cls: "", dot: "" };
  }
}

function whatsappLink(number, message) {
  const clean = (number || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
