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
    }
  };

  if (window.KuehAccount) {
    window.KuehAccount.registerAccountAction('edit-character', 'Edit character', function () {
      window.kuehCharacterEditorRequested = true;
      window.dispatchEvent(new CustomEvent('kueh-edit-character', { detail: getState() }));
    });
    window.KuehAccount.onAuthStateChange(function () {
      refresh().catch(function (error) { console.error('[KuehCharacters] refresh failed:', error); });
    });
    refresh().catch(function (error) { console.error('[KuehCharacters] initial load failed:', error); });
  }
}());
