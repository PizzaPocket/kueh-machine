-- Backfill contributor_characters.default_appearance with the same
-- editor-schema look each contributor already wears in the Hub
-- (godot/hub/scripts/hub_main.gd's _contributors()). Previously this column
-- was left at its '{}'::jsonb default, so claim_contributor_character()
-- would hand a freshly-claimed character CharacterEditor's own generic
-- defaults instead of their authored appearance.
--
-- Paste this whole file into the Supabase SQL editor to apply it.

update public.contributor_characters set default_appearance = '{
  "body_preset": "soft", "height_scale": 0.94,
  "build_scale": 1.13, "chest_build_scale": 0.94, "hip_build_scale": 1.13,
  "abdomen_width_scale": 1.08, "abdomen_matches_hips": false, "is_female": true,
  "skin": "d9a47e", "hair": "171311", "hair_style": "very_long_full",
  "glasses": false, "round_glasses": false, "glasses_on_hair": false,
  "sleeve_style": "none", "top": "191919",
  "dress": true, "bottom": "191919", "shoes": "5b3a29"
}'::jsonb, updated_at = now() where contributor_key = 'amanda';

update public.contributor_characters set default_appearance = '{
  "body_preset": "soft", "height_scale": 0.94,
  "build_scale": 1.13, "chest_build_scale": 0.94, "hip_build_scale": 1.13,
  "abdomen_width_scale": 1.08, "abdomen_matches_hips": false, "is_female": true,
  "skin": "d9a47e", "hair": "171311", "hair_style": "less_shoulder",
  "glasses": true, "round_glasses": false, "glasses_on_hair": false,
  "sleeve_style": "colored_upper_arm", "top": "18283f",
  "dress": false, "bottom": "18283f", "shoes": "5b3a29"
}'::jsonb, updated_at = now() where contributor_key = 'amy';

update public.contributor_characters set default_appearance = '{
  "body_preset": "slim", "height_scale": 1.0,
  "build_scale": 0.96, "chest_build_scale": 0.92, "hip_build_scale": 1.0,
  "abdomen_width_scale": 1.0, "abdomen_matches_hips": true, "is_female": false,
  "skin": "d9a47e", "hair": "3f2a20", "hair_style": "buzzcut",
  "glasses": true, "round_glasses": true, "glasses_on_hair": false,
  "sleeve_style": "short", "top": "287fc2",
  "dress": false, "bottom": "18283f", "shoes": "5b3a29"
}'::jsonb, updated_at = now() where contributor_key = 'azri';

update public.contributor_characters set default_appearance = '{
  "body_preset": "broad", "height_scale": 1.0,
  "build_scale": 1.10, "chest_build_scale": 1.10, "hip_build_scale": 1.04,
  "abdomen_width_scale": 1.04, "abdomen_matches_hips": true, "is_female": false,
  "skin": "d9a47e", "hair": "171311", "hair_style": "hero",
  "glasses": false, "round_glasses": false, "glasses_on_hair": false,
  "sleeve_style": "short", "top": "191919",
  "dress": false, "bottom": "191919", "shoes": "fbf6ec"
}'::jsonb, updated_at = now() where contributor_key = 'ken';

update public.contributor_characters set default_appearance = '{
  "body_preset": "soft", "height_scale": 1.0,
  "build_scale": 1.13, "chest_build_scale": 0.94, "hip_build_scale": 1.13,
  "abdomen_width_scale": 1.08, "abdomen_matches_hips": false, "is_female": true,
  "skin": "d9a47e", "hair": "171311", "hair_style": "less_shoulder",
  "glasses": true, "round_glasses": false, "glasses_on_hair": false,
  "sleeve_style": "colored_upper_arm", "top": "191919",
  "dress": false, "bottom": "191919", "shoes": "5b3a29"
}'::jsonb, updated_at = now() where contributor_key = 'geraldine';

update public.contributor_characters set default_appearance = '{
  "body_preset": "soft", "height_scale": 1.0,
  "build_scale": 1.13, "chest_build_scale": 0.94, "hip_build_scale": 1.13,
  "abdomen_width_scale": 1.08, "abdomen_matches_hips": false, "is_female": true,
  "skin": "d9a47e", "hair": "6a4632", "hair_style": "less_shoulder",
  "glasses": true, "round_glasses": true, "glasses_on_hair": false,
  "sleeve_style": "none", "top": "d97b66",
  "dress": false, "bottom": "f0b429", "shoes": "5b3a29"
}'::jsonb, updated_at = now() where contributor_key = 'jesslyn';

update public.contributor_characters set default_appearance = '{
  "body_preset": "soft", "height_scale": 1.0,
  "build_scale": 1.13, "chest_build_scale": 0.94, "hip_build_scale": 1.13,
  "abdomen_width_scale": 1.08, "abdomen_matches_hips": false, "is_female": true,
  "skin": "d9a47e", "hair": "171311", "hair_style": "ponytail_short",
  "glasses": true, "round_glasses": false, "glasses_on_hair": true,
  "sleeve_style": "colored_upper_arm", "top": "150f1e",
  "dress": false, "bottom": "191919", "shoes": "5b3a29",
  "shirt_pattern": "kaixin_polka"
}'::jsonb, updated_at = now() where contributor_key = 'kaixin';

update public.contributor_characters set default_appearance = '{
  "body_preset": "broad", "height_scale": 1.0,
  "build_scale": 1.10, "chest_build_scale": 1.10, "hip_build_scale": 1.04,
  "abdomen_width_scale": 1.04, "abdomen_matches_hips": true, "is_female": false,
  "skin": "f3cfb8", "hair": "d2aa63", "hair_style": "buzzcut",
  "glasses": false, "round_glasses": false, "glasses_on_hair": false,
  "sleeve_style": "short", "top": "fbf6ec",
  "dress": false, "bottom": "18283f", "shoes": "5b3a29"
}'::jsonb, updated_at = now() where contributor_key = 'kevin';

update public.contributor_characters set default_appearance = '{
  "body_preset": "slim", "height_scale": 1.06,
  "build_scale": 0.96, "chest_build_scale": 0.92, "hip_build_scale": 1.0,
  "abdomen_width_scale": 1.0, "abdomen_matches_hips": true, "is_female": false,
  "skin": "f3cfb8", "hair": "3f2a20", "hair_style": "hero",
  "glasses": false, "round_glasses": false, "glasses_on_hair": false,
  "sleeve_style": "short", "top": "191919",
  "dress": false, "bottom": "191919", "shoes": "5b3a29"
}'::jsonb, updated_at = now() where contributor_key = 'leonard';

update public.contributor_characters set default_appearance = '{
  "body_preset": "soft", "height_scale": 1.0,
  "build_scale": 1.13, "chest_build_scale": 0.94, "hip_build_scale": 1.13,
  "abdomen_width_scale": 1.08, "abdomen_matches_hips": false, "is_female": true,
  "skin": "d9a47e", "hair": "171311", "hair_style": "ponytail_long",
  "glasses": false, "round_glasses": false, "glasses_on_hair": false,
  "sleeve_style": "colored_upper_arm", "top": "8fbf7f",
  "dress": false, "bottom": "8bb4d6", "shoes": "5b3a29"
}'::jsonb, updated_at = now() where contributor_key = 'liwei';

update public.contributor_characters set default_appearance = '{
  "body_preset": "soft", "height_scale": 1.0,
  "build_scale": 1.13, "chest_build_scale": 0.94, "hip_build_scale": 1.13,
  "abdomen_width_scale": 1.08, "abdomen_matches_hips": false, "is_female": true,
  "skin": "d9a47e", "hair": "3f2a20", "hair_style": "ponytail_long",
  "glasses": true, "round_glasses": true, "glasses_on_hair": false,
  "sleeve_style": "colored_upper_arm", "top": "fbf6ec",
  "dress": false, "bottom": "777a7c", "shoes": "287fc2"
}'::jsonb, updated_at = now() where contributor_key = 'meijun';

update public.contributor_characters set default_appearance = '{
  "body_preset": "soft", "height_scale": 0.94,
  "build_scale": 1.13, "chest_build_scale": 0.94, "hip_build_scale": 1.13,
  "abdomen_width_scale": 1.08, "abdomen_matches_hips": false, "is_female": true,
  "skin": "d9a47e", "hair": "171311", "hair_style": "less_shoulder",
  "glasses": true, "round_glasses": false, "glasses_on_hair": false,
  "sleeve_style": "long", "top": "fbf6ec",
  "dress": false, "bottom": "18283f", "shoes": "8bb4d6"
}'::jsonb, updated_at = now() where contributor_key = 'natalia';

update public.contributor_characters set default_appearance = '{
  "body_preset": "soft", "height_scale": 1.0,
  "build_scale": 1.13, "chest_build_scale": 0.94, "hip_build_scale": 1.13,
  "abdomen_width_scale": 1.08, "abdomen_matches_hips": false, "is_female": true,
  "skin": "d9a47e", "hair": "171311", "hair_style": "less_shoulder",
  "glasses": true, "round_glasses": false, "glasses_on_hair": true,
  "sleeve_style": "colored_upper_arm", "top": "777a7c",
  "dress": false, "bottom": "191919", "shoes": "777a7c"
}'::jsonb, updated_at = now() where contributor_key = 'nicole';

update public.contributor_characters set default_appearance = '{
  "body_preset": "soft", "height_scale": 0.94,
  "build_scale": 1.13, "chest_build_scale": 0.94, "hip_build_scale": 1.13,
  "abdomen_width_scale": 1.08, "abdomen_matches_hips": false, "is_female": true,
  "skin": "d9a47e", "hair": "6a4632", "hair_style": "bun",
  "glasses": false, "round_glasses": false, "glasses_on_hair": false,
  "sleeve_style": "colored_upper_arm", "top": "f2b8c6",
  "dress": false, "bottom": "18283f", "shoes": "5b3a29"
}'::jsonb, updated_at = now() where contributor_key = 'ruth';

update public.contributor_characters set default_appearance = '{
  "body_preset": "soft", "height_scale": 1.0,
  "build_scale": 1.13, "chest_build_scale": 0.94, "hip_build_scale": 1.13,
  "abdomen_width_scale": 1.08, "abdomen_matches_hips": false, "is_female": true,
  "skin": "d9a47e", "hair": "3f2a20", "hair_style": "ponytail_long",
  "glasses": false, "round_glasses": false, "glasses_on_hair": false,
  "sleeve_style": "colored_upper_arm", "top": "fbf6ec",
  "dress": false, "bottom": "d97b66", "shoes": "5b3a29"
}'::jsonb, updated_at = now() where contributor_key = 'samantha';

update public.contributor_characters set default_appearance = '{
  "body_preset": "soft", "height_scale": 1.0,
  "build_scale": 1.13, "chest_build_scale": 0.94, "hip_build_scale": 1.13,
  "abdomen_width_scale": 1.08, "abdomen_matches_hips": false, "is_female": true,
  "skin": "d9a47e", "hair": "171311", "hair_style": "full_long",
  "glasses": false, "round_glasses": false, "glasses_on_hair": false,
  "sleeve_style": "none", "top": "191919",
  "dress": false, "bottom": "18283f", "shoes": "5b3a29"
}'::jsonb, updated_at = now() where contributor_key = 'sophia';

update public.contributor_characters set default_appearance = '{
  "body_preset": "soft", "height_scale": 0.94,
  "build_scale": 1.13, "chest_build_scale": 0.94, "hip_build_scale": 1.13,
  "abdomen_width_scale": 1.08, "abdomen_matches_hips": false, "is_female": true,
  "skin": "d9a47e", "hair": "6a4632", "hair_style": "full_long",
  "glasses": false, "round_glasses": false, "glasses_on_hair": false,
  "sleeve_style": "colored_upper_arm", "top": "191919",
  "dress": false, "bottom": "8bb4d6", "shoes": "5b3a29"
}'::jsonb, updated_at = now() where contributor_key = 'viki';

-- Leonard is the only contributor already claimed (0008_leonard_contributor.sql
-- attached his account at claim time, before this appearance schema existed).
-- Refresh his character_profiles row to the same corrected look too, but only
-- if he hasn't customized it himself yet -- never overwrite a real edit.
update public.character_profiles
set appearance = (select default_appearance from public.contributor_characters where contributor_key = 'leonard'),
    updated_at = now()
where has_customized = false
  and user_id = (select owner_user_id from public.contributor_characters where contributor_key = 'leonard');
