-- Cemre'nin Dünyası — FOTOĞRAF senkronu için ikinci tablo.
-- Supabase panelinde: SQL Editor → New query → yapıştır → Run.
-- Aynı "oda anahtarı" güvenliği: kelimeyi bilmeyen erişemez.

create table if not exists public.cemre_foto (
  oda           text        not null,
  magaza        text        not null,
  kayit_id      text        not null,
  veri          text        not null,
  guncellendi   timestamptz not null default now(),
  primary key (oda, magaza, kayit_id)
);

alter table public.cemre_foto enable row level security;

drop policy if exists "foto okur"      on public.cemre_foto;
drop policy if exists "foto yazar"     on public.cemre_foto;
drop policy if exists "foto gunceller" on public.cemre_foto;
drop policy if exists "foto siler"     on public.cemre_foto;

create policy "foto okur" on public.cemre_foto
  for select using (oda = public.oda_anahtari() and length(public.oda_anahtari()) >= 24);

create policy "foto yazar" on public.cemre_foto
  for insert with check (oda = public.oda_anahtari() and length(public.oda_anahtari()) >= 24);

create policy "foto gunceller" on public.cemre_foto
  for update using (oda = public.oda_anahtari() and length(public.oda_anahtari()) >= 24)
          with check (oda = public.oda_anahtari() and length(public.oda_anahtari()) >= 24);

create policy "foto siler" on public.cemre_foto
  for delete using (oda = public.oda_anahtari() and length(public.oda_anahtari()) >= 24);
