(() => {
  const BUDGET = 2000;

  const PARTY_CATEGORIES = [
    { key: 'place', title: 'Place', hint: 'Where will you celebrate?', options: [
      { id: 'p1', label: 'Escape Room', price: 1180, desc: 'Crack the clues, escape in time' },
      { id: 'p2', label: 'Timezone', price: 500, desc: 'Play endless arcade fun' },
      { id: 'p3', label: 'Kidztopia', price: 1200, desc: 'Safari indoor playground' },
    ]},
    { key: 'food', title: 'Cake', hint: 'What kind of cake will you like?', options: [
      { id: 'f1', label: 'Chocolate Cake', price: 65, desc: "Rich, gooey, chocolate lover's dream!" },
      { id: 'f2', label: 'Mini Cupcakes', price: 90, desc: 'Little cakes, big sprinkly fun!' },
      { id: 'f3', label: 'Mini Fruit Tarts', price: 70, desc: 'Crunchy, fruity, sweet little bites!' },
    ]},
    { key: 'decor', title: 'Decorations', hint: 'How will it look?', options: [
      { id: 'd1', label: 'DIY paper streamers', price: 10, desc: 'Made by hand, full of colour' },
      { id: 'd2', label: 'Balloon garland', price: 35, desc: 'A cheerful balloon arch' },
      { id: 'd3', label: 'Themed decor set', price: 80, desc: 'A full matching theme' },
    ]},
    { key: 'favours', title: 'Party Favours', hint: 'Something for guests to take home — pick up to two', max: 2, options: [
      { id: 'v1', label: 'Thank-you notes', price: 30, desc: 'A sweet handwritten note' },
      { id: 'v2', label: 'Snacks goodie bag', price: 80, desc: 'Yummy treats to take home' },
      { id: 'v3', label: 'DIY craft goodie bag', price: 100, desc: 'A hands-on craft to make and keep' },
    ]},
  ];

  const GIFTS = [
    { id: 'g1', label: 'Lego Spike', price: 580, icon: '<span class="kueh-icon"><svg viewBox="0 0 64 64"><rect x="18" y="20" width="28" height="24" rx="6" fill="#4A5DAE"/><path d="M24 24h16" stroke="#FFF7E9" stroke-width="4" stroke-linecap="round"/><path d="M28 20v24" stroke="#FFF7E9" stroke-width="4" stroke-linecap="round"/></svg></span>' },
    { id: 'g2', label: 'Board game', price: 50, icon: '<span class="kueh-icon"><svg viewBox="0 0 64 64"><rect x="18" y="18" width="28" height="28" rx="8" fill="#3FA34D"/><path d="M24 24h16" stroke="#FFF7E9" stroke-width="4" stroke-linecap="round"/><path d="M32 18v28" stroke="#FFF7E9" stroke-width="4" stroke-linecap="round"/></svg></span>' },
    { id: 'g3', label: 'Inline Skates', price: 70, icon: '<span class="kueh-icon"><svg viewBox="0 0 64 64"><path d="M20 24h24" stroke="#C77D3A" stroke-width="4" stroke-linecap="round"/><path d="M24 18l8 8-8 8" stroke="#E23B54" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="40" r="6" fill="#4A5DAE"/><circle cx="40" cy="40" r="6" fill="#2BB6B0"/></svg></span>' },
    { id: 'g4', label: 'Wacom drawing tablet', price: 100, icon: '<span class="kueh-icon"><svg viewBox="0 0 64 64"><rect x="18" y="22" width="28" height="20" rx="6" fill="#E23B54"/><path d="M24 28h16" stroke="#FFF7E9" stroke-width="4" stroke-linecap="round"/><path d="M24 34h10" stroke="#FFF7E9" stroke-width="4" stroke-linecap="round"/></svg></span>' },
    { id: 'g5', label: 'NeeDoh sensory toy', price: 20, icon: '<span class="kueh-icon"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="14" fill="#2BB6B0"/><path d="M24 30c2-6 6-8 8-8s6 2 8 8" stroke="#FFF7E9" stroke-width="4" stroke-linecap="round"/></svg></span>' },
    { id: 'g6', label: 'Timezone credit', price: 80, icon: '<span class="kueh-icon"><svg viewBox="0 0 64 64"><rect x="18" y="20" width="28" height="24" rx="7" fill="#4A5DAE"/><path d="M24 30h16" stroke="#FFF7E9" stroke-width="4" stroke-linecap="round"/><path d="M24 36h10" stroke="#FFF7E9" stroke-width="4" stroke-linecap="round"/></svg></span>' },
  ];

  const ACTIVITIES = [
    { id: 'a1', label: 'Sentosa & Sky Luge', price: 300, icon: '<span class="kueh-icon"><svg viewBox="0 0 64 64"><path d="M18 28c8-10 20-10 28 0" stroke="#2BB6B0" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M24 30c4 4 6 8 8 12 2-4 4-8 8-12" stroke="#E23B54" stroke-width="4" fill="none" stroke-linecap="round"/></svg></span>', desc: 'Sandy beaches, luge rides, seaside snacks!' },
    { id: 'a3', label: 'Crocodile Lodge (2D1N)', price: 950, icon: '<span class="kueh-icon"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="14" fill="#3FA34D"/><path d="M24 28c2-6 8-10 8-10s6 4 8 10" stroke="#FFF7E9" stroke-width="4" stroke-linecap="round"/></svg></span>', desc: 'Sleep in the wild, jungle adventures!' },
    { id: 'a4', label: 'Rainforest Resort (3D2N)', price: 1300, icon: '<span class="kueh-icon"><svg viewBox="0 0 64 64"><path d="M20 24h24" stroke="#C77D3A" stroke-width="4" stroke-linecap="round"/><path d="M24 24v20" stroke="#E23B54" stroke-width="4" stroke-linecap="round"/><path d="M40 24v20" stroke="#4A5DAE" stroke-width="4" stroke-linecap="round"/></svg></span>', desc: 'Rainforest hotel stay with animal friends!' },
  ];

  const state = {
    name: '',
    color: '#E23B54',
    paths: new Set(),
    party: { place: [], food: [], decor: [], favours: [] },
    gift: null,
    giftWeekly: 5,
    activity: null,
    invite: { cardTitle: '', friendName: '', date: '', place: '', message: '' },
    rsvps: [],
    jarGoal: '',
    jarGoalCost: '',
    jarGoalWeekly: 5,
  };

  let flow = ['picker'];
  let pos = 0;

  const $ = (id) => document.getElementById(id);

  function hexToHSL(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function applyTheme(hex) {
    const root = document.documentElement.style;
    const { h, s, l } = hexToHSL(hex);
    root.setProperty('--accent', hex);
    root.setProperty('--accent-dark', `hsl(${h} ${Math.max(s, 55)}% ${Math.max(l - 18, 35)}%)`);
    root.setProperty('--accent-darker', `hsl(${h} ${Math.max(s, 55)}% ${Math.max(l - 30, 25)}%)`);
    root.setProperty('--accent-soft', `hsl(${h} ${Math.min(s + 12, 80)}% ${Math.min(l + 24, 94)}%)`);
    root.setProperty('--accent-softer', `hsl(${h} ${Math.min(s + 10, 78)}% ${Math.min(l + 40, 97)}%)`);
    root.setProperty('--accent-mid', `hsl(${h} ${Math.min(s + 16, 84)}% ${Math.min(l + 8, 82)}%)`);
    root.setProperty('--accent-h', h);
    root.setProperty('--accent-s', Math.max(s, 45) + '%');
    root.setProperty('--accent-l', Math.min(Math.max(l, 45), 65) + '%');
  }

  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function fmt(n) { return n.toLocaleString('en-US'); }
  function money(n) { return n === 0 ? 'Free' : `$${fmt(n)}`; }

  function partySpent() {
    return Object.values(state.party).reduce((s, arr) => s + arr.reduce((s2, it) => s2 + it.price, 0), 0);
  }
  function activitySpent() { return state.activity ? state.activity.price : 0; }
  function giftAvailable() { return BUDGET - partySpent() - activitySpent(); }
  function giftAffordable() { return !!state.gift && state.gift.price <= giftAvailable(); }
  function giftSpent() { return giftAffordable() ? state.gift.price : 0; }
  function totalSpent() { return partySpent() + activitySpent() + giftSpent(); }

  function countTag(tag) {
    let c = 0;
    Object.values(state.party).forEach((arr) => arr.forEach((it) => { if (it.tag === tag) c++; }));
    if (state.activity && state.activity.tag === tag) c++;
    if (state.gift && state.gift.tag === tag && giftAffordable()) c++;
    return c;
  }

  function showScreen(name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $(`screen-${name}`).classList.add('active');
    window.scrollTo(0, 0);
  }

  function buildFlow() {
    const f = ['picker'];
    if (state.paths.has('party')) f.push('party');
    if (state.paths.has('gift')) f.push('gift');
    if (state.paths.has('activity')) f.push('activity');
    if (state.paths.has('party') || state.paths.has('activity')) f.push('invite');
    f.push('summary');
    return f;
  }

  function renderAll() {
    if (flow.includes('party')) renderParty();
    if (flow.includes('gift')) renderGift();
    if (flow.includes('activity')) renderActivity();
    if (flow.includes('invite')) renderInvite();
  }

  function updateJarDisplay() {
    const saved = Math.max(BUDGET - totalSpent(), 0);
    const jarFill = $('jar-fill');
    if (jarFill) {
      const fillPct = Math.max(10, Math.min(100, Math.round((saved / BUDGET) * 100)));
      jarFill.style.height = `${fillPct}%`;
    }
  }

  function updateHeader() {
    const spent = totalSpent();
    const over = spent > BUDGET;
    $('budget-spent').textContent = `$${fmt(spent)}`;
    $('budget-total').textContent = `$${fmt(BUDGET)}`;
    $('budget-banner-amount').textContent = `$${fmt(BUDGET)}`;
    const pct = Math.min((spent / BUDGET) * 100, 100);
    const fill = $('meter-fill');
    const overflow = $('meter-overflow');
    fill.style.width = pct + '%';
    fill.classList.toggle('over', over);
    const overflowPct = over ? Math.min(((spent - BUDGET) / BUDGET) * 100, 24) : 0;
    overflow.style.width = over ? `${overflowPct}%` : '0%';
    overflow.style.opacity = over ? '1' : '0';
    const layer1 = $('meter-layer-1');
    const layer2 = $('meter-layer-2');
    const layer3 = $('meter-layer-3');
    if (layer1 && layer2 && layer3) {
      layer1.style.width = `${Math.min(pct, 40)}%`;
      layer2.style.width = `${Math.max(Math.min(pct - 40, 35), 0)}%`;
      layer3.style.width = `${Math.max(Math.min(pct - 75, 25), 0)}%`;
    }
    const remaining = BUDGET - spent;
    const remEl = $('budget-remaining');
    remEl.textContent = over ? `$${fmt(Math.abs(remaining))} over your $${fmt(BUDGET)} budget` : `$${fmt(remaining)} left to plan with`;
    remEl.classList.toggle('over', over);
    const stepIdx = flow.indexOf(currentScreenName());
    $('step-label').textContent = stepIdx >= 0 ? `Step ${stepIdx + 1} of ${flow.length}` : '';

    const needs = countTag('need');
    const wants = countTag('want');
    const total = needs + wants;
    const maxTilt = 14;
    const angle = total === 0 ? 0 : -((needs - wants) / total) * maxTilt;
    $('balance-plank').style.transform = `rotate(${angle}deg)`;
    $('balance-caption').textContent = total === 0
      ? 'Tag choices to see your balance'
      : `${needs} need${needs === 1 ? '' : 's'} · ${wants} want${wants === 1 ? '' : 's'}`;
  }

  function currentScreenName() { return flow[pos]; }

  let muted = false;
  let audioCtx = null;

  function getAudioCtx() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, startTime, duration, type, peakGain) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + startTime;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peakGain || 0.15, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function playPop() {
    if (muted) return;
    tone(660, 0, 0.09, 'triangle', 0.14);
    tone(880, 0.05, 0.12, 'triangle', 0.14);
  }

  function playSoftDown() {
    if (muted) return;
    tone(480, 0, 0.1, 'sine', 0.12);
    tone(340, 0.06, 0.14, 'sine', 0.1);
  }

  function playCelebrate() {
    if (muted) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.18, 'triangle', 0.13));
  }

  const BIRTHDAY_TUNE = [
    [392.00, 0.2], [392.00, 0.2], [440.00, 0.4], [392.00, 0.4], [523.25, 0.4], [493.88, 0.8],
    [392.00, 0.2], [392.00, 0.2], [440.00, 0.4], [392.00, 0.4], [587.33, 0.4], [523.25, 0.8],
    [392.00, 0.2], [392.00, 0.2], [783.99, 0.4], [659.25, 0.4], [523.25, 0.4], [493.88, 0.4], [440.00, 0.8],
    [698.46, 0.2], [698.46, 0.2], [659.25, 0.4], [523.25, 0.4], [587.33, 0.4], [523.25, 0.8],
  ];

  function playYay() {
    if (muted) return;
    let t = 0;
    BIRTHDAY_TUNE.forEach(([freq, dur]) => {
      tone(freq, t, dur * 0.92, 'triangle', 0.15);
      t += dur;
    });
  }

  function playNudge() {
    if (muted) return;
    tone(300, 0, 0.1, 'square', 0.07);
    tone(260, 0.09, 0.12, 'square', 0.07);
  }

  function showToast(msg) {
    playNudge();
    let t = $('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'toast show';
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(() => t.classList.remove('show'), 3400);
  }

  function burstConfetti(count = 60) {
    const container = $('confetti-burst');
    const colors = ['var(--accent)', 'var(--accent-dark)', 'var(--accent-mid)', '#ffd23f', '#ffffff'];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      const size = 6 + Math.random() * 6;
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.width = `${size}px`;
      piece.style.height = `${size * 1.6}px`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.animationDuration = `${1.3 + Math.random() * 1.2}s`;
      piece.style.animationDelay = `${Math.random() * 0.25}s`;
      frag.appendChild(piece);
    }
    container.innerHTML = '';
    container.appendChild(frag);
    clearTimeout(container._cleanupTimer);
    container._cleanupTimer = setTimeout(() => { container.innerHTML = ''; }, 2800);
  }

  function updatePlatterFullState() {
    document.querySelectorAll('#screen-picker .pick-card').forEach((card) => {
      const isSelected = state.paths.has(card.dataset.path);
      card.classList.toggle('platter-full', !isSelected && state.paths.size >= 2);
    });
  }

  function deselectPath(path) {
    state.paths.delete(path);
    const card = document.querySelector(`#screen-picker .pick-card[data-path="${path}"]`);
    if (card) card.classList.remove('selected');
    if (path === 'party') state.party = { place: [], food: [], decor: [], favours: [] };
    if (path === 'gift') state.gift = null;
    if (path === 'activity') state.activity = null;
  }

  function tagToggleHTML(scope, key, currentTag) {
    return `<span class="tag-toggle">
      <button type="button" data-tagscope="${scope}" data-tagkey="${key}" data-tagvalue="need" class="${currentTag === 'need' ? 'active-need' : ''}">Need</button>
      <button type="button" data-tagscope="${scope}" data-tagkey="${key}" data-tagvalue="want" class="${currentTag === 'want' ? 'active-want' : ''}">Want</button>
    </span>`;
  }

  function renderParty() {
    let html = '';
    PARTY_CATEGORIES.forEach((cat) => {
      const arr = state.party[cat.key];
      html += `<div class="party-category">
        <h3>${cat.title}</h3>
        <p class="cat-hint">${cat.hint}</p>
        <div class="party-options">
          ${cat.options.map((opt) => {
            const selItem = arr.find((it) => it.id === opt.id);
            const isSel = !!selItem;
            return `<div class="pick-card ${isSel ? 'selected' : ''}" data-cat="${cat.key}" data-opt="${opt.id}">
              <span class="pick-title">${opt.label}</span>
              <span class="pick-desc">${opt.desc}</span>
              <span class="pick-price">${money(opt.price)}</span>
              ${tagToggleHTML('party', `${cat.key}::${opt.id}`, isSel ? selItem.tag : null)}
            </div>`;
          }).join('')}
        </div>
      </div>`;
    });
    $('party-categories').innerHTML = html;
  }

  function renderGift() {
    $('gift-grid').innerHTML = GIFTS.map((g) => {
      const isSel = state.gift && state.gift.id === g.id;
      return `<div class="pick-card ${isSel ? 'selected' : ''}" data-gift="${g.id}">
        <span class="pick-emoji">${g.icon}</span>
        <span class="pick-title">${g.label}</span>
        <span class="pick-price">$${fmt(g.price)}</span>
        ${tagToggleHTML('gift', 'gift', isSel ? state.gift.tag : null)}
      </div>`;
    }).join('');

    const panel = $('save-up-panel');
    if (state.gift && !giftAffordable()) {
      const shortfall = Math.max(state.gift.price - Math.max(giftAvailable(), 0), 0);
      const weeks = Math.max(Math.ceil(shortfall / state.giftWeekly), 1);
      panel.hidden = false;
      panel.innerHTML = `
        <h4>Saving up for ${state.gift.label}</h4>
        <p>It costs $${fmt(state.gift.price)}, and right now you've got $${fmt(Math.max(giftAvailable(), 0))} of your budget free for it. Set aside a little each week and watch it add up.</p>
        <div class="save-row">
          <label for="weekly-range">Save $<span id="weekly-amount">${state.giftWeekly}</span> a week</label>
          <input type="range" id="weekly-range" min="1" max="20" value="${state.giftWeekly}" />
        </div>
        <p><strong>That's about ${weeks} week${weeks === 1 ? '' : 's'} until it's yours.</strong></p>
      `;
      $('weekly-range').addEventListener('input', (e) => {
        state.giftWeekly = Number(e.target.value);
        renderGift();
      });
    } else {
      panel.hidden = true;
      panel.innerHTML = '';
    }
  }

  function renderActivity() {
    $('activity-grid').innerHTML = ACTIVITIES.map((a) => {
      const isSel = state.activity && state.activity.id === a.id;
      return `<div class="pick-card ${isSel ? 'selected' : ''}" data-activity="${a.id}">
        <span class="pick-emoji">${a.icon}</span>
        <span class="pick-title">${a.label}</span>
        <span class="pick-desc">${a.desc}</span>
        <span class="pick-price">$${fmt(a.price)}</span>
        ${tagToggleHTML('activity', 'activity', isSel ? state.activity.tag : null)}
      </div>`;
    }).join('');
  }

  function renderInvite() {
    if (!state.invite.cardTitle) state.invite.cardTitle = `${state.name}'s Birthday`;
    $('invite-card-title').value = state.invite.cardTitle;
    $('invite-friend-name').value = state.invite.friendName;
    $('invite-date').value = state.invite.date;
    $('invite-place').value = state.invite.place;
    $('invite-message').value = state.invite.message;
    updateInvitePreview();
  }

  function updateInvitePreview() {
    $('invite-card-name').textContent = state.invite.cardTitle || `${state.name}'s Birthday`;
    $('invite-card-date').textContent = `Date: ${state.invite.date || '—'}`;
    $('invite-card-place').textContent = `Place: ${state.invite.place || '—'}`;
    $('invite-card-message').textContent = state.invite.message || 'Come celebrate with me!';
    const friendName = state.invite.friendName.trim();
    const nameEl = $('invite-card-headline-name');
    nameEl.hidden = !friendName;
    nameEl.textContent = friendName ? `${friendName},` : '';
  }

  function renderRSVP() {
    const list = $('rsvp-list');
    if (state.rsvps.length === 0) {
      list.innerHTML = '<li class="rsvp-empty">No RSVPs yet — add one once a friend lets you know they\'re coming!</li>';
      $('btn-export-rsvp').hidden = true;
      return;
    }
    list.innerHTML = state.rsvps.map((r) =>
      `<li><span class="who">${escapeHTML(r.child)}</span><span class="via">via ${escapeHTML(r.parent)} · ${escapeHTML(r.contact)}</span></li>`
    ).join('');
    $('btn-export-rsvp').hidden = false;
  }

  function exportRSVP() {
    const rows = [['Friend\'s Name', 'Parent/Guardian', 'Contact'], ...state.rsvps.map((r) => [r.child, r.parent, r.contact])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.name || 'birthday'}-guest-list.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function buildTradeOffNote() {
    const spent = totalSpent();
    const saved = Math.max(BUDGET - spent, 0);
    const needs = countTag('need');
    const wants = countTag('want');
    const parts = [];

    if (saved > 0) {
      parts.push(`You spent $${fmt(spent)} and kept $${fmt(saved)} for your Savings Jar — that's money still working for you, not just spent in one day.`);
    } else {
      parts.push(`You planned right up to your $${fmt(BUDGET)} budget — every dollar went somewhere you chose on purpose.`);
    }
    if (needs > 0 || wants > 0) {
      parts.push(`You tagged ${needs} thing${needs === 1 ? '' : 's'} as a need and ${wants} as a want — that's exactly the kind of thinking that makes a plan feel good, not just big.`);
    }
    if (state.gift && !giftAffordable()) {
      const shortfall = Math.max(state.gift.price - Math.max(giftAvailable(), 0), 0);
      const weeks = Math.max(Math.ceil(shortfall / state.giftWeekly), 1);
      parts.push(`Your ${state.gift.label} is out of reach for right now, and that's okay — save $${state.giftWeekly} a week and it's yours in about ${weeks} week${weeks === 1 ? '' : 's'}.`);
    }
    if (saved > 0 && state.jarGoal.trim()) {
      parts.push(`Once your jar fills up, <strong>${escapeHTML(state.jarGoal.trim())}</strong> sounds like a great thing to spend it on.`);
    }
    parts.push('However big or small the day turns out, it\'s yours — and a simple day is never a smaller day.');
    return parts.join(' ');
  }

  function renderSummary() {
    const items = [];
    PARTY_CATEGORIES.forEach((cat) => {
      state.party[cat.key].forEach((v) => items.push({ label: v.label, price: v.price, tag: v.tag }));
    });
    if (state.activity) items.push({ label: state.activity.label, price: state.activity.price, tag: state.activity.tag });
    if (state.gift) {
      if (giftAffordable()) items.push({ label: state.gift.label, price: state.gift.price, tag: state.gift.tag });
      else items.push({ label: `${state.gift.label} (saving up)`, price: null, tag: null });
    }

    $('summary-breakdown').innerHTML = items.length
      ? items.map((it) => `<li><span class="item-label">${it.label}</span><span class="item-right">${it.tag ? `<span class="tag-pill">${it.tag}</span>` : ''}<strong>${it.price === null ? '—' : money(it.price)}</strong></span></li>`).join('')
      : '<li>You kept it wonderfully simple — nothing spent today!</li>';

    const spent = totalSpent();
    const saved = Math.max(BUDGET - spent, 0);
    const needs = countTag('need');
    const wants = countTag('want');
    $('summary-budget').textContent = `$${fmt(BUDGET)}`;
    $('summary-spent').textContent = `$${fmt(spent)}`;
    $('summary-saved').textContent = `$${fmt(saved)}`;
    $('jar-amount').textContent = `$${fmt(saved)}`;
    $('summary-needs').textContent = `${needs} needs`;
    $('summary-wants').textContent = `${wants} wants`;
    updateJarDisplay();
    $('jar-goal').value = state.jarGoal;
    $('jar-goal-cost').value = state.jarGoalCost;
    $('jar-goal-weekly').value = state.jarGoalWeekly;
    $('jar-goal-weekly-amount').textContent = state.jarGoalWeekly;
    $('trade-off-note').innerHTML = buildTradeOffNote();
    updateSavingsPlan();
    renderRecapCard(items, spent, saved, needs, wants);
  }

  function renderRecapCard(items, spent, saved, needs, wants) {
    $('recap-card-title').textContent = `${state.name}'s Big Day`;
    $('recap-card-list').innerHTML = items.length
      ? items.map((it) => `<li><span class="item-label">${it.label}${it.tag ? ` <span class="tag-pill">${it.tag}</span>` : ''}</span><strong>${it.price === null ? '—' : money(it.price)}</strong></li>`).join('')
      : '<li>Kept it wonderfully simple!</li>';
    $('recap-card-spent').textContent = `$${fmt(spent)}`;
    $('recap-card-saved').textContent = `$${fmt(saved)}`;
    $('recap-card-tags').textContent = `${needs} need${needs === 1 ? '' : 's'} · ${wants} want${wants === 1 ? '' : 's'}`;
    $('recap-card-note').innerHTML = buildTradeOffNote();
  }

  function updateSavingsPlan() {
    const saved = Math.max(BUDGET - totalSpent(), 0);
    const goal = state.jarGoal.trim();
    const cost = Number(state.jarGoalCost) || 0;
    const block = $('savings-plan-block');

    if (!goal || saved <= 0) {
      block.hidden = true;
      return;
    }
    block.hidden = false;

    $('plan-card-title').textContent = `${state.name}'s Savings Plan`;
    $('plan-card-goal').textContent = `Saving for: ${goal}`;
    $('plan-card-have').textContent = `$${fmt(saved)}`;
    $('plan-card-cost').textContent = cost > 0 ? `$${fmt(cost)}` : '—';

    const pct = cost > 0 ? Math.min((saved / cost) * 100, 100) : 0;
    $('plan-card-bar').style.width = `${pct}%`;

    const tracker = $('plan-card-tracker');
    if (cost <= 0) {
      $('plan-card-message').textContent = `Tell me what ${goal} costs and I'll work out a plan to get you there!`;
      tracker.innerHTML = '';
    } else if (saved >= cost) {
      $('plan-card-message').textContent = `You've already got enough saved for ${goal} — amazing!`;
      tracker.innerHTML = '';
    } else {
      const shortfall = cost - saved;
      const weekly = state.jarGoalWeekly || 1;
      const weeks = Math.max(Math.ceil(shortfall / weekly), 1);
      $('plan-card-message').textContent = `Save $${fmt(weekly)} a week and it's yours in about ${weeks} week${weeks === 1 ? '' : 's'}.`;
      const maxBoxes = 20;
      const boxCount = Math.min(weeks, maxBoxes);
      let html = '';
      for (let i = 0; i < boxCount; i++) html += '<span class="week-box"></span>';
      if (weeks > maxBoxes) html += `<span class="week-more">+${weeks - maxBoxes} more weeks</span>`;
      tracker.innerHTML = html;
    }
  }

  function goNext() {
    if (pos >= flow.length - 1) return;
    const nextName = flow[pos + 1];
    if (nextName === 'summary' && totalSpent() > BUDGET) {
      showToast(`You're $${fmt(totalSpent() - BUDGET)} over your $${fmt(BUDGET)} budget — try swapping something out before we wrap up!`);
      return;
    }
    pos++;
    showScreen(currentScreenName());
    if (currentScreenName() === 'summary') { renderSummary(); playYay(); burstConfetti(40); }
    updateHeader();
  }

  function goBack() {
    if (pos <= 0) return;
    pos--;
    showScreen(currentScreenName());
    updateHeader();
  }

  function resetApp() {
    state.name = '';
    state.color = '#E23B54';
    state.paths = new Set();
    state.party = { place: [], food: [], decor: [], favours: [] };
    state.gift = null;
    state.giftWeekly = 5;
    state.activity = null;
    state.invite = { cardTitle: '', friendName: '', date: '', place: '', message: '' };
    state.rsvps = [];
    state.jarGoal = '';
    state.jarGoalCost = '';
    state.jarGoalWeekly = 5;
    flow = ['picker'];
    pos = 0;

    $('input-name').value = '';
    document.querySelectorAll('#color-swatches .color-swatch').forEach((s) => s.classList.toggle('selected', s.dataset.color === '#E23B54'));
    $('btn-start').disabled = true;
    $('welcome-title').textContent = 'Kueh Partee';
    $('page-title').textContent = 'Kueh Partee';
    document.querySelectorAll('#screen-picker .pick-card').forEach((c) => c.classList.remove('selected'));
    updatePlatterFullState();
    $('btn-picker-continue').disabled = true;
    applyTheme('#E23B54');
    $('app-header').hidden = true;
    showScreen('welcome');
  }

  function init() {
    const inputName = $('input-name');
    const btnStart = $('btn-start');

    $('color-swatches').addEventListener('click', (e) => {
      const swatch = e.target.closest('.color-swatch');
      if (!swatch) return;
      document.querySelectorAll('#color-swatches .color-swatch').forEach((s) => s.classList.remove('selected'));
      swatch.classList.add('selected');
      applyTheme(swatch.dataset.color);
      playPop();
    });

    $('sound-toggle').addEventListener('click', () => {
      muted = !muted;
      const btn = $('sound-toggle');
      btn.innerHTML = muted ? '<span class="kueh-icon"><svg viewBox="0 0 64 64"><path d="M24 28h8l10-8v24l-10-8h-8z" fill="#3FA34D"/><path d="M44 24c4 4 4 12 0 16" stroke="#2A2A4A" stroke-width="4" stroke-linecap="round"/><path d="M40 20l12 12" stroke="#2A2A4A" stroke-width="4" stroke-linecap="round"/><path d="M52 20l-12 12" stroke="#2A2A4A" stroke-width="4" stroke-linecap="round"/></svg></span>' : '<span class="kueh-icon"><svg viewBox="0 0 64 64"><path d="M24 28h8l10-8v24l-10-8h-8z" fill="#3FA34D"/><path d="M44 24c4 4 4 12 0 16" stroke="#2A2A4A" stroke-width="4" stroke-linecap="round"/><path d="M48 18c7 6 8 22 0 28" stroke="#2A2A4A" stroke-width="4" stroke-linecap="round"/></svg></span>';
      btn.setAttribute('aria-label', muted ? 'Unmute sounds' : 'Mute sounds');
      if (!muted) playPop();
    });

    inputName.addEventListener('input', () => {
      const val = inputName.value.trim();
      const title = val ? `${val}'s Kueh Partee` : 'Kueh Partee';
      $('welcome-title').textContent = title;
      $('page-title').textContent = title;
      btnStart.disabled = val.length === 0;
    });

    btnStart.addEventListener('click', () => {
      state.name = inputName.value.trim();
      state.color = document.querySelector('#color-swatches .color-swatch.selected').dataset.color;
      applyTheme(state.color);
      document.querySelectorAll('.name-slot').forEach((el) => { el.textContent = state.name; });
      $('greet-name').textContent = state.name;
      $('welcome-title').textContent = `${state.name}'s Kueh Partee`;
      $('page-title').textContent = `${state.name}'s Kueh Partee`;
      burstConfetti();
      playCelebrate();
      setTimeout(() => {
        $('app-header').hidden = false;
        showScreen('picker');
        updateHeader();
      }, 700);
    });

    document.querySelector('#screen-picker .pick-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.pick-card');
      if (!card) return;
      const path = card.dataset.path;
      if (state.paths.has(path)) {
        deselectPath(path);
        playSoftDown();
      } else {
        if (state.paths.size >= 2) return; // platter's full — card is inert, this shouldn't fire
        state.paths.add(path);
        card.classList.add('selected');
        playPop();
      }
      updatePlatterFullState();
      $('btn-picker-continue').disabled = state.paths.size === 0;
    });

    $('btn-picker-continue').addEventListener('click', () => {
      flow = buildFlow();
      pos = 1;
      renderAll();
      showScreen(currentScreenName());
      updateHeader();
    });

    $('party-categories').addEventListener('click', (e) => {
      const tagBtn = e.target.closest('[data-tagvalue]');
      if (!tagBtn) return;
      const card = tagBtn.closest('[data-opt]');
      const { cat, opt } = card.dataset;
      const val = tagBtn.dataset.tagvalue;
      const catData = PARTY_CATEGORIES.find((c) => c.key === cat);
      const optData = catData.options.find((o) => o.id === opt);
      const max = catData.max || 1;
      const arr = state.party[cat];
      const idx = arr.findIndex((it) => it.id === opt);
      if (idx >= 0) {
        if (arr[idx].tag === val) { arr.splice(idx, 1); playSoftDown(); }
        else { arr[idx].tag = val; playPop(); }
      } else if (max === 1) {
        arr.length = 0;
        arr.push({ ...optData, tag: val });
        playPop();
      } else if (arr.length < max) {
        arr.push({ ...optData, tag: val });
        playPop();
      } else {
        showToast(`You can pick up to ${max} for ${catData.title}.`);
        return;
      }
      renderParty();
      updateHeader();
    });

    $('gift-grid').addEventListener('click', (e) => {
      const tagBtn = e.target.closest('[data-tagvalue]');
      if (!tagBtn) return;
      const card = tagBtn.closest('[data-gift]');
      const id = card.dataset.gift;
      const val = tagBtn.dataset.tagvalue;
      if (state.gift && state.gift.id === id) {
        if (state.gift.tag === val) { state.gift = null; playSoftDown(); }
        else { state.gift.tag = val; playPop(); }
      } else {
        const g = GIFTS.find((x) => x.id === id);
        state.gift = { ...g, tag: val };
        playPop();
      }
      renderGift();
      updateHeader();
    });

    $('activity-grid').addEventListener('click', (e) => {
      const tagBtn = e.target.closest('[data-tagvalue]');
      if (!tagBtn) return;
      const card = tagBtn.closest('[data-activity]');
      const id = card.dataset.activity;
      const val = tagBtn.dataset.tagvalue;
      if (state.activity && state.activity.id === id) {
        if (state.activity.tag === val) { state.activity = null; playSoftDown(); }
        else { state.activity.tag = val; playPop(); }
      } else {
        const a = ACTIVITIES.find((x) => x.id === id);
        state.activity = { ...a, tag: val };
        playPop();
      }
      renderActivity();
      updateHeader();
    });

    $('invite-card-title').addEventListener('input', (e) => { state.invite.cardTitle = e.target.value; updateInvitePreview(); });
    $('invite-friend-name').addEventListener('input', (e) => { state.invite.friendName = e.target.value; updateInvitePreview(); });
    $('invite-date').addEventListener('input', (e) => { state.invite.date = e.target.value; updateInvitePreview(); });
    $('invite-place').addEventListener('input', (e) => { state.invite.place = e.target.value; updateInvitePreview(); });
    $('invite-message').addEventListener('input', (e) => { state.invite.message = e.target.value; updateInvitePreview(); });

    $('btn-print-card').addEventListener('click', () => window.print());
    $('btn-save-card').addEventListener('click', () => {
      if (typeof html2canvas === 'undefined') {
        showToast('Image saving isn\'t available right now — try a screenshot instead!');
        return;
      }
      html2canvas($('invite-card'), { backgroundColor: null, scale: 2, useCORS: true }).then((canvas) => {
        const link = document.createElement('a');
        link.download = `${state.name || 'invite'}-invitation.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    });

    $('btn-print-plan').addEventListener('click', () => window.print());
    $('btn-save-plan').addEventListener('click', () => {
      if (typeof html2canvas === 'undefined') {
        showToast('Image saving isn\'t available right now — try a screenshot instead!');
        return;
      }
      html2canvas($('savings-plan-card'), { backgroundColor: null, scale: 2, useCORS: true }).then((canvas) => {
        const link = document.createElement('a');
        link.download = `${state.name || 'my'}-savings-plan.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    });

    $('btn-print-recap').addEventListener('click', () => window.print());
    $('btn-save-recap').addEventListener('click', () => {
      if (typeof html2canvas === 'undefined') {
        showToast('Image saving isn\'t available right now — try a screenshot instead!');
        return;
      }
      html2canvas($('recap-card'), { backgroundColor: null, scale: 2, useCORS: true }).then((canvas) => {
        const link = document.createElement('a');
        link.download = `${state.name || 'my'}-day-recap.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    });

    $('rsvp-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const child = $('rsvp-child').value.trim();
      const parent = $('rsvp-parent').value.trim();
      const contact = $('rsvp-contact').value.trim();
      if (!child || !parent || !contact) return;
      state.rsvps.push({ child, parent, contact });
      e.target.reset();
      renderRSVP();
      playPop();
    });
    $('btn-export-rsvp').addEventListener('click', exportRSVP);
    renderRSVP();

    $('jar-goal').addEventListener('input', (e) => {
      state.jarGoal = e.target.value;
      $('trade-off-note').innerHTML = buildTradeOffNote();
      updateSavingsPlan();
    });

    $('jar-goal-cost').addEventListener('input', (e) => {
      state.jarGoalCost = e.target.value;
      updateSavingsPlan();
    });

    $('jar-goal-weekly').addEventListener('input', (e) => {
      state.jarGoalWeekly = Number(e.target.value);
      $('jar-goal-weekly-amount').textContent = state.jarGoalWeekly;
      updateSavingsPlan();
    });

    $('btn-party-continue').addEventListener('click', goNext);
    $('btn-gift-continue').addEventListener('click', goNext);
    $('btn-activity-continue').addEventListener('click', goNext);
    $('btn-invite-continue').addEventListener('click', goNext);
    document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', goBack));
    $('btn-restart').addEventListener('click', resetApp);

    applyTheme(state.color);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
