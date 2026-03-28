-- supabase/migrations/002_jarvis.sql

-- Integration tokens (OAuth + API keys, encrypted)
create table integration_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  unique(user_id, provider)
);

alter table integration_tokens enable row level security;
create policy "Users see own tokens" on integration_tokens for all using (auth.uid() = user_id);

-- User preferences
create table user_preferences (
  id uuid primary key references auth.users(id) on delete cascade,
  sidebar_order jsonb default '[]',
  dashboard_layout jsonb default '[]',
  voice_id text default 'default',
  theme text default 'dark',
  default_calendar_view text default 'day',
  created_at timestamptz default now()
);

alter table user_preferences enable row level security;
create policy "Users see own prefs" on user_preferences for all using (auth.uid() = id);

-- Auto-create preferences on signup
create or replace function handle_new_user_prefs()
returns trigger as $$
begin
  insert into user_preferences (id) values (new.id);
  return new;
exception when others then
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_prefs
  after insert on auth.users
  for each row execute function handle_new_user_prefs();
