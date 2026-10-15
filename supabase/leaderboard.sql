-- Capel Sound Invitational leaderboard. Run once in the Supabase SQL editor.
create table if not exists public.csi_scores (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  skipper text not null check (char_length(skipper) between 1 and 24),
  boat_name text not null check (char_length(boat_name) between 1 and 20),
  class text not null check (class in ('sabre','tornado','windsurfer')),
  wind text not null check (wind in ('light','moderate','fresh','building','shifty')),
  laps smallint not null check (laps between 1 and 2),
  time_s numeric(7,1) not null check (time_s between 60 and 7200),
  place smallint not null check (place between 1 and 20)
);
create index if not exists csi_scores_board on public.csi_scores (class, wind, time_s);
alter table public.csi_scores enable row level security;
-- The public can read times and add a time. Nobody can edit or delete through the API.
create policy "read scores" on public.csi_scores for select to anon, authenticated using (true);
create policy "add a score" on public.csi_scores for insert to anon, authenticated with check (true);
grant select, insert on public.csi_scores to anon, authenticated;
