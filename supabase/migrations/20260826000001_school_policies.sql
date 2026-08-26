alter table schools add column if not exists policies jsonb default '{}'::jsonb;
