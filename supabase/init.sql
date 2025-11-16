
-- Run this in Supabase SQL editor

create table if not exists events (
  id bigserial primary key,
  title text not null,
  description text,
  event_time bigint not null -- epoch ms
);

create table if not exists settings (
  id int primary key check (id = 1),
  reminder_email text
);

create table if not exists reminders_sent (
  id bigserial primary key,
  event_id bigint not null references events(id) on delete cascade,
  offset_days int not null,
  sent_at bigint not null,
  unique(event_id, offset_days)
);
