-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Drop existing policies if any (to avoid duplicates)
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- Insert Policy: allow users to insert their own profile
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

-- Select Policy: allow users to read their own profile
create policy "Users can read their own profile"
on public.profiles
for select
using (auth.uid() = id);

-- Update Policy: allow users to update their own profile
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id);

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

-- Drop old trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger to run function after user signs up
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
