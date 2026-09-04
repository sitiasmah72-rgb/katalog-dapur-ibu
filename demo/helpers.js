// Utiliti kongsi (sama seperti versi sebenar, tanpa Supabase)
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
