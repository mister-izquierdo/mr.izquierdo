/* ════════════════════════════════════════════════════════════════
   Mr_Izquierdo · V14 · lógica de la landing
   1 estado · 2 carpetas · 3 vídeo · 4 formulario · 5 selector Apple
   6 guía animada · 7 arranque
   La configuración (URL del formulario, Calendly…) vive en config.js
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const CFG = Object.assign({ APPS_SCRIPT_URL: '', CALENDLY_URL: '#', LOCK_STEPS: true }, window.MR_CONFIG || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  const archive = $('#archive');
  const tabsNav = $('.tabs');
  const tabs = $$('.tab');
  const panels = $$('.panel');
  const hint = $('#hint');
  const headCta = $('#headCta');

  /* 1 · ESTADO ─────────────────────────────────────────────────── */
  const KEY = 'mr_izquierdo_v14';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  const S = {
    active: 0,
    videoStarted: !!saved.videoStarted,
    formSent: !!saved.formSent,
    booked: !!saved.booked,
    auditUnlocked: !!saved.auditUnlocked || !!saved.formSent,
    token: saved.token || (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)),
    visited: new Set(saved.visited || [])
  };
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        videoStarted: S.videoStarted, formSent: S.formSent,
        auditUnlocked: S.auditUnlocked, booked: S.booked, token: S.token, visited: [...S.visited]
      }));
    } catch (e) {}
  }
  const unlocked = n => !CFG.LOCK_STEPS || n === 1 || S.formSent || S.auditUnlocked;
  const isDone = n => n === 1 ? S.formSent : S.visited.has(n);

  /* 2 · CARPETAS ───────────────────────────────────────────────── */
  function refresh() {
    archive.dataset.open = String(S.active > 0);
    archive.dataset.active = String(S.active);
    tabs.forEach(t => {
      const n = +t.dataset.step;
      t.setAttribute('aria-disabled', String(!unlocked(n)));
      t.setAttribute('aria-expanded', String(S.active === n));
    });
    panels.forEach(p => { p.hidden = S.active !== +p.dataset.step; });
    headCta.textContent = S.formSent ? 'Reservar llamada' : 'Solicitar auditoría';
    $$('[data-when="sent"]').forEach(el => { el.hidden = !S.formSent; });
    $$('[data-when="unsent"]').forEach(el => { el.hidden = S.formSent; });
    $$('a[href="#"][target="_blank"], #bookBtn').forEach(a => { a.href = CFG.CALENDLY_URL; });
    if (typeof syncBooking === 'function') syncBooking();
  }

  function scrollToArchive() {
    const top = tabsNav.getBoundingClientRect().top + window.scrollY - 130;   // deja sitio a la cabecera y a la mano guía
    window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' });
  }

  function go(n, opts) {
    const o = Object.assign({ toggle: false, scroll: true }, opts);
    if (n > 0 && !unlocked(n)) { nudge(n); return; }
    if (o.toggle && n === S.active) n = 0;
    if (n === S.active) { if (o.scroll) scrollToArchive(); return; }
    guide.classList.remove('on');
    const returningToAudit = n === 1 && S.active > 1 && (S.formSent || S.auditUnlocked || !formWrap.hidden);
    const apply = () => {
      if (returningToAudit) resetAuditForAnotherAttempt();
      S.active = n;
      if (n) S.visited.add(n);
      persist();
      refresh();
    };
    const finish = () => { if (o.scroll) scrollToArchive(); placeGuide(); };
    if (!reduced && document.startViewTransition) {
      try { document.startViewTransition(apply).finished.then(finish, finish); }
      catch (e) { apply(); finish(); }
    } else { apply(); requestAnimationFrame(finish); }
  }

  let hintTimer;
  function say(msg) {
    hint.textContent = msg;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { hint.textContent = ''; }, 4500);
  }
  function nudge(n) {
    const t = tabs[n - 1];
    t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake');
    say('Envía el formulario para abrir el resto de carpetas.');
  }

  tabs.forEach(t => t.addEventListener('click', () => { const n = +t.dataset.step; track('folder_open', { folder: n }); go(n, { toggle: true }); }));
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-go]');
    if (b) go(+b.dataset.go);
  });
  headCta.addEventListener('click', () => {
    go(1);
  });

  /* 3 · VÍDEO (reproductor propio, entre el hero y las carpetas) ── */
  const player = $('#player'), vid = $('#vid'), playBtn = $('#play'), soon = $('#soon'), controls = $('#controls');
  const seek = $('#seek'), timeEl = $('#time'), cPlay = $('#cPlay'), cMute = $('#cMute'), cFull = $('#cFull');
  let videoFailed = false, idleT;

  const VU = (CFG.VIDEO_URL || '').trim();
  const yt = VU.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  const vm = VU.match(/vimeo\.com\/(\d+)/);
  const embedSrc = yt ? 'https://www.youtube-nocookie.com/embed/' + yt[1] + '?autoplay=1&rel=0&playsinline=1'
                 : vm ? 'https://player.vimeo.com/video/' + vm[1] + '?autoplay=1' : '';
  function videoFail() { videoFailed = true; queueGuide(); }
  if (embedSrc) { vid.remove(); player.classList.add('embed'); }
  else if (!VU) videoFail();
  else { vid.querySelector('source').setAttribute('src', VU); vid.load(); vid.querySelector('source').addEventListener('error', videoFail); vid.addEventListener('error', videoFail); }

  const fmt = t => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  function wake() {
    player.classList.remove('idle'); clearTimeout(idleT);
    if (!vid.paused) idleT = setTimeout(() => player.classList.add('idle'), 2600);
  }
  function videoStarted() {
    if (!S.videoStarted) { S.videoStarted = true; persist(); }
    queueGuide();
  }
  playBtn.addEventListener('click', () => {
    if (videoFailed) { soon.hidden = false; return; }
    player.classList.add('started');
    if (embedSrc) {
      const f = document.createElement('iframe');
      f.src = embedSrc; f.title = 'Presentación de la auditoría'; f.allow = 'autoplay; fullscreen; picture-in-picture'; f.allowFullscreen = true;
      f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;z-index:2';
      player.append(f);
    } else {
      controls.hidden = false;
      const p = vid.play(); if (p && p.catch) p.catch(() => {});
    }
    videoStarted();
  });
  if (!embedSrc) {
    vid.addEventListener('play', () => { player.classList.remove('paused'); wake(); videoStarted(); });
    vid.addEventListener('pause', () => { player.classList.add('paused'); wake(); });
    vid.addEventListener('timeupdate', () => {
      const p = vid.duration ? (vid.currentTime / vid.duration) * 1000 : 0;
      seek.value = p; seek.style.setProperty('--p', (p / 10) + '%');
      timeEl.textContent = fmt(vid.currentTime) + ' / ' + fmt(vid.duration);
    });
    vid.addEventListener('ended', () => { player.classList.add('paused'); player.classList.remove('idle'); go(1); });
    seek.addEventListener('input', () => { if (vid.duration) vid.currentTime = (seek.value / 1000) * vid.duration; });
    cPlay.addEventListener('click', () => (vid.paused ? vid.play() : vid.pause()));
    vid.addEventListener('click', () => (vid.paused ? vid.play() : vid.pause()));
    cMute.addEventListener('click', () => { vid.muted = !vid.muted; player.classList.toggle('muted', vid.muted); });
    cFull.addEventListener('click', () => {
      if (player.requestFullscreen) player.requestFullscreen();
      else if (vid.webkitEnterFullscreen) vid.webkitEnterFullscreen();
    });
    ['mousemove', 'touchstart', 'keydown'].forEach(ev => player.addEventListener(ev, wake, { passive: true }));
  }

  /* 4 · FORMULARIO (4 pasos) ───────────────────────────────────── */
  const form = $('#form'), formWrap = $('#formWrap'), done = $('#done');
  const steps = $$('.step', form), bars = $$('#progress i');
  const stepLabel = $('#stepLabel'), backBtn = $('#backBtn'), nextBtn = $('#nextBtn'), submitBtn = $('#submitBtn'), formErr = $('#formError');
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const MSG = {
    nombre: 'Escribe tu nombre.',
    email: 'Escribe un email válido, por ejemplo tu@email.com.',
    telefono: 'Escribe un teléfono de contacto válido.',
    consentimiento: 'Acepta la política de privacidad para enviar tu solicitud.'
  };
  let stepIdx = 0, lastLead = null;
  const touched = new Set();

  function showStep(i, focus) {
    stepIdx = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    bars.forEach((b, k) => b.classList.toggle('on', k <= i));
    stepLabel.innerHTML = 'Paso ' + (i + 1) + ' de ' + steps.length + ' · <b>' + steps[i].dataset.title + '</b>';
    backBtn.hidden = i === 0;
    nextBtn.hidden = i === steps.length - 1;
    submitBtn.hidden = i !== steps.length - 1;
    formErr.hidden = true;
    if (focus && finePointer) { const f = $('.input, .select-btn', steps[i]); if (f) f.focus({ preventScroll: true }); }
    queueGuide(); setTimeout(queueGuide, 450);
  }

  function fieldOk(el) {
    if (!el.required) return true;
    if (el.type === 'checkbox') return el.checked;
    const v = el.value.trim();
    if (!v) return false;
    if (el.type === 'email') return EMAIL.test(v);
    if (el.type === 'tel') return v.replace(/\D/g, '').length >= 7;
    return true;
  }
  function setErr(el, msg) {
    const id = 'e-' + (el.name === 'consentimiento' ? 'consent' : el.name);
    const p = document.getElementById(id);
    if (p) p.textContent = msg || '';
    if (msg) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', id); }
    else { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
  }
  function validateStep(i) {
    let first = null;
    $$('[required]', steps[i]).forEach(el => {
      const ok = fieldOk(el);
      setErr(el, ok ? '' : MSG[el.name]);
      if (!ok && !first) first = el;
    });
    if (first) { first.focus(); return false; }
    return true;
  }

  function post(payload, keep) {
    const url = CFG.APPS_SCRIPT_URL;
    if (!url || /YOUR_/i.test(url)) return Promise.reject(new Error('sin-url'));
    return fetch(url, { method: 'POST', mode: 'no-cors', keepalive: !!keep, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
  }
  function collect() {
    const d = Object.fromEntries(new FormData(form).entries());
    delete d.empresa_web; delete d.newsletter; delete d.consentimiento;
    return d;
  }
  function savePartial(paso) {                           // solo con consentimiento marcado y email válido
    const d = collect();
    if (!form.elements.consentimiento.checked || !EMAIL.test(d.email || '')) return;
    post(Object.assign(d, { action: 'partial', token: S.token, paso: paso })).catch(() => {});
  }
  nextBtn.addEventListener('click', () => { if (validateStep(stepIdx)) { track('form_step', { step: stepIdx + 2 }); savePartial(stepIdx + 2); showStep(stepIdx + 1, true); } });
  backBtn.addEventListener('click', () => showStep(stepIdx - 1, true));
  form.addEventListener('input', e => {
    touched.add(stepIdx);
    if (e.target.hasAttribute('aria-invalid') && fieldOk(e.target)) setErr(e.target, '');
    queueGuide();
  });
  form.addEventListener('change', e => {
    touched.add(stepIdx);
    if (e.target.hasAttribute('aria-invalid') && fieldOk(e.target)) setErr(e.target, '');
    queueGuide();
  });
  form.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') {
      e.preventDefault();
      (submitBtn.hidden ? nextBtn : submitBtn).click();
    }
  });

function showFormError(msg) {
  formErr.textContent = msg;
  formErr.hidden = false;
}

function setBusy(b) {
  submitBtn.disabled = b;
  submitBtn.textContent = b ? 'Enviando…' : 'Solicitar mi auditoría';
}

async function sendForm() {
  if (stepIdx < steps.length - 1) {
    nextBtn.click();
    return;
  }

  for (let i = 0; i < steps.length; i++) {
    if (!validateStep(i)) {
      if (i !== stepIdx) showStep(i, false);
      return;
    }
  }

  const data = Object.fromEntries(new FormData(form).entries());

  console.log('FORMULARIO: SUBMIT RECIBIDO', data);

  const isBot = !!data.empresa_web;
  delete data.empresa_web;

  data.consentimiento = 'sí';
  data.newsletter = form.elements.newsletter.checked ? 'sí' : 'no';
  data.token = S.token;
  data.action = 'complete';

  lastLead = {
    nombre: data.nombre,
    email: data.email
  };

  if (isBot) {
    sent();
    return;
  }

  const url = CFG.APPS_SCRIPT_URL;

  if (!url || /YOUR_/i.test(url)) {
    showFormError(
      'La conexión con Google todavía no está configurada. No se ha enviado ni guardado la solicitud.'
    );
    return;
  }

  setBusy(true);
  formErr.hidden = true;

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 20000);

  try {
    track('audit_submit_attempt');

    console.log('FORMULARIO: LLEGA AL FETCH');

    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(
        Object.assign({}, data, {
          pagina: location.href,
          enviado: new Date().toISOString()
        })
      )
    });

    track('audit_submit_success');

    console.log('FORMULARIO: FETCH COMPLETADO');

    sent();

  } catch (err) {
    console.error('FORMULARIO: ERROR', err);

    showFormError(
      'No hemos podido enviar tu solicitud. Comprueba tu conexión e inténtalo de nuevo.'
    );

  } finally {
    clearTimeout(timeout);
    setBusy(false);
  }
}

submitBtn.addEventListener('click', function (e) {
  e.preventDefault();
  sendForm();
});

form.addEventListener('submit', function (e) {
  e.preventDefault();
  sendForm();
});
  function sent() {
    S.formSent = true;
    S.auditUnlocked = true;
    S.booked = false;
    persist();
    form.reset();
    touched.clear();
    showStep(0, false);
    refresh();
    showDone();
  }
  function showDone() {
    formWrap.hidden = true;
    done.hidden = false;
    refresh();
    syncBooking();
    $(S.booked ? '#thanksTitle' : '#doneTitle').focus({ preventScroll: true });
    queueGuide();
  }
  function syncBooking() {
    $('#bookStage').hidden = S.booked;
    $('#thanks').hidden = !S.booked;
    const bookBtn = $('#bookBtn');
    bookBtn.href = CFG.CALENDLY_URL;
    bookBtn.onclick = () => track('booking_click');
  }
  function resetAuditForAnotherAttempt() {
    S.formSent = false;
    S.booked = false;
    lastLead = null;
    form.reset();
    touched.clear();
    showStep(0, false);
    formWrap.hidden = false;
    done.hidden = true;
    syncBooking();
    persist();
  }
  function booked() { S.booked = true; persist(); syncBooking(); $('#thanksTitle').focus({ preventScroll: true }); queueGuide(); }
  window.addEventListener('message', e => {              // Calendly avisa al terminar una reserva
    if (e.origin === 'https://calendly.com' && e.data && e.data.event === 'calendly.event_scheduled') booked();
  });
  $('#bookedBtn').addEventListener('click', () => { track('booking_confirmed'); booked(); });
  $('#newAuditBtn')?.addEventListener('click', () => { track('audit_restart');
    resetAuditForAnotherAttempt();
    S.active = 1;
    S.visited.add(1);
    persist();
    refresh();
    requestAnimationFrame(() => scrollToArchive());
    queueGuide();
  });

  /* Reanudar desde el email de recordatorio: ?reanudar=TOKEN */
  (function resume() {
    const t = new URLSearchParams(location.search).get('reanudar');
    const url = CFG.APPS_SCRIPT_URL;
    if (!t || !url || /YOUR_/i.test(url) || S.formSent) return;
    S.token = t; persist(); refresh();
    fetch(url + '?action=resume&token=' + encodeURIComponent(t)).then(r => r.json()).then(r => {
      if (r && r.ok) {
        Object.keys(r.datos || {}).forEach(k => {
          const el = form.elements[k];
          if (el && r.datos[k]) { el.value = r.datos[k]; if (el._set) el._set(r.datos[k]); }
        });
        showStep(Math.min(Math.max((r.paso || 2) - 1, 1), steps.length - 1), false);
      }
    }).catch(() => {}).finally(() => go(1));
  })();

  /* 5 · SELECTOR ESTILO APPLE ──────────────────────────────────── */
  let anySelectOpen = false;
  const selects = [];

  function enhanceSelect(sel) {
    const ph = sel.dataset.placeholder || 'Selecciona una opción';
    const base = sel.id;
    const wrap = document.createElement('div'); wrap.className = 'select';
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'input select-btn'; btn.id = base;
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    const val = document.createElement('span'); val.className = 'val ph'; val.textContent = ph;
    btn.append(val);
    btn.insertAdjacentHTML('beforeend', '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 5l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
    const list = document.createElement('ul');
    list.className = 'select-list'; list.id = base + '-list'; list.hidden = true; list.setAttribute('role', 'listbox');
    const lab = document.querySelector('label[for="' + base + '"]');
    if (lab) list.setAttribute('aria-label', lab.textContent.trim());
    btn.setAttribute('aria-controls', list.id);

    const opts = Array.from(sel.options).filter(o => o.value !== '');
    const items = opts.map((o, i) => {
      const li = document.createElement('li');
      li.id = base + '-o' + i; li.setAttribute('role', 'option'); li.dataset.value = o.value; li.textContent = o.text;
      list.append(li);
      return li;
    });

    sel.id = base + '-native'; sel.hidden = true; sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    btn._sel = sel; sel._set = v => setValue(v);
    sel.after(wrap); wrap.append(btn, list);

    let isOpen = false, idx = -1;
    function setValue(v) {
      sel.value = v;
      const o = opts.find(x => x.value === v);
      val.textContent = o ? o.text : ph;
      val.classList.toggle('ph', !o);
      items.forEach(li => li.setAttribute('aria-selected', String(li.dataset.value === v)));
    }
    function setActive(i, scroll) {
      idx = (i + items.length) % items.length;
      items.forEach((li, k) => li.classList.toggle('is-active', k === idx));
      btn.setAttribute('aria-activedescendant', items[idx].id);
      if (scroll === false) return;
      const li = items[idx];
      if (li.offsetTop < list.scrollTop) list.scrollTop = li.offsetTop - 6;
      else if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight + 6;
    }
    function open() {
      if (isOpen) return;
      selects.forEach(s => s !== api && s.close());
      isOpen = true; anySelectOpen = true;
      wrap.classList.remove('up'); wrap.classList.add('open');
      list.hidden = false; btn.setAttribute('aria-expanded', 'true');
      const r = btn.getBoundingClientRect(), h = list.offsetHeight;
      if (innerHeight - r.bottom < h + 16 && r.top > innerHeight - r.bottom) wrap.classList.add('up');
      const cur = opts.findIndex(o => o.value === sel.value);
      setActive(cur >= 0 ? cur : 0);
      queueGuide();
    }
    function close() {
      if (!isOpen) return;
      isOpen = false; wrap.classList.remove('open');
      list.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.removeAttribute('aria-activedescendant');
      anySelectOpen = selects.some(s => s.isOpen());
      queueGuide();
    }
    function choose(i) {
      setValue(items[i].dataset.value);
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      close(); btn.focus();
    }
    const api = { close, isOpen: () => isOpen, reset: () => setValue('') };
    selects.push(api);

    btn.addEventListener('click', () => (isOpen ? close() : open()));
    btn.addEventListener('keydown', e => {
      if (!isOpen) {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open(); }
        return;
      }
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); setActive(idx + 1); break;
        case 'ArrowUp': e.preventDefault(); setActive(idx - 1); break;
        case 'Home': e.preventDefault(); setActive(0); break;
        case 'End': e.preventDefault(); setActive(items.length - 1); break;
        case 'Enter': case ' ': e.preventDefault(); choose(idx); break;
        case 'Escape': e.preventDefault(); close(); break;
        case 'Tab': close(); break;
      }
    });
    list.addEventListener('mousedown', e => e.preventDefault());       // el foco se queda en el botón
    list.addEventListener('click', e => { const li = e.target.closest('li'); if (li) choose(items.indexOf(li)); });
    list.addEventListener('mousemove', e => { const li = e.target.closest('li'); if (li) setActive(items.indexOf(li), false); });
    document.addEventListener('pointerdown', e => { if (isOpen && !wrap.contains(e.target)) close(); });
    btn.addEventListener('blur', () => setTimeout(() => { if (isOpen && !wrap.contains(document.activeElement)) close(); }, 0));
  }
  $$('select.js-select').forEach(enhanceSelect);
  form.addEventListener('reset', () => setTimeout(() => selects.forEach(s => s.reset()), 0));

  /* 6 · GUÍA ANIMADA ───────────────────────────────────────────────
     👆 señala un botón · ✍️ escribe en el formulario · 👇 señala la siguiente carpeta */
  const guide = $('#guide'), glyph = $('#guideGlyph');
  const EMOJI = { up: '👆', down: '👇', write: '✍️' };
  let gMode = '', gTimer, qFrame;
  const visible = el => !!el && el.getClientRects().length > 0;

  function nextTabAfter(from) {
    const order = [];
    for (let n = from + 1; n <= tabs.length; n++) order.push(n);
    for (let n = 1; n <= from; n++) order.push(n);
    return order.find(n => !isDone(n) && unlocked(n)) || 0;
  }
  const tabTarget = from => { const n = nextTabAfter(from); return n ? { el: tabs[n - 1], mode: 'down' } : null; };

  function formTarget() {
    const stepEl = steps[stepIdx];
    const controls = $$('input.input, textarea.input, .select-btn, .consent input', stepEl);
    const empty = el => el._sel ? !el._sel.value : el.type === 'checkbox' ? !el.checked : !el.value.trim();
    const empties = controls.filter(empty);
    const pick = empties.find(el => el.required) || (touched.has(stepIdx) ? null : empties[0]);
    if (pick) {
      const isCheck = pick.type === 'checkbox';
      return { el: isCheck ? pick.closest('label') : pick, mode: isCheck ? 'up' : 'write' };
    }
    return { el: submitBtn.hidden ? nextBtn : submitBtn, mode: 'up' };
  }

  function target() {
    if (anySelectOpen) return null;
    const a = S.active;
    if (a === 0) {
      if (!S.videoStarted && !videoFailed && visible(playBtn)) return { el: playBtn, mode: 'up' };
      return tabTarget(0);
    }
    if (a === 1) {
      if (!formWrap.hidden) return formTarget();
      if (!S.booked) return { el: $('#bookBtn'), mode: 'down' };
    }
    return tabTarget(a);
  }

  function move(t) {
    const r = t.el.getBoundingClientRect(), W = 46;
    let x, y;
    if (t.mode === 'up') { x = r.left + r.width / 2 - 16; y = r.bottom - 6; }
    else if (t.mode === 'down') { x = r.left + Math.min(r.width / 2, 90) - W / 2 + 4; y = r.top - W + 4; }
    else { x = r.right - Math.min(r.width * 0.35, 120) - W / 2; y = r.top - 30; }
    const maxX = document.documentElement.clientWidth - W - 6;
    guide.style.left = Math.max(6, Math.min(x, maxX)) + window.scrollX + 'px';
    guide.style.top = y + window.scrollY + 'px';
  }
  const imgOk = {};
  Object.keys(CFG.GUIDE_IMAGES || {}).forEach(k => {     // si el archivo existe, se usa en lugar del emoji nativo
    const im = new Image(); im.onload = () => { imgOk[k] = true; queueGuide(); }; im.src = CFG.GUIDE_IMAGES[k];
  });
  function showGuide(t) {
    if (imgOk[t.mode]) glyph.innerHTML = '<img class="gi" alt="" src="' + CFG.GUIDE_IMAGES[t.mode] + '">'; else glyph.textContent = EMOJI[t.mode];
    guide.dataset.mode = t.mode;
    guide.classList.add('nogl'); move(t); void guide.offsetWidth; guide.classList.remove('nogl');
    guide.classList.add('on');
    gMode = t.mode;
  }
  function placeGuide() {
    clearTimeout(gTimer);
    const t = target();
    if (!t || !visible(t.el)) { guide.classList.remove('on'); gMode = ''; return; }
    if (!guide.classList.contains('on')) { showGuide(t); return; }
    if (t.mode === gMode) { move(t); return; }           // mismo gesto: la mano se desliza al nuevo sitio
    guide.classList.remove('on');                         // distinto gesto: una desaparece…
    gTimer = setTimeout(() => {                           // …y aparece la otra
      const t2 = target();
      if (t2 && visible(t2.el)) showGuide(t2);
    }, 260);
  }
  function queueGuide() { cancelAnimationFrame(qFrame); qFrame = requestAnimationFrame(placeGuide); }

  window.addEventListener('resize', queueGuide);
  window.addEventListener('load', queueGuide);
  if ('ResizeObserver' in window) new ResizeObserver(queueGuide).observe(document.body);

  /* 6b · COOKIES / ANALÍTICA ─────────────────────────────────────
     La analítica es opcional y solo se activa tras consentimiento.
     Google Analytics y Microsoft Clarity son servicios independientes. */
  const ck = $('#cookieSheet'), CK = 'mr_cookies', ckSw = $('#ckAnalytics');
  const hasGA = !!CFG.ANALYTICS_ID;
  const hasClarity = !!CFG.CLARITY_ID;
  const hasAnalytics = hasGA || hasClarity;
  const ckGet = () => { try { return JSON.parse(localStorage.getItem(CK)); } catch (e) { return null; } };

  function loadAnalytics() {
    if (hasGA && !window.__ga) {
      window.__ga = true;
      const sc = document.createElement('script');
      sc.async = true;
      sc.src = 'https://www.googletagmanager.com/gtag/js?id=' + CFG.ANALYTICS_ID;
      document.head.append(sc);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date());
      gtag('config', CFG.ANALYTICS_ID, { anonymize_ip: true });
    }

    if (hasClarity && !window.__clarity) {
      window.__clarity = true;
      window.clarity = window.clarity || function () {
        (window.clarity.q = window.clarity.q || []).push(arguments);
      };
      const sc = document.createElement('script');
      sc.async = true;
      sc.src = 'https://www.clarity.ms/tag/' + CFG.CLARITY_ID;
      document.head.append(sc);
      // Consent Mode V2: esta carga solo ocurre después de aceptar analítica.
      window.clarity('consentv2', {
        ad_Storage: 'denied',
        analytics_Storage: 'granted'
      });
    }
  }

  function track(name, params) {
    if (window.__ga && typeof window.gtag === 'function') window.gtag('event', name, params || {});
    if (window.__clarity && typeof window.clarity === 'function') window.clarity('event', name);
  }

  const ckOpen = () => { ck.hidden = false; }, ckClose = () => { ck.hidden = true; };
  function ckDecide(an) {
    const prev = ckGet();
    try { localStorage.setItem(CK, JSON.stringify({ analytics: !!an, date: Date.now() })); } catch (e) {}
    if (an) loadAnalytics();
    else if (prev && prev.analytics && window.__clarity) {
      window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
      location.reload();
      return;
    } else if (prev && prev.analytics && window.__ga) {
      location.reload();
      return;
    }
    ckClose();
  }

  $('#ckAnRow').hidden = !hasAnalytics;
  $('#ckNone').hidden = hasAnalytics;
  $('#ckReject').hidden = !hasAnalytics;
  $('#ckSave').hidden = !hasAnalytics;
  $('#ckAccept').textContent = hasAnalytics ? 'Aceptar todo' : 'Entendido';
  ckSw.addEventListener('click', () => ckSw.setAttribute('aria-checked', String(ckSw.getAttribute('aria-checked') !== 'true')));
  $('#ckAccept').addEventListener('click', () => hasAnalytics ? ckDecide(true) : ckClose());
  $('#ckReject').addEventListener('click', () => ckDecide(false));
  $('#ckSave').addEventListener('click', () => ckDecide(ckSw.getAttribute('aria-checked') === 'true'));
  $('#manageCookies').addEventListener('click', () => { const c = ckGet(); ckSw.setAttribute('aria-checked', String(!!(c && c.analytics))); ckOpen(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !ck.hidden) ckClose(); });
  { const c = ckGet(); if (c && c.analytics) loadAnalytics(); else if (hasAnalytics && !c) setTimeout(ckOpen, 1200); }

  /* 7 · ARRANQUE ───────────────────────────────────────────────── */
  refresh();
  showStep(0, false);
  if (S.formSent) showDone();
  queueGuide();
})();
