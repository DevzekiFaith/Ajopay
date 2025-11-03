-- Fix transactions constraints to support wallet send/receive
-- - Allow types: send, receive, transfer (alongside existing)
-- - Allow negative amounts for debits (drop > 0 check)
-- - Make reference unique per user (composite), not globally

begin;

-- Drop type constraint and recreate with full set
alter table if exists public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (type in (
    'deposit',
    'withdrawal',
    'transfer',
    'send',
    'receive',
    'commission',
    'penalty',
    'group_contribution',
    'group_withdrawal',
    'group_payout',
    'group_penalty',
    'group_commission'
  ));

-- Relax amount constraint to allow negatives; drop old unnamed check if present
alter table if exists public.transactions
  drop constraint if exists transactions_amount_kobo_check;

-- Optional: enforce non-zero amounts
alter table public.transactions
  add constraint transactions_amount_kobo_nonzero_check
  check (amount_kobo <> 0);

-- Adjust unique constraint on reference: drop global unique if present, add composite unique
alter table if exists public.transactions
  drop constraint if exists transactions_reference_key;

-- Some environments may have a differently named unique constraint; attempt generic drop
do $$
begin
  if exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'transactions'
      and c.contype = 'u'
      and c.conname like '%reference%'
  ) then
    execute (
      select 'alter table public.transactions drop constraint ' || quote_ident(c.conname)
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      where t.relname = 'transactions'
        and c.contype = 'u'
        and c.conname like '%reference%'
      limit 1
    );
  end if;
end $$;

-- Add composite unique on (user_id, reference)
alter table public.transactions
  add constraint transactions_user_reference_unique
  unique (user_id, reference);

commit;










