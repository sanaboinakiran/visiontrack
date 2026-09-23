-- Vision Track — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

-- 1. Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','on_hold','completed')),
  created_at timestamptz not null default now()
);

-- 2. Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  detail text,
  status text not null default 'backlog' check (status in ('backlog','in_progress','done')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  attachment_url text,
  attachment_name text,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 3. Daily updates — a running log attached to a task or a project
create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  constraint updates_target_check check (task_id is not null or project_id is not null)
);

-- 4. Row Level Security — each user only sees their own data
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.updates enable row level security;

create policy "Users manage their own projects"
  on public.projects for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users manage their own tasks"
  on public.tasks for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Users manage their own updates"
  on public.updates for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- 5. Helpful indexes
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists updates_task_id_idx on public.updates(task_id);
create index if not exists updates_project_id_idx on public.updates(project_id);

-- 6. Sites
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  client_name text,
  contact_name text,
  contact_phone text,
  notes text,
  created_at timestamptz not null default now()
);

-- 7. Cameras / project trackers (CCTV installs)
create table if not exists public.cameras (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  location text,
  ip_address text,
  status text not null default 'planned' check (status in ('planned','installed','faulty','removed')),
  installed_date date,
  notes text,
  created_at timestamptz not null default now()
);

-- 8. Daily to-dos (personal checklist, separate from project tasks)
create table if not exists public.daily_todos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  todo_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.sites enable row level security;
alter table public.cameras enable row level security;
alter table public.daily_todos enable row level security;

create policy "Users manage their own sites" on public.sites for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users manage their own cameras" on public.cameras for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users manage their own todos" on public.daily_todos for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create index if not exists cameras_site_id_idx on public.cameras(site_id);
create index if not exists cameras_project_id_idx on public.cameras(project_id);
create index if not exists todos_owner_date_idx on public.daily_todos(owner_id, todo_date);
