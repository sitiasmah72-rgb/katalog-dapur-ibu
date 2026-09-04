// ==============================================================
// DATA CONTOH untuk DEMO MODE sahaja.
// Tiada sambungan Supabase — semua data ini sementara (hilang bila refresh).
// ==============================================================

let DEMO_SETTINGS = {
  store_name: "Rumah Dessert Dapur Ibu",
  tagline: "Manis yang dibuat dengan hati.",
  whatsapp: "60192858285",
  address: "Telok Panglima Garang, Selangor",
  operating_hours: "Isnin–Sabtu, 9am–6pm",
  instagram: "https://instagram.com",
  facebook: "https://facebook.com",
  tiktok: "https://tiktok.com",
  google_maps: "",
  currency: "RM",
  show_price: true,
  show_sold_out: true,
  show_ingredients: true,
  show_stock_quantity: false,
  enable_whatsapp_button: true,
  low_stock_threshold: 3,
};

let DEMO_CATEGORIES = [
  { id: "c1", name: "Cakes", sort_order: 1, is_visible: true },
  { id: "c2", name: "Cheesecake", sort_order: 2, is_visible: true },
  { id: "c3", name: "Chocolate", sort_order: 3, is_visible: true },
  { id: "c4", name: "Tart", sort_order: 4, is_visible: true },
  { id: "c5", name: "Dessert Box", sort_order: 5, is_visible: true },
];

let DEMO_PRODUCTS = [
  {
    id: "p1", name: "Biscoff Cheesecake", category_id: "c2",
    description: "Creamy cheesecake dengan Biscoff crumble dan Biscoff sauce.",
    price: 18.00, image_url: "https://placehold.co/600x600/2b1b14/f7ede0?text=Biscoff+Cheesecake",
    size: "6 inci", portion: "6-8 pax", ingredients: "Biskut Biscoff, cream cheese, gula, telur, sour cream",
    notes: "Simpan dalam peti sejuk.", stock_quantity: 10, stock_status: "AVAILABLE",
    auto_stock_status: true, is_featured: true, is_seasonal: false, is_visible: true,
  },
  {
    id: "p2", name: "Chocolate Cake", category_id: "c3",
    description: "Kek coklat lembut berlapis ganache coklat gelap.",
    price: 22.00, image_url: "https://placehold.co/600x600/2b1b14/f7ede0?text=Chocolate+Cake",
    size: "6 inci", portion: "6-8 pax", ingredients: "Coklat gelap, tepung, telur, mentega",
    notes: "", stock_quantity: 5, stock_status: "AVAILABLE",
    auto_stock_status: true, is_featured: false, is_seasonal: false, is_visible: true,
  },
  {
    id: "p3", name: "Strawberry Pistachio Tart", category_id: "c4",
    description: "Tart rangup dengan custard, strawberi segar dan pistachio.",
    price: 15.00, image_url: "https://placehold.co/600x600/2b1b14/f7ede0?text=Strawberry+Tart",
    size: "Individual", portion: "1 pax", ingredients: "Pastri, custard vanilla, strawberi, pistachio",
    notes: "Terbaik dimakan sejuk.", stock_quantity: 8, stock_status: "AVAILABLE",
    auto_stock_status: true, is_featured: true, is_seasonal: false, is_visible: true,
  },
  {
    id: "p4", name: "Salted Caramel Cake", category_id: "c1",
    description: "Kek karamel masin dengan lapisan caramel drip.",
    price: 20.00, image_url: "https://placehold.co/600x600/2b1b14/f7ede0?text=Salted+Caramel",
    size: "6 inci", portion: "6-8 pax", ingredients: "Karamel, mentega masin, tepung, telur",
    notes: "", stock_quantity: 0, stock_status: "SOLD_OUT",
    auto_stock_status: true, is_featured: false, is_seasonal: false, is_visible: true,
  },
  {
    id: "p5", name: "Chocolate Dessert Box", category_id: "c5",
    description: "Lapisan brownie, mousse coklat dan whipped cream.",
    price: 12.00, image_url: "https://placehold.co/600x600/2b1b14/f7ede0?text=Dessert+Box",
    size: "Box kecil", portion: "1-2 pax", ingredients: "Brownie, mousse coklat, whipped cream",
    notes: "", stock_quantity: 12, stock_status: "AVAILABLE",
    auto_stock_status: true, is_featured: false, is_seasonal: false, is_visible: true,
  },
  {
    id: "p6", name: "London Cake", category_id: "c1",
    description: "Kek marble klasik, moist dan sedap dengan teh.",
    price: 16.00, image_url: "https://placehold.co/600x600/2b1b14/f7ede0?text=London+Cake",
    size: "6 inci", portion: "6-8 pax", ingredients: "Tepung, telur, mentega, coklat",
    notes: "", stock_quantity: 2, stock_status: "LOW_STOCK",
    auto_stock_status: true, is_featured: false, is_seasonal: false, is_visible: true,
  },
];
