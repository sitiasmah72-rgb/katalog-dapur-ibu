-- ============================================================
-- Rumah Dessert Dapur Ibu — Katalog QR
-- Supabase database schema
-- Jalankan skrip ini dalam Supabase SQL Editor (satu kali sahaja)
-- ============================================================

-- 1. CATEGORIES ------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. PRODUCTS ----------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references categories(id) on delete set null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  size text,
  portion text,
  ingredients text,
  notes text,
  stock_quantity int not null default 0,
  stock_status text not null default 'AVAILABLE'
    check (stock_status in ('AVAILABLE','LOW_STOCK','SOLD_OUT','HIDDEN')),
  auto_stock_status boolean not null default true, -- if true, status derives from stock_quantity
  is_featured boolean not null default false,       -- Today's Special
  is_seasonal boolean not null default false,       -- Limited / Seasonal
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. SETTINGS (single row) ---------------------------------------
create table if not exists settings (
  id int primary key default 1,
  store_name text not null default 'Rumah Dessert Dapur Ibu',
  logo_url text,
  tagline text default 'Manis yang dibuat dengan hati.',
  whatsapp text default '60192858285',
  address text,
  operating_hours text,
  instagram text,
  facebook text,
  tiktok text,
  google_maps text,
  currency text default 'RM',
  show_price boolean not null default true,
  show_sold_out boolean not null default true,
  show_ingredients boolean not null default true,
  show_stock_quantity boolean not null default false,
  enable_whatsapp_button boolean not null default true,
  low_stock_threshold int not null default 3,
  constraint single_row check (id = 1)
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- 4. AUTO-UPDATE updated_at --------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
before update on products
for each row execute function set_updated_at();

-- 5. AUTO STOCK STATUS ---------------------------------------------
-- Bila stock_quantity berubah dan auto_stock_status = true,
-- stock_status dikira automatik ikut threshold di settings.
create or replace function apply_auto_stock_status()
returns trigger as $$
declare
  threshold int;
begin
  if new.auto_stock_status then
    select low_stock_threshold into threshold from settings where id = 1;
    if new.stock_quantity <= 0 then
      new.stock_status := 'SOLD_OUT';
    elsif new.stock_quantity <= threshold then
      new.stock_status := 'LOW_STOCK';
    else
      new.stock_status := 'AVAILABLE';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_auto_stock on products;
create trigger trg_products_auto_stock
before insert or update of stock_quantity on products
for each row execute function apply_auto_stock_status();

-- 6. ROW LEVEL SECURITY --------------------------------------------
alter table categories enable row level security;
alter table products enable row level security;
alter table settings enable row level security;

-- Sesiapa boleh BACA (pelanggan tengok katalog tanpa login)
create policy if not exists "public read categories" on categories
  for select using (true);
create policy if not exists "public read products" on products
  for select using (true);
create policy if not exists "public read settings" on settings
  for select using (true);

-- Hanya admin yang login (Supabase Auth) boleh TULIS
create policy if not exists "admin write categories" on categories
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy if not exists "admin write products" on products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy if not exists "admin write settings" on settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 7. STORAGE BUCKET UNTUK GAMBAR --------------------------------
-- Jalankan ini juga (atau buat melalui Supabase Dashboard > Storage):
insert into storage.buckets (id, name, public)
values ('catalog-images', 'catalog-images', true)
on conflict (id) do nothing;

create policy if not exists "public read catalog images" on storage.objects
  for select using (bucket_id = 'catalog-images');
create policy if not exists "admin upload catalog images" on storage.objects
  for insert with check (bucket_id = 'catalog-images' and auth.role() = 'authenticated');
create policy if not exists "admin update catalog images" on storage.objects
  for update using (bucket_id = 'catalog-images' and auth.role() = 'authenticated');
create policy if not exists "admin delete catalog images" on storage.objects
  for delete using (bucket_id = 'catalog-images' and auth.role() = 'authenticated');

-- 8. DEMO DATA -----------------------------------------------------
insert into categories (name, sort_order) values
  ('Cakes', 1), ('Cheesecake', 2), ('Chocolate', 3), ('Biscoff', 4),
  ('Tart', 5), ('Pastry', 6), ('Cookies', 7), ('Dessert Box', 8),
  ('Seasonal', 9), ('Special', 10)
on conflict do nothing;

insert into products (name, category_id, description, price, image_url, size, portion, stock_quantity, is_featured)
select 'Biscoff Cheesecake', id, 'Creamy cheesecake dengan Biscoff crumble dan Biscoff sauce.', 18.00,
  'https://placehold.co/600x600/2b1b14/f7ede0?text=Biscoff+Cheesecake', '6 inci', '6-8 pax', 10, true
from categories where name = 'Cheesecake' limit 1;

insert into products (name, category_id, description, price, image_url, size, portion, stock_quantity)
select 'Chocolate Cake', id, 'Kek coklat lembut berlapis ganache coklat gelap.', 22.00,
  'https://placehold.co/600x600/2b1b14/f7ede0?text=Chocolate+Cake', '6 inci', '6-8 pax', 5
from categories where name = 'Chocolate' limit 1;

insert into products (name, category_id, description, price, image_url, size, portion, stock_quantity, is_featured)
select 'Strawberry Pistachio Tart', id, 'Tart rangup dengan custard, strawberi segar dan pistachio.', 15.00,
  'https://placehold.co/600x600/2b1b14/f7ede0?text=Strawberry+Pistachio+Tart', 'Individual', '1 pax', 8, true
from categories where name = 'Tart' limit 1;

insert into products (name, category_id, description, price, image_url, size, portion, stock_quantity)
select 'Salted Caramel Cake', id, 'Kek karamel masin dengan lapisan caramel drip.', 20.00,
  'https://placehold.co/600x600/2b1b14/f7ede0?text=Salted+Caramel+Cake', '6 inci', '6-8 pax', 0
from categories where name = 'Cakes' limit 1;

insert into products (name, category_id, description, price, image_url, size, portion, stock_quantity)
select 'Chocolate Dessert Box', id, 'Lapisan brownie, mousse coklat dan whipped cream.', 12.00,
  'https://placehold.co/600x600/2b1b14/f7ede0?text=Chocolate+Dessert+Box', 'Box kecil', '1-2 pax', 12
from categories where name = 'Dessert Box' limit 1;

insert into products (name, category_id, description, price, image_url, size, portion, stock_quantity)
select 'Cheese Ball', id, 'Kek keju bentuk bulat, ringan dan lembut.', 10.00,
  'https://placehold.co/600x600/2b1b14/f7ede0?text=Cheese+Ball', 'Kecil', '1-2 pax', 6
from categories where name = 'Cheesecake' limit 1;

insert into products (name, category_id, description, price, image_url, size, portion, stock_quantity)
select 'London Cake', id, 'Kek marble klasik, moist dan sedap dengan teh.', 16.00,
  'https://placehold.co/600x600/2b1b14/f7ede0?text=London+Cake', '6 inci', '6-8 pax', 4
from categories where name = 'Cakes' limit 1;

-- ============================================================
-- SELESAI. Lihat README.md untuk langkah seterusnya.
-- ============================================================
