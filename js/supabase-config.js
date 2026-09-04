// ============================================================
// KONFIGURASI SUPABASE
// ============================================================

const SUPABASE_URL = "https://prqajitqdccmrrfrrdeg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_YzkpNXszyMINwminhlULJg_u2DYL6NM";

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
