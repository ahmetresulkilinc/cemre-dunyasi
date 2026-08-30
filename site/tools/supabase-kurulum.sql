-- Cemre'nin Dünyası — bulut senkronu için tek tablo.
-- Supabase panelinde: SQL Editor → New query → bunu yapıştır → Run.
-- Güvenlik: satıra ancak "oda anahtarı" başlığını (x-oda-anahtari) bilen erişebilir.
-- Anahtar, sitedeki sihirli kelimeden tarayıcıda türetilir; hiçbir yerde yazılı durmaz.

create table if not exists public.cemre_durum (
  oda           text primary key,
  veri          jsonb       not null default '{}'::jsonb,
  guncellendi   timestamptz not null default now()
);

alter table public.cemre_durum enable row level security;

-- İstekteki x-oda-anahtari başlığı
create or replace function public.oda_anahtari() returns text
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.headers', true), '')::json ->> 'x-oda-anahtari',
    ''
  );
$$;

drop policy if exists "oda sahibi okur"    on public.cemre_durum;
drop policy if exists "oda sahibi yazar"   on public.cemre_durum;
drop policy if exists "oda sahibi gunceller" on public.cemre_durum;

create policy "oda sahibi okur" on public.cemre_durum
  for select using (oda = public.oda_anahtari() and length(public.oda_anahtari()) >= 24);

create policy "oda sahibi yazar" on public.cemre_durum
  for insert with check (oda = public.oda_anahtari() and length(public.oda_anahtari()) >= 24);

create policy "oda sahibi gunceller" on public.cemre_durum
  for update using (oda = public.oda_anahtari() and length(public.oda_anahtari()) >= 24)
          with check (oda = public.oda_anahtari() and length(public.oda_anahtari()) >= 24);

-- guncellendi otomatik
create or replace function public.cemre_durum_dokun() returns trigger
language plpgsql as $$
begin new.guncellendi := now(); return new; end;
$$;

drop trigger if exists cemre_durum_dokun on public.cemre_durum;
create trigger cemre_durum_dokun before update on public.cemre_durum
for each row execute function public.cemre_durum_dokun();
