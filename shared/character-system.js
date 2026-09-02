// Shared Kueh Machine account-character API. Authentication remains owned by
// account-widget.js; this layer only normalizes character persistence and
// contributor ownership for web pages and the Godot JavaScript bridge.
(function () {
  'use strict';
  if (window.KuehCharacters) return;

  var SCHEMA_VERSION = 1;
  var listeners = [];
  var state = { userId: null, appearance: null, contributor: null, contributors: [], ready: false };

  function client() {
    return window.KuehAccount && window.KuehAccount.getClient();
  }

  function emit() {
    listeners.slice().forEach(function (fn) { fn(getState()); });
    window.dispatchEvent(new CustomEvent('kueh-character-change', { detail: getState() }));
  }

  function getState() {
    return JSON.parse(JSON.stringify(state));
  }

  async function refresh() {
    await window.KuehAccount.ready;
    var db = client();
    var user = window.KuehAccount.getUser();
    state.userId = user ? user.id : null;

    var contributorResult = await db.from('contributor_characters')
      .select('contributor_key,display_name,owner_user_id,default_appearance');
    if (contributorResult.error) throw contributorResult.error;
    state.contributors = contributorResult.data || [];
    var ownerIds = state.contributors.map(function (item) { return item.owner_user_id; }).filter(Boolean);
    if (ownerIds.length) {
      var ownerProfiles = await db.from('character_profiles').select('user_id,appearance').in('user_id', ownerIds);
      if (ownerProfiles.error) throw ownerProfiles.error;
      var byOwner = {};
      (ownerProfiles.data || []).forEach(function (profile) { byOwner[profile.user_id] = profile.appearance; });
      state.contributors.forEach(function (item) { item.owner_appearance = byOwner[item.owner_user_id] || null; });
    }
    state.contributor = user
      ? state.contributors.find(function (item) { return item.owner_user_id === user.id; }) || null
      : null;

    state.appearance = null;
    if (user) {
      var profileResult = await db.from('character_profiles')
        .select('appearance,schema_version,has_customized').eq('user_id', user.id).maybeSingle();
      if (profileResult.error) throw profileResult.error;
      state.appearance = profileResult.data ? profileResult.data.appearance : null;
    }
    state.ready = true;
    emit();
    return getState();
  }

  async function saveAppearance(appearance) {
    await window.KuehAccount.ready;
    var user = window.KuehAccount.getUser();
    if (!user) throw new Error('Sign in before saving your character.');
    var result = await client().from('character_profiles').upsert({
      user_id: user.id,
      appearance: appearance,
      schema_version: SCHEMA_VERSION,
      has_customized: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' }).select('appearance').single();
    if (result.error) throw result.error;
    state.appearance = result.data.appearance;
    emit();
    return state.appearance;
  }

  async function claimContributor(token) {
    await window.KuehAccount.ready;
    if (!window.KuehAccount.getUser()) throw new Error('Sign in before claiming a character.');
    var result = await client().rpc('claim_contributor_character', { p_token: token });
    if (result.error) throw result.error;
    await refresh();
    return result.data && result.data[0];
  }

  function resolvedContributors() {
    return state.contributors.map(function (item) {
      return {
        key: item.contributor_key,
        displayName: item.display_name,
        ownerUserId: item.owner_user_id,
        appearance: item.owner_appearance && Object.keys(item.owner_appearance).length
          ? item.owner_appearance : item.default_appearance
      };
    });
  }

  window.KuehCharacters = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    refresh: refresh,
    getState: getState,
    getResolvedContributors: resolvedContributors,
    saveAppearance: saveAppearance,
    claimContributor: claimContributor,
    onChange: function (fn) {
      listeners.push(fn);
      return function () { var i = listeners.indexOf(fn); if (i !== -1) listeners.splice(i, 1); };
    },
    // Opt-in, not automatic: "Edit character" only does anything on a page
    // that actually consumes window.kuehCharacterEditorRequested (currently
    // just the Hub's own bootstrap bridge, see export-hub.py's BRIDGE). This
    // script is also loaded on the claim page, which has no character editor
    // UI at all -- registering the action unconditionally here put a dead,
    // confusing menu row in front of anyone claiming a character outside the
    // Kueh-verse itself.
    enableEditorMenuAction: function () {
      if (!window.KuehAccount) return;
      window.KuehAccount.registerAccountAction('edit-character', 'Edit character', function () {
        // A user may have signed in after the Hub's Godot instance started.
        // Wait for that account's character profile before asking Godot to
        // construct the editor; otherwise it opens from the stale anonymous
        // appearance and only a full-page reload corrects it.
        refresh().catch(function (error) {
          console.error('[KuehCharacters] editor refresh failed:', error);
        }).then(function () {
          window.kuehCharacterEditorRequested = true;
          window.dispatchEvent(new CustomEvent('kueh-edit-character', { detail: getState() }));
        });
      }, { signedOutMessage: 'Sign up or log in to edit character' });
    }
  };

  if (window.KuehAccount) {
    window.KuehAccount.onAuthStateChange(function () {
      refresh().catch(function (error) { console.error('[KuehCharacters] refresh failed:', error); });
    });
    refresh().catch(function (error) { console.error('[KuehCharacters] initial load failed:', error); });
  }
}());
