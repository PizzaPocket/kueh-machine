(function () {
  'use strict';
  var title = document.getElementById('title');
  var message = document.getElementById('message');
  var actions = document.getElementById('actions');
  var status = document.getElementById('status');
  var token = new URLSearchParams(location.search).get('code') || sessionStorage.getItem('kuehClaimToken') || '';
  if (token) sessionStorage.setItem('kuehClaimToken', token);

  function button(label, fn, secondary) {
    var el = document.createElement('button');
    el.textContent = label;
    if (secondary) el.className = 'secondary';
    el.addEventListener('click', fn);
    actions.appendChild(el);
    return el;
  }

  function invalid() {
    title.textContent = 'This invitation cannot be used.';
    message.textContent = 'It may have expired, been replaced, or already been claimed. Ask Leonard for a new invitation.';
    actions.innerHTML = '';
    var home = document.createElement('a');
    home.className = 'button secondary'; home.href = '/'; home.textContent = 'Return home';
    actions.appendChild(home);
  }

  async function render() {
    if (!token) { invalid(); return; }
    await KuehAccount.ready;
    var preview = await KuehAccount.getClient().rpc('preview_character_claim', { p_token: token });
    if (preview.error || !preview.data || !preview.data[0]) { invalid(); return; }
    var invited = preview.data[0];
    title.textContent = 'Claim ' + invited.display_name + '.';
    message.textContent = 'This links the Kueh-verse character to your Kueh Machine account. Your saved edits will become the version other visitors meet.';
    actions.innerHTML = '';
    if (!KuehAccount.getUser()) {
      button('Sign in to continue', function () { KuehAccount.openPanel(); });
      status.textContent = 'Create an account or sign in with the account you want to keep.';
      return;
    }
    status.textContent = '';
    var claim = button('Claim my character', async function () {
      claim.disabled = true; claim.textContent = 'Claiming…'; status.textContent = '';
      try {
        var result = await KuehCharacters.claimContributor(token);
        sessionStorage.removeItem('kuehClaimToken');
        title.textContent = (result && result.display_name ? result.display_name : invited.display_name) + ' is now yours.';
        message.textContent = 'Your character is linked to this account. You can edit it from the account menu.';
        actions.innerHTML = '';
        var enter = document.createElement('a'); enter.className = 'button'; enter.href = '/hub/'; enter.textContent = 'Enter the Kueh-verse'; actions.appendChild(enter);
      } catch (error) {
        claim.disabled = false; claim.textContent = 'Claim my character';
        status.textContent = error.message || 'The claim failed. Please try again.';
      }
    });
    button('Not now', function () { location.href = '/'; }, true);
  }

  KuehAccount.onAuthStateChange(function () { render().catch(function () { invalid(); }); });
  render().catch(function () { invalid(); });
}());
