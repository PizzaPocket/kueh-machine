-- Fixes a drift between hub_main.gd's authored appearance for Jesslyn
-- ("full_long" hair) and 0009_contributor_default_appearance.sql's own
-- backfill for her, which had "less_shoulder" (Bob) instead -- that DB row
-- is what's actually live, since she hasn't claimed her character yet, so
-- the Hub was showing a Bob no code change could fix. Also darkens her hair
-- one shade (CharacterEditor.HAIR_SWATCHES: "6a4632" -> "3f2a20").
--
-- Paste this whole file into the Supabase SQL editor to apply it, same as
-- 0009 itself.

update public.contributor_characters set default_appearance = jsonb_set(
  jsonb_set(default_appearance, '{hair_style}', '"full_long"'),
  '{hair}', '"3f2a20"'
), updated_at = now()
where contributor_key = 'jesslyn';

-- Generates her claim link. Copy the returned token and send her:
--   https://kuehmachine.com/claim-character?code=<token>
-- (30-day expiry; re-run this to issue a fresh one if it lapses unused --
-- doing so automatically revokes any still-outstanding invite for her, per
-- admin_create_character_invite()'s own logic in 0007_character_profiles.sql.)
select public.admin_create_character_invite('jesslyn');
