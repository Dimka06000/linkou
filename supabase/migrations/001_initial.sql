-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon text not null default 'folder',
  position int not null default 0,
  background_video_url text,
  is_collapsed boolean default false,
  created_at timestamptz default now()
);

-- Links
create table links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  name text not null,
  url text not null,
  thumbnail_url text,
  badge text check (badge in ('prod', 'test', 'staging')),
  position int not null default 0,
  is_pinned boolean default false,
  created_at timestamptz default now()
);

create table clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  link_id uuid references links(id) on delete cascade not null,
  clicked_at timestamptz default now(),
  device text check (device in ('desktop', 'mobile'))
);

create table boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  is_public boolean default false,
  description text default '',
  created_at timestamptz default now()
);

create table board_links (
  board_id uuid references boards(id) on delete cascade not null,
  link_id uuid references links(id) on delete cascade not null,
  position int not null default 0,
  primary key (board_id, link_id)
);

alter table categories enable row level security;
alter table links enable row level security;
alter table clicks enable row level security;
alter table boards enable row level security;
alter table board_links enable row level security;

create policy "Users see own categories" on categories for all using (auth.uid() = user_id);
create policy "Users see own links" on links for all using (auth.uid() = user_id);
create policy "Users see own clicks" on clicks for all using (auth.uid() = user_id);
create policy "Users see own boards" on boards for all using (auth.uid() = user_id);
create policy "Users manage own board_links" on board_links for all using (
  board_id in (select id from boards where user_id = auth.uid())
);

create policy "Public boards readable" on boards for select using (is_public = true);
create policy "Public board links readable" on board_links for select using (
  board_id in (select id from boards where is_public = true)
);
create policy "Links in public boards readable" on links for select using (
  id in (select link_id from board_links where board_id in (select id from boards where is_public = true))
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  theme_config jsonb default '{}',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users see own profile" on profiles for all using (auth.uid() = id);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create index idx_links_user on links(user_id);
create index idx_links_category on links(category_id);
create index idx_clicks_user on clicks(user_id);
create index idx_clicks_link on clicks(link_id);
create index idx_clicks_time on clicks(clicked_at);
create index idx_boards_slug on boards(slug);
create index idx_board_links_board on board_links(board_id);
