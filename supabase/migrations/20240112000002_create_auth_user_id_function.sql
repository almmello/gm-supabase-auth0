-- Primeiro, garante que o schema auth existe
CREATE SCHEMA IF NOT EXISTS auth;

-- Cria ou substitui a função auth.user_id()
create or replace function auth.user_id() returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'userId', '')::text;
$$ language sql stable;