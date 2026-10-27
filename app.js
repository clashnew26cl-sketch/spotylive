/* =====================================================================
   Spotylive — app.js
   Supabase: Auth (email + OTP) · Postgres · Storage · Realtime
   ===================================================================== */
'use strict';
(() => {
const CFG = window.SPOTYLIVE_CONFIG || {};

/* ---------------- helpers ---------------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const fmt = s => { if (!isFinite(s) || s < 0) s = 0; const m = Math.floor(s / 60), x = Math.floor(s % 60); return `${m}:${String(x).padStart(2, '0')}`; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
const debounce = (f, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };
const timeAgo = d => {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'همین الان'; if (s < 3600) return fa(Math.floor(s / 60)) + ' دقیقه پیش';
  if (s < 86400) return fa(Math.floor(s / 3600)) + ' ساعت پیش'; if (s < 604800) return fa(Math.floor(s / 86400)) + ' روز پیش';
  return new Date(d).toLocaleDateString('fa-IR');
};
const hhmm = d => new Date(d).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

/* ---------------- icons ---------------- */
const sv = (d, fill) => `<svg viewBox="0 0 24 24" ${fill ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'}>${d}</svg>`;
const I = {
  play: sv('<path d="M7 4.6v14.8a1.1 1.1 0 0 0 1.7.9l11.6-7.4a1.1 1.1 0 0 0 0-1.8L8.7 3.7A1.1 1.1 0 0 0 7 4.6z"/>', 1),
  pause: sv('<rect x="5.5" y="4" width="4.6" height="16" rx="1.6"/><rect x="13.9" y="4" width="4.6" height="16" rx="1.6"/>', 1),
  next: sv('<path d="M4.5 5.6v12.8a1 1 0 0 0 1.6.8l8.6-6.4a1 1 0 0 0 0-1.6L6.1 4.8a1 1 0 0 0-1.6.8z"/><rect x="16.5" y="4.5" width="3" height="15" rx="1.3"/>', 1),
  prev: sv('<path d="M19.5 5.6v12.8a1 1 0 0 1-1.6.8l-8.6-6.4a1 1 0 0 1 0-1.6l8.6-6.4a1 1 0 0 1 1.6.8z"/><rect x="4.5" y="4.5" width="3" height="15" rx="1.3"/>', 1),
  shuffle: sv('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'),
  repeat: sv('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
  repeat1: sv('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/>'),
  heart: sv('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>'),
  home: sv('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  search: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  lib: sv('<path d="M4 4v16M9 4v16M14 4.5l5.5 15"/>'),
  chat: sv('<path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.5-5.2A8.5 8.5 0 1 1 21 12z"/>'),
  user: sv('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  users: sv('<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  upload: sv('<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>'),
  more: sv('<circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/>', 1),
  back: sv('<path d="m9 6 6 6-6 6"/>'),
  down: sv('<path d="m6 9 6 6 6-6"/>'),
  send: sv('<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>'),
  live: sv('<path d="M3 15v-3a9 9 0 0 1 18 0v3"/><rect x="2" y="14" width="5" height="7" rx="2"/><rect x="17" y="14" width="5" height="7" rx="2"/>'),
  close: sv('<path d="M18 6 6 18M6 6l12 12"/>'),
  queue: sv('<path d="M3 6h13M3 12h13M3 18h8"/><path d="M17 15v6l4-3z"/>'),
  logout: sv('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  lock: sv('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  edit: sv('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  trash: sv('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
  check: sv('<path d="M20 6 9 17l-5-5"/>'),
  music: sv('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  listplus: sv('<path d="M3 6h12M3 12h12M3 18h7M18 15v6M15 18h6"/>'),
  share: sv('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>'),
  camera: sv('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
  eye: sv('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'),
  vol: sv('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'),
  next2: sv('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  userplus: sv('<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6"/>'),
  usercheck: sv('<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 11l2 2 4-4"/>'),
};
const LOGO = `<img src="logo.svg" alt="Spotylive">`;

/* ---------------- state ---------------- */
let auth = null, db = null, rdb = null, me = null, rt = null, inboxCh = null, chatUnsub = null;
const S = {
  tracks: [], likedTracks: [], liked: new Set(), playlists: [],
  following: new Set(), followingProfiles: [], online: new Set(),
  profiles: new Map(), unread: new Map(), lists: {}, tmap: new Map(),
  tab: 'home', libTab: 'mine', chatWith: null, navToken: 0,
};
const A = { email: '' };

/* =====================================================================
   UI primitives: toast · sheets · layers (back button) · ripple · liquid
   ===================================================================== */
function toast(msg, type = 'info', action) {
  const t = document.createElement('div');
  t.className = 'toast glass ' + type;
  t.innerHTML = `<span>${esc(msg)}</span>`;
  if (action) { const b = document.createElement('button'); b.className = 'tbtn'; b.textContent = action.label; b.onclick = () => { action.fn(); kill(); }; t.appendChild(b); }
  $('#toasts').appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('in')));
  const kill = () => { t.classList.remove('in'); setTimeout(() => t.remove(), 450); };
  setTimeout(kill, action ? 8000 : 3400);
}

// لایه‌ها برای دکمه Back گوشی
const layers = [];
let afterPop = null;
function pushLayer(closeFn) { layers.push(closeFn); history.pushState({ l: layers.length }, ''); }
function popLayer(then) { if (!layers.length) { then && then(); return; } afterPop = then || null; history.back(); }
window.addEventListener('popstate', () => {
  const f = layers.pop(); if (f) f();
  const a = afterPop; afterPop = null; if (a) setTimeout(a, 30);
});

function openSheet(html, { center = false, onClose } = {}) {
  const w = document.createElement('div');
  w.className = 'sheet-wrap';
  w.innerHTML = `<div class="sheet-bg"></div><div class="sheet ${center ? 'center' : ''}">${center ? '' : '<div class="grab"></div>'}${html}</div>`;
  $('#sheets').appendChild(w);
  requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add('in')));
  const remove = () => { w.classList.remove('in'); setTimeout(() => w.remove(), 450); onClose && onClose(); };
  pushLayer(remove);
  const close = then => popLayer(then);
  w.querySelector('.sheet-bg').onclick = () => close();
  // کشیدن به پایین برای بستن
  const sh = w.querySelector('.sheet'); let y0 = null, dy = 0;
  sh.addEventListener('touchstart', e => { if (sh.scrollTop <= 0 && !e.target.closest('input,textarea,.hscroll')) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
  sh.addEventListener('touchmove', e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transition = 'none'; sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
  sh.addEventListener('touchend', () => { if (y0 == null) return; sh.style.transition = ''; sh.style.transform = ''; if (dy > 110) close(); y0 = null; });
  return { el: sh, close, wrap: w };
}
function topSheetClose(then) { popLayer(then); }

// ریپل روی دکمه‌ها + نور مایع روی شیشه‌ها
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn,.playbig,.mplay,.sendbtn,.livebtn,.qtile');
  if (!b) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
  const s = document.createElement('span'); s.className = 'ripple';
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
  b.style.overflow = 'hidden'; b.appendChild(s); setTimeout(() => s.remove(), 650);
}, { passive: true });
document.addEventListener('pointermove', e => {
  const g = e.target.closest('.liquid'); if (!g) return;
  const r = g.getBoundingClientRect();
  g.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
  g.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
}, { passive: true });

function setBusy(btn, on, label) {
  if (!btn) return;
  if (on) { btn._html = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin"></span>${label ? `<span>${label}</span>` : ''}`; }
  else { btn.disabled = false; if (btn._html) btn.innerHTML = btn._html; }
}


/* =====================================================================
   Avatars / covers
   ===================================================================== */
function cover(t) {
  if (t && t.cover_url) return `<img class="cv" src="${esc(t.cover_url)}" loading="lazy" crossorigin="anonymous" alt="">`;
  return `<div class="cv ph" style="--h:${hue((t && t.title) || 'x')}">${I.music}</div>`;
}
function avatar(p, size = 44) {
  const name = (p && (p.display_name || p.username)) || '?';
  const inner = p && p.avatar_url ? `<img src="${esc(p.avatar_url)}" alt="" loading="lazy">` : esc(name.trim()[0] || '?').toUpperCase();
  return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${size * .42}px;${p && p.avatar_url ? '' : `background:linear-gradient(135deg,hsl(${hue(name)} 80% 70%),hsl(${hue(name) + 60} 70% 45%))`}">${inner}</div>`;
}
function avOnline(p, size = 48) { return `<div class="avwrap">${avatar(p, size)}<span class="odot ${S.online.has(p.id) ? 'on' : ''}" data-online-for="${p.id}"></span></div>`; }
const trackUrl = t => t.audio_url;
const pName = p => (p && (p.display_name || p.username)) || 'کاربر';

function reg(name, arr) { S.lists[name] = arr; arr.forEach(t => t && S.tmap.set(t.id, t)); return name; }

/* ---------------- Firebase data helpers ---------------- */
const FV = () => firebase.firestore.FieldValue;
const docs = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
const byNew = (a, b) => (b.created_at || 0) - (a.created_at || 0);
const chunk = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };
const pairId = (a, b) => [a, b].sort().join('_');
let serverOffset = 0;
const serverNow = () => Date.now() + serverOffset;

async function getProfiles(ids) {
  const need = [...new Set(ids)].filter(id => id && !S.profiles.has(id));
  for (const part of chunk(need, 30)) {
    const snap = await db.collection('profiles').where(firebase.firestore.FieldPath.documentId(), 'in', part).get();
    docs(snap).forEach(p => S.profiles.set(p.id, p));
  }
  return ids.map(id => S.profiles.get(id)).filter(Boolean);
}
async function getProfile(id) { return (await getProfiles([id]))[0]; }
async function getTracks(ids) {
  const need = [...new Set(ids)].filter(id => id && !S.tmap.has(id));
  for (const part of chunk(need, 30)) {
    const snap = await db.collection('tracks').where(firebase.firestore.FieldPath.documentId(), 'in', part).get();
    docs(snap).forEach(t => S.tmap.set(t.id, t));
  }
  return ids.map(id => S.tmap.get(id)).filter(Boolean);
}
async function tracksOf(uid) { return docs(await db.collection('tracks').where('owner', '==', uid).get()).sort(byNew); }
async function followCounts(uid) {
  const [a, b] = await Promise.all([db.collection('follows').where('following', '==', uid).get(), db.collection('follows').where('follower', '==', uid).get()]);
  return [a.size, b.size];
}
async function hydratePlaylists(pls) {
  await getTracks(pls.flatMap(p => p.track_ids || []));
  pls.forEach(p => p.playlist_tracks = (p.track_ids || []).map(id => ({ track_id: id, tracks: S.tmap.get(id) })).filter(x => x.tracks));
  return pls;
}
async function usernameFree(u) {
  const d = await db.collection('usernames').doc(u.toLowerCase()).get();
  return !d.exists;
}
async function claimUsername(uid, u, extra) {
  u = u.toLowerCase();
  await db.runTransaction(async tx => {
    const ref = db.collection('usernames').doc(u), cur = await tx.get(ref);
    if (cur.exists && cur.data().uid !== uid) throw new Error('این نام کاربری قبلاً گرفته شده');
    tx.set(ref, { uid });
    if (extra && extra.old && extra.old !== u) tx.delete(db.collection('usernames').doc(extra.old));
  });
}

/* =====================================================================
   BOOT
   ===================================================================== */
const splashMin = sleep(1500);
async function boot() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  const fc = CFG.firebase || {};
  if (!window.firebase || !fc.apiKey || /YOUR|PASTE/i.test(fc.apiKey)) { await splashMin; hideSplash(); return showSetupNeeded(); }
  firebase.initializeApp(fc);
  auth = firebase.auth(); db = firebase.firestore(); rdb = firebase.database();
  auth.languageCode = 'fa';
  rdb.ref('.info/serverTimeOffset').on('value', s => { serverOffset = s.val() || 0; });
  const user = await new Promise(res => { const off = auth.onAuthStateChanged(u => { off(); res(u); }); });
  await splashMin; hideSplash();
  if (user && user.emailVerified) enterApp();
  else if (user) { A.email = user.email; showAuth('verify'); }
  else showAuth('login');
}
function hideSplash() { const s = $('#splash'); s.classList.add('out'); setTimeout(() => s.remove(), 800); }
function showSetupNeeded() {
  const a = $('#auth'); a.hidden = false;
  a.innerHTML = `<div class="setup glass liquid"><div class="auth-logo">${LOGO}</div><h1 class="brand" style="font-size:30px">Spotylive</h1>
  <p style="color:var(--muted);margin-top:10px">${window.firebase ? 'اپ هنوز به Firebase وصل نشده.' : 'کتابخانه Firebase بارگذاری نشد؛ اینترنت را بررسی کن.'}<br>
  فایل <code>config.js</code> را باز کن و تنظیمات <code>firebase</code> و <code>Cloudinary</code> را وارد کن.</p></div>`;
}

/* =====================================================================
   AUTH (Firebase: ایمیل + رمز + لینک تأیید ایمیل)
   ===================================================================== */
const AUTH = {
  login: () => `<p class="sub">خوش برگشتی 👋</p>
    <form id="fAuth" class="form" data-f="login">
      <label class="field"><span>ایمیل</span><input type="email" name="email" required autocomplete="email" dir="ltr" value="${esc(A.email)}"></label>
      <label class="field"><span>رمز عبور</span><input type="password" name="password" required minlength="6" autocomplete="current-password" dir="ltr"><button type="button" class="eye" data-act="eye">${I.eye}</button></label>
      <div class="ferr"></div>
      <button class="btn primary big" type="submit">ورود</button>
    </form>
    <div class="auth-links"><button data-act="auth" data-m="forgot">فراموشی رمز</button><button data-act="auth" data-m="signup">ساخت حساب جدید ✨</button></div>`,
  signup: () => `<p class="sub">حساب جدید بساز و شروع کن</p>
    <form id="fAuth" class="form" data-f="signup">
      <label class="field"><span>نام نمایشی</span><input name="display" required maxlength="40" autocomplete="name"></label>
      <label class="field"><span>نام کاربری (انگلیسی)</span><input name="username" required dir="ltr" maxlength="24" pattern="[a-zA-Z0-9_]{3,24}" autocomplete="username"><div class="hint" id="unHint">حروف انگلیسی، عدد و _ (۳ تا ۲۴ کاراکتر)</div></label>
      <label class="field"><span>ایمیل</span><input type="email" name="email" required dir="ltr" autocomplete="email" value="${esc(A.email)}"></label>
      <label class="field"><span>رمز عبور</span><input type="password" name="password" required minlength="8" dir="ltr" autocomplete="new-password"><button type="button" class="eye" data-act="eye">${I.eye}</button></label>
      <label class="field"><span>تکرار رمز</span><input type="password" name="password2" required minlength="8" dir="ltr" autocomplete="new-password"></label>
      <div class="ferr"></div>
      <button class="btn primary big" type="submit">ساخت حساب</button>
    </form>
    <div class="auth-links"><span></span><button data-act="auth" data-m="login">حساب دارم، ورود</button></div>`,
  forgot: () => `<p class="sub">ایمیلت را بنویس تا لینک تغییر رمز برایت بفرستیم</p>
    <form id="fAuth" class="form" data-f="forgot">
      <label class="field"><span>ایمیل</span><input type="email" name="email" required dir="ltr" value="${esc(A.email)}"></label>
      <div class="ferr"></div>
      <button class="btn primary big" type="submit">ارسال لینک تغییر رمز</button>
    </form>
    <div class="auth-links"><span></span><button data-act="auth" data-m="login">بازگشت به ورود</button></div>`,
  verify: () => `<div class="empty" style="padding:6px 0 0"><div class="eico">✉️</div></div>
    <p class="sub">یک <b style="color:var(--text)">لینک تأیید</b> به<br><span class="otp-mail">${esc(A.email)}</span><br>فرستادیم. ایمیلت را باز کن و روی لینک بزن، بعد برگرد این‌جا.</p>
    <form id="fAuth" class="form" data-f="verify">
      <div class="ferr"></div>
      <button class="btn primary big" type="submit">${I.check} تأیید کردم، ادامه</button>
      <div class="resend" style="text-align:center"></div>
    </form>
    <div class="auth-links"><span></span><button data-act="authOut">ورود با حساب دیگر</button></div>`,
  sent: () => `<div class="empty" style="padding:6px 0 0"><div class="eico">🔐</div></div>
    <p class="sub">لینک تغییر رمز به <span class="otp-mail">${esc(A.email)}</span> فرستاده شد.<br>روی لینک داخل ایمیل بزن، رمز جدید را بنویس و بعد این‌جا وارد شو.<br><small>پوشهٔ Spam را هم ببین.</small></p>
    <form id="fAuth" class="form" data-f="none"><button class="btn primary big" type="button" data-act="auth" data-m="login">بازگشت به ورود</button></form>`,
};

function showAuth(mode, data) {
  if (data) Object.assign(A, data);
  $('#app').hidden = true;
  const a = $('#auth'); a.hidden = false;
  a.innerHTML = `<div class="auth-card glass liquid"><div class="auth-logo">${LOGO}</div><h1 class="brand">Spotylive</h1>${AUTH[mode]()}</div>`;
  const f = $('#fAuth');
  f.addEventListener('submit', e => { e.preventDefault(); onAuthSubmit(f); });
  if (mode === 'verify') startResendTimer($('.resend', a));
  if (mode === 'signup') {
    const un = f.username, hint = $('#unHint');
    un.addEventListener('input', debounce(async () => {
      const v = un.value.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,24}$/.test(v)) { hint.className = 'hint bad'; hint.textContent = 'فقط حروف انگلیسی، عدد و _ (۳ تا ۲۴)'; return; }
      let free = true; try { free = await usernameFree(v); } catch {}
      hint.className = 'hint ' + (free ? 'ok' : 'bad'); hint.textContent = free ? '✓ این نام آزاد است' : 'این نام قبلاً گرفته شده';
    }, 450));
  }
  const first = $('input', f); first && setTimeout(() => first.focus(), 350);
}

function startResendTimer(el, sec = 60) {
  let left = sec;
  const tick = () => {
    if (!el.isConnected) return;
    if (left > 0) { el.innerHTML = `ارسال دوباره تا ${fa(left)} ثانیه دیگر`; left--; setTimeout(tick, 1000); }
    else { el.innerHTML = `ایمیل نرسید؟ <button type="button" data-act="resend">ارسال دوباره</button> · پوشه Spam را هم ببین`; }
  };
  tick();
}

function faErr(e) {
  const c = (e && e.code) || '', m = (e && (e.message || e)) + '';
  const map = {
    'auth/invalid-credential': 'ایمیل یا رمز عبور اشتباه است', 'auth/wrong-password': 'ایمیل یا رمز عبور اشتباه است',
    'auth/user-not-found': 'حسابی با این ایمیل پیدا نشد', 'auth/invalid-email': 'ایمیل معتبر نیست',
    'auth/email-already-in-use': 'با این ایمیل قبلاً حساب ساخته شده', 'auth/weak-password': 'رمز ضعیف است — حداقل ۸ کاراکتر شامل حرف و عدد',
    'auth/too-many-requests': 'تعداد تلاش‌ها زیاد شد؛ چند دقیقه بعد دوباره امتحان کن', 'auth/network-request-failed': 'اتصال اینترنت برقرار نیست',
    'auth/operation-not-allowed': 'ورود با ایمیل در Firebase روشن نشده (مرحلهٔ Authentication)', 'auth/requires-recent-login': 'برای امنیت، یک بار خارج و دوباره وارد شو',
    'permission-denied': 'دسترسی رد شد — قوانین Firestore را بررسی کن', 'unavailable': 'اتصال به سرور برقرار نیست',
  };
  if (map[c]) return map[c];
  if (/Failed to fetch|network/i.test(m)) return 'اتصال اینترنت برقرار نیست';
  if (/File size too large|too large/i.test(m)) return 'حجم فایل بیشتر از حد مجاز است';
  if (/Upload preset/i.test(m)) return 'تنظیم Cloudinary (upload preset) اشتباه است';
  return m.replace(/^Firebase:\s*/, '');
}

async function onAuthSubmit(f) {
  const kind = f.dataset.f, btn = $('button[type=submit]', f), errBox = $('.ferr', f);
  if (!btn || btn.disabled) return;
  errBox.innerHTML = '';
  const fail = e => { errBox.innerHTML = `<div class="auth-err">${esc(faErr(e))}</div>`; vib([30, 40, 30]); };
  setBusy(btn, true);
  try {
    if (kind === 'login') {
      const email = f.email.value.trim().toLowerCase(); A.email = email;
      const { user } = await auth.signInWithEmailAndPassword(email, f.password.value);
      if (!user.emailVerified) { try { await user.sendEmailVerification(); } catch {} return showAuth('verify'); }
      enterApp();
    }
    else if (kind === 'signup') {
      const username = f.username.value.trim().toLowerCase(), display = f.display.value.trim();
      const email = f.email.value.trim().toLowerCase(), pw = f.password.value;
      if (!/^[a-z0-9_]{3,24}$/.test(username)) throw new Error('نام کاربری معتبر نیست');
      if (pw !== f.password2.value) throw new Error('رمزها یکی نیستند');
      if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) throw new Error('رمز باید حداقل ۸ کاراکتر و شامل حرف و عدد باشد');
      if (!(await usernameFree(username))) throw new Error('این نام کاربری قبلاً گرفته شده');
      A.email = email;
      const { user } = await auth.createUserWithEmailAndPassword(email, pw);
      try {
        await claimUsername(user.uid, username);
        await db.collection('profiles').doc(user.uid).set({ username, display_name: display || username, name_lc: (display || username).toLowerCase(), avatar_url: null, bio: '', created_at: Date.now() });
      } catch (e) { await user.delete().catch(() => {}); throw e; }
      await user.updateProfile({ displayName: display });
      await user.sendEmailVerification();
      toast('لینک تأیید به ایمیلت ارسال شد ✉️', 'ok');
      showAuth('verify');
    }
    else if (kind === 'forgot') {
      const email = f.email.value.trim().toLowerCase(); A.email = email;
      await auth.sendPasswordResetEmail(email);
      showAuth('sent');
    }
    else if (kind === 'verify') {
      const u = auth.currentUser; if (!u) return showAuth('login');
      await u.reload();
      if (!auth.currentUser.emailVerified) throw new Error('هنوز تأیید نشده — روی لینک داخل ایمیل بزن (پوشه Spam را هم ببین)');
      await u.getIdToken(true);
      vib(20); toast('ایمیلت تأیید شد، خوش اومدی! 🎧', 'ok'); enterApp();
    }
  } catch (e) { fail(e); }
  finally { if (btn.isConnected) setBusy(btn, false); }
}

/* =====================================================================
   ENTER APP / DATA
   ===================================================================== */
let appStarted = false;
async function enterApp() {
  const user = auth.currentUser;
  if (!user) return showAuth('login');
  if (!user.emailVerified) { A.email = user.email; return showAuth('verify'); }
  const ref = db.collection('profiles').doc(user.uid);
  let snap = await ref.get();
  if (!snap.exists) {
    let un = (user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') + 'xxx').slice(0, 18);
    if (!(await usernameFree(un))) un = (un.slice(0, 14) + Math.random().toString(36).slice(2, 7));
    await claimUsername(user.uid, un);
    await ref.set({ username: un, display_name: user.displayName || un, name_lc: (user.displayName || un).toLowerCase(), avatar_url: null, bio: '', created_at: Date.now() });
    snap = await ref.get();
  }
  me = { id: user.uid, ...snap.data(), email: user.email };
  S.profiles.set(me.id, me);
  $('#auth').hidden = true; $('#auth').innerHTML = '';
  $('#app').hidden = false;
  if (!appStarted) { appStarted = true; buildChrome(); buildNP(); }
  await loadAll();
  startRealtime();
  go('home');
}

async function loadAll() {
  const [tr, lk, pl, fo, ch] = await Promise.all([
    tracksOf(me.id),
    db.collection('profiles').doc(me.id).collection('likes').get(),
    db.collection('playlists').where('owner', '==', me.id).get(),
    db.collection('follows').where('follower', '==', me.id).get(),
    db.collection('chats').where('members', 'array-contains', me.id).get(),
  ]);
  S.tracks = tr; reg('mine', S.tracks);
  const likeRows = docs(lk).sort(byNew);
  S.likedTracks = await getTracks(likeRows.map(r => r.id)); reg('liked', S.likedTracks);
  S.liked = new Set(S.likedTracks.map(t => t.id));
  S.playlists = await hydratePlaylists(docs(pl).sort(byNew));
  S.following = new Set(docs(fo).map(r => r.following));
  S.followingProfiles = await getProfiles([...S.following]);
  S.unread = new Map();
  docs(ch).forEach(c => { const n = (c.unread || {})[me.id] || 0; if (n) S.unread.set(c.members.find(x => x !== me.id), n); });
  updateBadges();
}

async function logout() {
  if (L.active) endLive(true);
  audio.pause(); audio.removeAttribute('src');
  stopRealtime();
  await auth.signOut();
  me = null; P.queue = []; P.i = -1; P.cur = null; renderMini();
  showAuth('login');
}

/* =====================================================================
   CHROME (tabbar / sidebar)
   ===================================================================== */
const TABS = [
  { id: 'home', label: 'خانه', icon: I.home },
  { id: 'search', label: 'جستجو', icon: I.search },
  { id: 'library', label: 'کتابخانه', icon: I.lib },
  { id: 'chats', label: 'گفتگو', icon: I.chat },
  { id: 'profile', label: 'من', icon: I.user },
];
function buildChrome() {
  const tabHtml = TABS.map(t => `<button class="tab" data-act="tab" data-tab="${t.id}">${t.icon}<span>${t.label}</span>${t.id === 'chats' ? '<i class="badge" hidden></i>' : ''}</button>`).join('');
  $('#tabbar').insertAdjacentHTML('beforeend', tabHtml);
  $('#sideNav').innerHTML = tabHtml;
  $('#side [data-act=upload]').innerHTML = `${I.upload}<span>آپلود آهنگ</span>`;
  window.addEventListener('resize', debounce(moveBlob, 100));
}
function moveBlob() {
  const on = $('#tabbar .tab.on'), blob = $('#tabbar .blob'); if (!on || !blob) return;
  const r = on.getBoundingClientRect(), pr = $('#tabbar').getBoundingClientRect();
  blob.style.left = (r.left - pr.left + 6) + 'px'; blob.style.width = (r.width - 12) + 'px';
  blob.classList.add('squish'); setTimeout(() => blob.classList.remove('squish'), 260);
}
function updateBadges() {
  const n = [...S.unread.values()].reduce((a, b) => a + b, 0);
  $$('.tab[data-tab=chats] .badge').forEach(b => { b.hidden = !n; b.textContent = fa(n > 99 ? '99+' : n); });
}

/* =====================================================================
   ROUTER
   ===================================================================== */
const VIEWS = {};
async function go(tab, sub) {
  S.tab = tab;
  $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  moveBlob();
  render(() => VIEWS[tab](sub));
}
async function render(fn) {
  const tok = ++S.navToken, v = $('#view');
  v.innerHTML = `<div class="page">${skeleton()}</div>`;
  try {
    const html = await fn();
    if (tok !== S.navToken) return;
    v.innerHTML = `<div class="page">${html}</div>`; v.scrollTop = 0;
    afterRender();
  } catch (e) { console.error(e); if (tok === S.navToken) v.innerHTML = `<div class="page"><div class="empty"><b>خطا در بارگذاری</b>${esc(faErr(e))}<br><button class="btn ghost" data-act="tab" data-tab="${S.tab}">تلاش دوباره</button></div></div>`; }
}
function refresh() { if (S.sub) return openSub(S.sub.kind, S.sub.arg, true); go(S.tab); }
function skeleton() { return `<div class="skel" style="height:38px;width:50%;margin:10px 0 24px"></div><div class="quick">${'<div class="skel" style="height:58px"></div>'.repeat(4)}</div><div class="skel" style="height:24px;width:35%;margin:28px 0 14px"></div><div style="display:flex;gap:14px">${'<div class="skel" style="width:148px;height:148px;flex-shrink:0"></div>'.repeat(3)}</div>`; }
function afterRender() { markPlaying(); }

// زیرصفحه‌ها (پلی‌لیست، پروفایل دیگران) با Back
S.sub = null;
async function openSub(kind, arg, replace) {
  if (!replace) { const prev = S.sub; pushLayer(() => { S.sub = prev; prev ? openSub(prev.kind, prev.arg, true) : go(S.tab); }); }
  S.sub = { kind, arg };
  render(() => SUBS[kind](arg));
}
function subBack() { popLayer(); }
const SUBS = {};

/* ----------------------- UI blocks ----------------------- */
function trow(t, list, i) {
  return `<div class="trow" style="--i:${Math.min(i, 15)}" data-act="playFrom" data-list="${list}" data-i="${i}" data-id="${t.id}">
    <div class="tcv">${cover(t)}<span class="eq"><i></i><i></i><i></i></span></div>
    <div class="tmeta"><b>${esc(t.title)}</b><small>${esc(t.artist || 'ناشناس')}</small></div>
    ${t.duration ? `<span class="dur">${fmt(t.duration)}</span>` : ''}
    <button class="ibtn like ${S.liked.has(t.id) ? 'on' : ''}" data-act="like" data-id="${t.id}" aria-label="لایک">${I.heart}</button>
    <button class="ibtn" data-act="tmenu" data-id="${t.id}" data-list="${list}" aria-label="بیشتر">${I.more}</button></div>`;
}
function tcard(t, list, i) {
  return `<div class="card" data-act="playFrom" data-list="${list}" data-i="${i}" data-id="${t.id}">
    <div class="cimg">${cover(t)}<span class="eq"><i></i><i></i><i></i></span><span class="fab">${I.play}</span></div>
    <b>${esc(t.title)}</b><small>${esc(t.artist || 'ناشناس')}</small></div>`;
}
function plCover(pl) {
  const cvs = (pl.playlist_tracks || []).map(x => x.tracks).filter(Boolean).slice(0, 4);
  if (cvs.length >= 4) return `<div class="mosaic">${cvs.map(cover).join('')}</div>`;
  if (cvs.length) return cover(cvs[0]);
  return `<div class="cv ph" style="--h:${hue(pl.name)}">${I.lib}</div>`;
}
function emptyState(icon, title, text, btn) { return `<div class="empty"><div class="eico">${icon}</div><b>${title}</b>${text}${btn || ''}</div>`; }
function userRow(p, extra = '') {
  return `<div class="urow" data-act="user" data-id="${p.id}">${avOnline(p, 50)}<div class="umeta"><b>${esc(pName(p))}</b><small class="ltr">@${esc(p.username)}</small></div>${extra}</div>`;
}

/* ----------------------- HOME ----------------------- */
VIEWS.home = async () => {
  const h = new Date().getHours();
  const greet = h < 5 ? 'شب بخیر' : h < 12 ? 'صبح بخیر' : h < 17 ? 'ظهر بخیر' : h < 20 ? 'عصر بخیر' : 'شب بخیر';
  let ft = [];
  if (S.following.size) {
    for (const part of chunk([...S.following], 30)) ft.push(...docs(await db.collection('tracks').where('owner', 'in', part).get()));
    ft = ft.sort(byNew).slice(0, 30);
  }
  reg('friends', ft);
  const quick = [
    `<div class="qtile" data-act="openLiked"><div class="qi liked-cv">${I.heart}</div><b>آهنگ‌های لایک‌شده</b></div>`,
    ...S.playlists.slice(0, 3).map(pl => `<div class="qtile" data-act="playlist" data-id="${pl.id}"><div class="qi">${plCover(pl)}</div><b>${esc(pl.name)}</b></div>`),
    ...S.tracks.slice(0, 5 - Math.min(3, S.playlists.length)).map((t, i) => `<div class="qtile" data-act="playFrom" data-list="mine" data-i="${i}" data-id="${t.id}"><div class="qi">${cover(t)}</div><b>${esc(t.title)}</b></div>`),
  ].slice(0, 6).join('');
  const onlineFriends = S.followingProfiles.filter(p => S.online.has(p.id));
  return `
  <div class="topbar"><h1>${greet}، ${esc(pName(me).split(' ')[0])} <span style="font-size:22px">✨</span></h1>
    <button class="ibtn" data-act="upload" aria-label="آپلود">${I.upload}</button>
    <button data-act="tab" data-tab="profile">${avatar(me, 40)}</button></div>
  <div class="quick">${quick}</div>
  ${onlineFriends.length ? `<div class="sec"><h2>🟢 دوستان آنلاین</h2></div>
    <div class="hscroll">${onlineFriends.map(p => `<div class="card round" style="flex-basis:96px" data-act="openChat" data-id="${p.id}"><div class="cimg" style="width:84px;height:84px;margin:auto">${avatar(p, 84)}</div><b style="font-size:13px">${esc(pName(p))}</b><small>شروع لایو 🎧</small></div>`).join('')}</div>` : ''}
  <div class="sec"><h2>تازه از دوستانت</h2>${S.following.size ? '' : '<button data-act="tab" data-tab="search">پیدا کردن دوستان</button>'}</div>
  ${ft.length ? `<div class="hscroll">${ft.map((t, i) => tcard(t, 'friends', i)).join('')}</div>`
    : emptyState(I.users, 'هنوز دوستی دنبال نکرده‌ای', 'دوستانت را پیدا کن تا آهنگ‌هایشان این‌جا بیاید', '<br><button class="btn ghost sm" data-act="tab" data-tab="search">جستجوی کاربران</button>')}
  <div class="sec"><h2>آپلودهای تو</h2>${S.tracks.length ? '<button data-act="tab" data-tab="library">همه</button>' : ''}</div>
  ${S.tracks.length ? `<div class="hscroll">${S.tracks.slice(0, 20).map((t, i) => tcard(t, 'mine', i)).join('')}</div>`
    : emptyState(I.music, 'کتابخانه‌ات خالی است', 'اولین آهنگت را آپلود کن', '<br><button class="btn primary" data-act="upload">' + I.upload + ' آپلود آهنگ</button>')}
  ${S.playlists.length ? `<div class="sec"><h2>پلی‌لیست‌های تو</h2></div><div class="hscroll">${S.playlists.map(pl => `<div class="card" data-act="playlist" data-id="${pl.id}"><div class="cimg">${plCover(pl)}</div><b>${esc(pl.name)}</b><small>${fa((pl.playlist_tracks || []).length)} آهنگ</small></div>`).join('')}</div>` : ''}`;
};

/* ----------------------- SEARCH ----------------------- */
VIEWS.search = async () => {
  setTimeout(() => { const i = $('#q'); if (i) { i.focus(); i.addEventListener('input', debounce(doSearch, 350)); if (S.lastQ) { i.value = S.lastQ; doSearch(); } } }, 50);
  return `<div class="topbar"><h1>جستجو</h1></div>
  <label class="searchbox glass liquid">${I.search}<input id="q" placeholder="آهنگ، خواننده یا کاربر…" autocomplete="off"></label>
  <div id="sres">${S.followingProfiles.length ? `<div class="sec"><h2>دنبال‌شده‌ها</h2></div>${S.followingProfiles.map(p => userRow(p)).join('')}` : emptyState(I.search, 'دوستانت را پیدا کن', 'نام کاربری یا اسم دوستت را جستجو کن و فالوش کن')}</div>`;
};
async function doSearch() {
  const q = ($('#q') || {}).value?.trim() || ''; S.lastQ = q;
  const box = $('#sres'); if (!box) return;
  if (q.length < 2) return;
  const ql = q.toLowerCase(), end = ql + '\uf8ff';
  const pre = (col, field) => db.collection(col).orderBy(field).startAt(ql).endAt(end).limit(20).get().then(docs).catch(() => []);
  const [u1, u2, t1, t2] = await Promise.all([pre('profiles', 'username'), pre('profiles', 'name_lc'), pre('tracks', 'title_lc'), pre('tracks', 'artist_lc')]);
  const uniq = arr => [...new Map(arr.map(x => [x.id, x])).values()];
  const u = { data: uniq([...u1, ...u2]).filter(p => p.id !== me.id).slice(0, 12) };
  const t = { data: uniq([...t1, ...t2]).sort(byNew).slice(0, 40) };
  u.data.forEach(p => S.profiles.set(p.id, p));
  reg('search', t.data);
  if ($('#q')?.value.trim() !== q) return;
  box.innerHTML = `${(u.data || []).length ? `<div class="sec"><h2>کاربران</h2></div>${u.data.map(p => userRow(p, followBtn(p.id))).join('')}` : ''}
    ${(t.data || []).length ? `<div class="sec"><h2>آهنگ‌ها</h2></div><div class="tlist">${t.data.map((x, i) => trow(x, 'search', i)).join('')}</div>` : ''}
    ${!(u.data || []).length && !(t.data || []).length ? emptyState(I.search, 'نتیجه‌ای پیدا نشد', 'عبارت دیگری امتحان کن') : ''}`;
  markPlaying();
}
const followBtn = id => `<button class="btn ${S.following.has(id) ? 'ghost' : 'primary'} sm" data-act="follow" data-id="${id}">${S.following.has(id) ? 'دنبال می‌کنی' : 'دنبال کردن'}</button>`;

/* ----------------------- LIBRARY ----------------------- */
VIEWS.library = async () => {
  const tab = S.libTab;
  let body = '';
  if (tab === 'mine') body = S.tracks.length ? `<div class="tlist">${S.tracks.map((t, i) => trow(t, 'mine', i)).join('')}</div>` : emptyState(I.music, 'هنوز آهنگی آپلود نکرده‌ای', 'فایل‌های MP3 / M4A / FLAC را آپلود کن؛ کاور و اسم آهنگ خودکار خوانده می‌شود', `<br><button class="btn primary" data-act="upload">${I.upload} آپلود آهنگ</button>`);
  if (tab === 'liked') body = S.likedTracks.length ? `<div class="tlist">${S.likedTracks.map((t, i) => trow(t, 'liked', i)).join('')}</div>` : emptyState(I.heart, 'هنوز آهنگی لایک نکرده‌ای', 'روی قلب کنار هر آهنگ بزن');
  if (tab === 'pl') body = `<button class="urow" style="width:100%" data-act="newPlaylist"><div class="avatar" style="width:56px;height:56px;border-radius:14px">${I.plus}</div><div class="umeta"><b>پلی‌لیست جدید</b></div></button>`
    + S.playlists.map(pl => `<div class="urow" data-act="playlist" data-id="${pl.id}"><div style="width:56px;height:56px;border-radius:14px;overflow:hidden">${plCover(pl)}</div><div class="umeta"><b>${esc(pl.name)}</b><small>${fa((pl.playlist_tracks || []).length)} آهنگ</small></div></div>`).join('');
  return `<div class="topbar"><h1>کتابخانه</h1><button class="ibtn" data-act="newPlaylist">${I.listplus}</button><button class="btn primary sm" data-act="upload">${I.upload} آپلود</button></div>
    <div class="tabs">${[['mine', 'آهنگ‌های من'], ['liked', 'لایک‌شده‌ها'], ['pl', 'پلی‌لیست‌ها']].map(([k, l]) => `<button class="pill ${tab === k ? 'on' : ''}" data-act="libTab" data-k="${k}">${l}</button>`).join('')}</div>
    ${tab !== 'pl' && (tab === 'mine' ? S.tracks : S.likedTracks).length ? `<div style="display:flex;gap:10px;margin-bottom:10px"><button class="btn primary sm" data-act="playAll" data-list="${tab}">${I.play} پخش همه</button><button class="btn ghost sm" data-act="shuffleAll" data-list="${tab}">${I.shuffle} تصادفی</button></div>` : ''}
    ${body}`;
};

SUBS.playlist = async id => {
  const ps = await db.collection('playlists').doc(id).get();
  if (!ps.exists) throw new Error('پلی‌لیست پیدا نشد');
  const [pl] = await hydratePlaylists([{ id: ps.id, ...ps.data() }]);
  const tracks = pl.playlist_tracks.map(x => x.tracks);
  const key = reg('pl:' + id, tracks);
  const owner = pl.owner === me.id ? me : await getProfile(pl.owner);
  S.curPlaylist = pl;
  return `<div class="hero"><button class="ibtn back" data-act="back">${I.back}</button>
    <div class="hcv">${plCover({ ...pl, playlist_tracks: (pl.playlist_tracks || []).map(x => ({ tracks: x.tracks })) })}</div>
    <h1>${esc(pl.name)}</h1><p>${esc(pName(owner))} · ${fa(tracks.length)} آهنگ</p>
    <div class="acts">${tracks.length ? `<button class="btn primary" data-act="playAll" data-list="${key}">${I.play} پخش</button><button class="btn ghost" data-act="shuffleAll" data-list="${key}">${I.shuffle}</button>` : ''}
    ${pl.owner === me.id ? `<button class="btn ghost" data-act="renamePl" data-id="${pl.id}">${I.edit}</button><button class="btn danger" data-act="delPl" data-id="${pl.id}">${I.trash}</button>` : ''}</div></div>
    <div class="tlist" style="margin-top:18px">${tracks.length ? tracks.map((t, i) => trow(t, key, i)).join('') : emptyState(I.music, 'این پلی‌لیست خالی است', 'از منوی ⋮ کنار هر آهنگ «افزودن به پلی‌لیست» را بزن')}</div>`;
};
SUBS.liked = async () => {
  return `<div class="hero"><button class="ibtn back" data-act="back">${I.back}</button><div class="hcv liked-cv">${I.heart}</div><h1>آهنگ‌های لایک‌شده</h1><p>${fa(S.likedTracks.length)} آهنگ</p>
  <div class="acts">${S.likedTracks.length ? `<button class="btn primary" data-act="playAll" data-list="liked">${I.play} پخش</button><button class="btn ghost" data-act="shuffleAll" data-list="liked">${I.shuffle}</button>` : ''}</div></div>
  <div class="tlist" style="margin-top:18px">${S.likedTracks.map((t, i) => trow(t, 'liked', i)).join('') || emptyState(I.heart, 'خالی است', '')}</div>`;
};

/* ----------------------- USER PROFILE ----------------------- */
SUBS.user = async id => {
  if (id === me.id) return VIEWS.profile();
  const [p, trs, [c1, c2]] = await Promise.all([getProfile(id), tracksOf(id), followCounts(id)]);
  const tr = { data: trs }, f1 = { count: c1 }, f2 = { count: c2 };
  if (!p) throw new Error('کاربر پیدا نشد');
  const key = reg('user:' + id, tr.data || []);
  return `<div class="hero"><button class="ibtn back" data-act="back">${I.back}</button>
    <div style="position:relative">${avatar(p, 140)}<span class="odot ${S.online.has(id) ? 'on' : ''}" data-online-for="${id}" style="width:24px;height:24px;bottom:8px;left:8px;border-width:4px"></span></div>
    <h1>${esc(pName(p))}</h1><p class="ltr">@${esc(p.username)}</p>${p.bio ? `<p style="margin-top:8px;color:var(--text)">${esc(p.bio)}</p>` : ''}
    <div class="stats"><div><b>${fa((tr.data || []).length)}</b>آهنگ</div><div><b>${fa(f1.count || 0)}</b>دنبال‌کننده</div><div><b>${fa(f2.count || 0)}</b>دنبال‌شده</div></div>
    <div class="acts">${followBtn(id)}<button class="btn ghost sm" data-act="openChat" data-id="${id}">${I.chat} پیام</button></div></div>
    <div class="sec"><h2>آهنگ‌ها</h2></div>
    <div class="tlist">${(tr.data || []).map((t, i) => trow(t, key, i)).join('') || emptyState(I.music, 'هنوز آهنگی آپلود نکرده', '')}</div>`;
};

/* ----------------------- MY PROFILE ----------------------- */
VIEWS.profile = async () => {
  const [c1, c2] = await followCounts(me.id);
  const f1 = { count: c1 }, f2 = { count: c2 };
  return `<div class="hero">
    <button style="position:relative" data-act="changeAvatar">${avatar(me, 140)}<span class="avatar" style="position:absolute;bottom:4px;left:4px;width:40px;height:40px;background:var(--grad);color:#1a0640">${I.camera}</span></button>
    <h1>${esc(pName(me))}</h1><p class="ltr">@${esc(me.username)}</p>${me.bio ? `<p style="margin-top:8px;color:var(--text)">${esc(me.bio)}</p>` : ''}
    <div class="stats"><div><b>${fa(S.tracks.length)}</b>آهنگ</div><div data-act="followers" style="cursor:pointer"><b>${fa(f1.count || 0)}</b>دنبال‌کننده</div><div data-act="followingList" style="cursor:pointer"><b>${fa(f2.count || 0)}</b>دنبال‌شده</div></div>
  </div>
  <div class="menu glass liquid" style="border-radius:22px;padding:6px;margin-top:22px">
    <button data-act="editProfile">${I.edit} ویرایش پروفایل</button>
    <button data-act="changePass">${I.lock} تغییر رمز عبور (با کد ایمیل)</button>
    <button data-act="upload">${I.upload} آپلود آهنگ</button>
    <button data-act="installApp">${I.down} نصب اپ روی گوشی</button>
    <button class="red" data-act="logout">${I.logout} خروج از حساب</button>
  </div>
  <p style="text-align:center;color:var(--dim);font-size:12px;margin-top:20px" class="ltr">${esc(me.email)} · Spotylive v1.0</p>`;
};

/* ----------------------- CHATS ----------------------- */
VIEWS.chats = async () => {
  const chats = docs(await db.collection('chats').where('members', 'array-contains', me.id).get())
    .filter(c => c.last).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  const conv = new Map();
  chats.forEach(c => { const o = c.members.find(x => x !== me.id); if (o) { conv.set(o, c.last); const n = (c.unread || {})[me.id] || 0; n ? S.unread.set(o, n) : S.unread.delete(o); } });
  updateBadges();
  await getProfiles([...conv.keys()]);
  const rows = [...conv.entries()].map(([o, m]) => {
    const p = S.profiles.get(o); if (!p) return '';
    const n = S.unread.get(o) || 0;
    const prev = m.kind === 'track' ? '🎵 ' + (m.body || 'آهنگ') : m.kind === 'live' ? '🎧 ' + m.body : m.body;
    return `<div class="urow" data-act="openChat" data-id="${o}">${avOnline(p, 54)}<div class="umeta"><b>${esc(pName(p))}</b><small>${m.sender === me.id ? 'تو: ' : ''}${esc(prev)}</small></div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><span class="time">${timeAgo(m.created_at)}</span>${n ? `<span class="ubadge">${fa(n)}</span>` : ''}</div></div>`;
  }).join('');
  const notYet = S.followingProfiles.filter(p => !conv.has(p.id));
  return `<div class="topbar"><h1>گفتگوها</h1><button class="ibtn" data-act="newChat">${I.plus}</button></div>
    ${S.followingProfiles.length ? `<div class="hscroll" style="margin-bottom:6px">${[...S.followingProfiles].sort((a, b) => S.online.has(b.id) - S.online.has(a.id)).map(p => `<div class="card round" style="flex-basis:74px" data-act="openChat" data-id="${p.id}"><div style="width:64px;margin:auto">${avOnline(p, 64)}</div><small style="margin-top:6px">${esc(pName(p).split(' ')[0])}</small></div>`).join('')}</div>` : ''}
    ${rows || (notYet.length ? '' : emptyState(I.chat, 'هنوز گفتگویی نداری', 'اول دوستانت را دنبال کن، بعد با آن‌ها چت کن و هم‌زمان آهنگ گوش بدهید', '<br><button class="btn primary sm" data-act="tab" data-tab="search">پیدا کردن دوستان</button>'))}
    ${notYet.length && !rows ? `<div class="sec"><h2>شروع گفتگو</h2></div>${notYet.map(p => userRow(p)).join('')}` : ''}`;
};

/* ---- chat room (full-screen overlay) ---- */
let chatEl = null, typingTimer = null, lastTypingSent = 0;
async function openChat(id) {
  const p = await getProfile(id); if (!p) return;
  if (chatEl) { chatEl.remove(); chatEl = null; layers.pop(); }
  S.chatWith = id;
  chatEl = document.createElement('div'); chatEl.className = 'chat';
  chatEl.innerHTML = `
    <div class="chat-head glass">
      <button class="ibtn" data-act="closeChat">${I.back}</button>
      ${avOnline(p, 42)}
      <div class="umeta" data-act="user" data-id="${id}"><b>${esc(pName(p))}</b><small id="chatStatus"></small></div>
      <button class="livebtn" id="chatLive" data-act="liveFromChat" data-id="${id}" aria-label="پخش هم‌زمان">${I.live}</button>
    </div>
    <div class="chat-body" id="chatBody"><div class="skel" style="height:40px;width:60%;align-self:flex-end"></div><div class="skel" style="height:40px;width:50%"></div></div>
    <form class="composer glass" id="chatForm">
      <button type="button" class="ibtn" data-act="shareTrackPick" data-id="${id}" aria-label="ارسال آهنگ">${I.music}</button>
      <textarea id="chatInput" rows="1" placeholder="پیام…" maxlength="4000"></textarea>
      <button class="sendbtn" type="submit" aria-label="ارسال">${I.send}</button>
    </form>`;
  document.body.appendChild(chatEl);
  pushLayer(() => { chatEl && chatEl.remove(); chatEl = null; S.chatWith = null; if (chatUnsub) { chatUnsub(); chatUnsub = null; } if (S.tab === 'chats' && !S.sub) go('chats'); });
  updateChatStatus();
  const input = $('#chatInput'), form = $('#chatForm');
  input.addEventListener('input', () => {
    input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px';
    if (Date.now() - lastTypingSent > 2500) { lastTypingSent = Date.now(); rtSend('typing', { to: id }); }
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !matchMedia('(pointer:coarse)').matches) { e.preventDefault(); form.requestSubmit(); } });
  form.addEventListener('submit', e => { e.preventDefault(); const v = input.value.trim(); if (!v) return; input.value = ''; input.style.height = 'auto'; sendMessage(id, v); input.focus(); });

  if (chatUnsub) { chatUnsub(); chatUnsub = null; }
  let first = true;
  chatUnsub = db.collection('chats').doc(pairId(me.id, id)).collection('messages').orderBy('created_at', 'desc').limit(150)
    .onSnapshot(async snap => {
      const body = $('#chatBody'); if (!body || S.chatWith !== id) return;
      if (first) {
        first = false;
        const msgs = docs(snap).reverse();
        await hydrateMsgTracks(msgs);
        body.innerHTML = msgs.length ? '' : `<div class="empty" style="margin:auto"><div class="eico">${I.live}</div><b>سلام کن 👋</b>وقتی هر دو آنلاین باشید، با دکمه 🎧 بالا می‌توانید هم‌زمان یک آهنگ را گوش بدهید</div>`;
        let lastDay = '';
        msgs.forEach(m => { const d = new Date(m.created_at).toLocaleDateString('fa-IR'); if (d !== lastDay) { lastDay = d; body.insertAdjacentHTML('beforeend', `<div class="day">${d}</div>`); } body.insertAdjacentHTML('beforeend', msgHtml(m)); });
        body.scrollTop = body.scrollHeight;
        markRead(id, true);
        return;
      }
      const added = snap.docChanges().filter(c => c.type === 'added').map(c => ({ id: c.doc.id, ...c.doc.data() })).filter(m => m.sender !== me.id).reverse();
      if (!added.length) return;
      await hydrateMsgTracks(added);
      added.forEach(appendMsg);
      if (document.visibilityState === 'visible') markRead(id, true);
    }, e => toast(faErr(e), 'err'));
}
function closeChat() { popLayer(); }
async function hydrateMsgTracks(msgs) {
  const ids = [...new Set(msgs.filter(m => m.track_id && !S.tmap.has(m.track_id)).map(m => m.track_id))];
  if (ids.length) await getTracks(ids);
}
function msgHtml(m) {
  const mine = m.sender === me.id, t = m.track_id && S.tmap.get(m.track_id);
  if (m.kind === 'track' && t) return `<div class="msg trk ${mine ? 'me' : 'them'}"><div class="tcard" data-act="playOne" data-id="${t.id}"><div class="tcv">${cover(t)}</div><div class="tm"><b>${esc(t.title)}</b><small>${esc(t.artist || 'ناشناس')}</small></div><span class="pb">${I.play}</span></div><span class="mt">${hhmm(m.created_at)}</span></div>`;
  if (m.kind === 'live') return `<div class="msg livemsg ${mine ? 'me' : 'them'}">🎧 ${esc(m.body)}<span class="mt">${hhmm(m.created_at)}</span></div>`;
  return `<div class="msg ${mine ? 'me' : 'them'}">${esc(m.body)}<span class="mt">${hhmm(m.created_at)}</span></div>`;
}
function appendMsg(m) {
  const body = $('#chatBody'); if (!body) return;
  const em = $('.empty', body); if (em) em.remove();
  $('.typing', body)?.remove();
  body.insertAdjacentHTML('beforeend', msgHtml(m));
  body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
}
async function sendMessage(to, body, kind = 'text', track_id = null) {
  const m = { sender: me.id, receiver: to, body: String(body).slice(0, 4000), kind, track_id: track_id || null, created_at: Date.now() };
  if (S.chatWith === to) appendMsg(m);
  const cref = db.collection('chats').doc(pairId(me.id, to));
  const b = db.batch();
  b.set(cref.collection('messages').doc(), m);
  b.set(cref, { members: [me.id, to].sort(), last: m, updated: m.created_at, unread: { [to]: FV().increment(1) } }, { merge: true });
  try { await b.commit(); } catch (e) { toast('پیام ارسال نشد: ' + faErr(e), 'err'); }
}
async function markRead(id, force) {
  if (!S.unread.get(id) && !force) return;
  S.unread.delete(id); updateBadges();
  db.collection('chats').doc(pairId(me.id, id)).set({ unread: { [me.id]: 0 } }, { merge: true }).catch(() => {});
}
function updateChatStatus() {
  const id = S.chatWith; if (!id) return;
  const on = S.online.has(id), st = $('#chatStatus'), lb = $('#chatLive');
  if (st && !st.dataset.typing) { st.textContent = L.active && L.active.peer === id && L.active.status === 'active' ? '🎧 در حال گوش دادن هم‌زمان' : on ? 'آنلاین' : 'آفلاین'; st.classList.toggle('on', on); }
  if (lb) { lb.classList.toggle('on', on); lb.classList.toggle('off', !on); }
}
function showTyping(from) {
  if (S.chatWith !== from) return;
  const st = $('#chatStatus'), body = $('#chatBody');
  if (st) { st.dataset.typing = '1'; st.textContent = 'در حال نوشتن…'; st.classList.add('on'); }
  if (body && !$('.typing', body)) { body.insertAdjacentHTML('beforeend', '<div class="typing"><i></i><i></i><i></i></div>'); body.scrollTop = body.scrollHeight; }
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => { if (st) delete st.dataset.typing; $('.typing', body)?.remove(); updateChatStatus(); }, 3500);
}

/* =====================================================================
   REALTIME — presence (آنلاین بودن) · broadcast (لایو/تایپ) · inbox
   ===================================================================== */
let rtOff = [];
function startRealtime() {
  stopRealtime();
  // --- آنلاین بودن (Realtime Database presence)
  const myRef = rdb.ref('presence/' + me.id);
  const conRef = rdb.ref('.info/connected');
  const onCon = conRef.on('value', s => { if (s.val() === true) { myRef.onDisconnect().remove().then(() => myRef.set(firebase.database.ServerValue.TIMESTAMP)); } });
  rtOff.push(() => conRef.off('value', onCon));
  const presRef = rdb.ref('presence');
  const onPres = presRef.on('value', s => {
    S.online = new Set(Object.keys(s.val() || {})); S.online.delete(me.id);
    $$('[data-online-for]').forEach(el => el.classList.toggle('on', S.online.has(el.dataset.onlineFor)));
    updateChatStatus(); checkLivePeer();
  });
  rtOff.push(() => presRef.off('value', onPres));
  // --- سیگنال‌های لایو و «در حال نوشتن»
  const sigRef = rdb.ref('signals/' + me.id);
  sigRef.remove().catch(() => {});
  const onSig = sigRef.on('child_added', snap => {
    const v = snap.val(); snap.ref.remove().catch(() => {});
    if (!v || !v.payload || (v.t && serverNow() - v.t > 30000)) return;
    const pl = { ...v.payload, from: v.from };
    if (v.event === 'live') onLive(pl);
    else if (v.event === 'typing') showTyping(v.from);
  });
  rtOff.push(() => sigRef.off('child_added', onSig));
  // --- صندوق پیام‌ها
  const startedAt = Date.now();
  inboxCh = db.collection('chats').where('members', 'array-contains', me.id).onSnapshot(snap => {
    snap.docChanges().forEach(async ch => {
      if (ch.type === 'removed') return;
      const c = ch.doc.data(), m = c.last; if (!m || m.sender === me.id || m.created_at < startedAt) return;
      const from = m.sender;
      if (S.chatWith === from && document.visibilityState === 'visible') return;
      const n = (c.unread || {})[me.id] || 0; if (!n) return;
      if (S.unread.get(from) === n) return;
      S.unread.set(from, n); updateBadges();
      const p = await getProfile(from);
      if (m.kind !== 'live') toast(`${pName(p)}: ${m.kind === 'track' ? '🎵 یک آهنگ فرستاد' : String(m.body).slice(0, 60)}`, 'info', { label: 'باز کن', fn: () => openChat(from) });
      vib(25);
      if (S.tab === 'chats' && !S.chatWith && !S.sub) go('chats');
    });
  }, () => {});
  rtOff.push(() => { inboxCh && inboxCh(); inboxCh = null; });
  rt = true;
}
function stopRealtime() {
  rtOff.forEach(f => { try { f(); } catch {} }); rtOff = [];
  if (chatUnsub) { chatUnsub(); chatUnsub = null; }
  if (me && rdb) rdb.ref('presence/' + me.id).remove().catch(() => {});
  rt = null;
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && rt && me) { if (S.chatWith) markRead(S.chatWith, true); }
});
function rtSend(event, payload) {
  if (!rt || !payload || !payload.to) return;
  const clean = JSON.parse(JSON.stringify({ ...payload, from: me.id }));
  rdb.ref('signals/' + payload.to).push({ from: me.id, event, payload: clean, t: firebase.database.ServerValue.TIMESTAMP }).catch(() => {});
}

/* =====================================================================
   PLAYER
   ===================================================================== */
const audio = new Audio();
audio.preload = 'auto';
audio.crossOrigin = 'anonymous';
const P = { queue: [], i: -1, cur: null, shuffle: false, repeat: 'off', order: [] };
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function playList(list, i, { fromRemote = false } = {}) {
  if (!list || !list.length) return;
  if (L.active && L.active.role === 'guest' && !fromRemote) {
    // مهمان لایو: آهنگ را برای میزبان پیشنهاد می‌دهد و هر دو پخش می‌شود
    rtSend('live', { type: 'ctrl', to: L.active.peer, sid: L.active.sid, action: 'play', track: pack(list[i]) });
    toast('آهنگ برای پخش هم‌زمان فرستاده شد 🎧', 'live');
    return;
  }
  P.queue = list.slice(); P.i = i;
  loadTrack(P.queue[P.i], true);
}
function loadTrack(t, autoplay = true, startAt = 0) {
  if (!t) return;
  P.cur = t;
  const url = trackUrl(t);
  if (audio.src !== url) { audio.src = url; audio.load(); }
  const apply = () => { try { if (startAt) audio.currentTime = startAt; } catch {} };
  if (audio.readyState >= 1) apply(); else audio.addEventListener('loadedmetadata', apply, { once: true });
  if (autoplay) safePlay();
  renderMini(); updateNP(); setMediaSession(t); extractColor(t); markPlaying();
  if (L.active && L.active.role === 'host' && L.active.status === 'active') setTimeout(sendState, 120);
}
function safePlay() {
  ensureAudioGraph();
  const p = audio.play();
  if (p && p.catch) p.catch(err => {
    if (err && err.name === 'NotAllowedError') toast('برای شروع پخش بزن', 'live', { label: '▶ پخش', fn: () => audio.play() });
  });
}
function togglePlay() {
  if (!P.cur) return;
  if (isGuest()) return guestCtrl(audio.paused ? 'play-resume' : 'pause');
  audio.paused ? safePlay() : audio.pause();
}
function next(auto = false) {
  if (isGuest()) return guestCtrl('next');
  if (!P.queue.length) return;
  if (P.repeat === 'one' && auto) { audio.currentTime = 0; return safePlay(); }
  let n;
  if (P.shuffle && P.queue.length > 1) { do n = Math.floor(Math.random() * P.queue.length); while (n === P.i); }
  else n = P.i + 1;
  if (n >= P.queue.length) { if (P.repeat === 'all' || !auto) n = 0; else { audio.pause(); audio.currentTime = 0; return; } }
  P.i = n; loadTrack(P.queue[n], true);
}
function prev() {
  if (isGuest()) return guestCtrl('prev');
  if (audio.currentTime > 3 || P.queue.length < 2) { audio.currentTime = 0; return; }
  P.i = (P.i - 1 + P.queue.length) % P.queue.length; loadTrack(P.queue[P.i], true);
}
function seekTo(sec) {
  if (isGuest()) return guestCtrl('seek', sec);
  audio.currentTime = sec;
}
audio.addEventListener('ended', () => { if (!isGuest()) next(true); });
audio.addEventListener('play', () => { onPlayState(); if (isHost()) sendState(); });
audio.addEventListener('pause', () => { onPlayState(); if (isHost()) sendState(); });
audio.addEventListener('seeked', () => { if (isHost()) sendState(); });
audio.addEventListener('timeupdate', onTime);
audio.addEventListener('loadedmetadata', () => { onTime(); if (L.pending) { const s = L.pending; L.pending = null; applyState(s); } });
let corsRetried = false;
audio.addEventListener('error', () => {
  if (!audio.src) return;
  // اگر سرور فایل اجازهٔ CORS ندهد، بدون آن دوباره امتحان کن (ویژوالایزر حالت ساده می‌شود)
  if (!corsRetried && audio.crossOrigin && !actx) { corsRetried = true; const t = audio.currentTime, src = audio.src; audio.removeAttribute('crossorigin'); audio.src = src; audio.load(); try { audio.currentTime = t; } catch {} safePlay(); return; }
  toast('پخش این آهنگ ممکن نشد', 'err');
});

function onPlayState() {
  const playing = !audio.paused;
  $$('.mplay').forEach(b => b.innerHTML = playing ? I.pause : I.play);
  const pb = $('#bPlay'); if (pb) pb.innerHTML = playing ? I.pause : I.play;
  $('#np')?.classList.toggle('playing', playing);
  document.body.classList.toggle('paused', !playing);
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  if (playing) startViz();
}
let seeking = false;
function onTime() {
  const d = audio.duration || P.cur?.duration || 0, c = audio.currentTime || 0, pct = d ? c / d * 100 : 0;
  const mb = $('#mini .mbar i'); if (mb) mb.style.width = pct + '%';
  if (!seeking) { const s = $('#seek'); if (s) { s.value = d ? c / d * 1000 : 0; s.style.setProperty('--p', pct + '%'); } }
  const tc = $('#tCur'); if (tc) tc.textContent = fmt(c);
  const td = $('#tDur'); if (td) td.textContent = fmt(d);
  if ('mediaSession' in navigator && d && navigator.mediaSession.setPositionState) { try { navigator.mediaSession.setPositionState({ duration: d, position: Math.min(c, d), playbackRate: 1 }); } catch {} }
}
function markPlaying() {
  const id = P.cur?.id;
  $$('.trow,.card').forEach(r => r.classList.toggle('playing', !!id && r.dataset.id === id));
}

function renderMini() {
  const m = $('#mini'); const t = P.cur;
  if (!t || !me) { m.hidden = true; return; }
  m.hidden = false;
  const live = L.active && L.active.status === 'active';
  m.innerHTML = `<div class="mcv">${cover(t)}</div>
    <div class="mmeta"><b>${live ? '<span class="minilive"><i></i>LIVE</span>' : ''}${esc(t.title)}</b><small>${live ? 'هم‌زمان با ' + esc(pName(S.profiles.get(L.active.peer))) : esc(t.artist || 'ناشناس')}</small></div>
    <button class="ibtn like ${S.liked.has(t.id) ? 'on' : ''}" data-act="like" data-id="${t.id}">${I.heart}</button>
    <button class="mplay" data-act="toggle">${audio.paused ? I.play : I.pause}</button>
    <div class="mbar"><i></i></div>`;
  m.onclick = e => { if (!e.target.closest('[data-act]')) openNP(); };
  onTime();
}

function setMediaSession(t) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist || 'Spotylive', album: 'Spotylive',
    artwork: [{ src: t.cover_url || new URL('icon-512.png', location.href).href, sizes: '512x512', type: 'image/png' }] });
  const ms = navigator.mediaSession;
  const h = { play: () => togglePlay(), pause: () => togglePlay(), nexttrack: () => next(), previoustrack: () => prev(), seekto: d => seekTo(d.seekTime) };
  Object.entries(h).forEach(([k, f]) => { try { ms.setActionHandler(k, f); } catch {} });
}

/* ---------- رنگ پویا از کاور ---------- */
function extractColor(t) {
  const set = rgb => { document.documentElement.style.setProperty('--dyn', rgb); };
  if (!t.cover_url) { const h = hue(t.title); set(hslToRgb(h / 360, .75, .55).join(',')); return; }
  const img = new Image(); img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d');
      x.drawImage(img, 0, 0, 24, 24); const d = x.getImageData(0, 0, 24, 24).data;
      let best = null, bs = -1;
      for (let i = 0; i < d.length; i += 4) { const [r, g, b] = [d[i], d[i + 1], d[i + 2]]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const s = (mx - mn) * (mx > 40 ? 1 : .2); if (s > bs) { bs = s; best = [r, g, b]; } }
      if (best) set(best.join(','));
    } catch { }
  };
  img.src = t.cover_url;
}
function hslToRgb(h, s, l) { let r, g, b; const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; const f = t => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }; r = f(h + 1 / 3); g = f(h); b = f(h - 1 / 3); return [r, g, b].map(v => Math.round(v * 255)); }

/* ---------- Now Playing ---------- */
function buildNP() {
  $('#np').innerHTML = `
    <div class="np-bg"><img id="npBg" alt=""><div class="tint"></div></div>
    <header class="np-top">
      <button class="ibtn" data-act="npClose" style="color:#fff">${I.down}</button>
      <div class="ctx"><small>در حال پخش</small><b id="npCtx">Spotylive</b><div id="npLive" hidden><span class="livepill"><i></i>LIVE</span></div></div>
      <button class="ibtn" data-act="npMore" style="color:#fff">${I.more}</button>
    </header>
    <div class="np-art"><canvas id="viz" width="620" height="620"></canvas><div class="np-cover" id="npCover"></div></div>
    <div class="np-main">
      <div id="npLiveBar"></div>
      <div class="np-info"><div><h2 id="npT"></h2><p id="npA"></p></div><button class="ibtn like" id="npLike" data-act="likeCur" style="color:#fff">${I.heart}</button></div>
      <div class="seek ltr"><input type="range" class="range" id="seek" min="0" max="1000" value="0" step="1"><div class="times"><span id="tCur">0:00</span><span id="tDur">0:00</span></div></div>
      <div class="ctrls ltr">
        <button class="ibtn sm" id="bShuf" data-act="shuffle">${I.shuffle}</button>
        <button class="ibtn" data-act="prev">${I.prev}</button>
        <button class="playbig" id="bPlay" data-act="toggle">${I.play}</button>
        <button class="ibtn" data-act="next">${I.next}</button>
        <button class="ibtn sm" id="bRep" data-act="repeat">${I.repeat}</button>
      </div>
      <div class="np-bottom">
        <button class="livecta glass" data-act="liveFromNP">${I.live}<span>گوش دادن با دوست</span></button>
        <div class="vol ltr">${I.vol}<input type="range" class="range" id="vol" min="0" max="100" value="100"></div>
        <button class="ibtn" data-act="queue" style="color:#fff">${I.queue}</button>
      </div>
    </div>`;
  const seek = $('#seek');
  seek.addEventListener('input', () => { seeking = true; const d = audio.duration || 0; seek.style.setProperty('--p', seek.value / 10 + '%'); $('#tCur').textContent = fmt(seek.value / 1000 * d); });
  seek.addEventListener('change', () => { seeking = false; const d = audio.duration || 0; if (d) seekTo(seek.value / 1000 * d); });
  const vol = $('#vol'); vol.style.setProperty('--p', '100%');
  vol.addEventListener('input', () => { audio.volume = vol.value / 100; vol.style.setProperty('--p', vol.value + '%'); });
  // کشیدن به پایین برای بستن
  const np = $('#np'); let y0 = null, dy = 0;
  np.addEventListener('touchstart', e => { if (e.target.closest('input,.np-bottom,.ctrls')) return; y0 = e.touches[0].clientY; dy = 0; }, { passive: true });
  np.addEventListener('touchmove', e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); np.classList.add('drag'); np.style.transform = `translateY(${dy}px)`; }, { passive: true });
  np.addEventListener('touchend', () => { if (y0 == null) return; np.classList.remove('drag'); np.style.transform = ''; if (dy > 130) closeNP(); y0 = null; });
}
function updateNP() {
  const t = P.cur; if (!t) return;
  $('#npCover').innerHTML = cover(t);
  const bg = $('#npBg'); if (t.cover_url) { bg.src = t.cover_url; bg.style.opacity = .9; } else bg.style.opacity = 0;
  $('#npT').textContent = t.title; $('#npA').textContent = t.artist || 'ناشناس';
  $('#npLike').classList.toggle('on', S.liked.has(t.id));
  $('#bShuf').classList.toggle('on', P.shuffle);
  $('#bRep').classList.toggle('on', P.repeat !== 'off'); $('#bRep').innerHTML = P.repeat === 'one' ? I.repeat1 : I.repeat;
  renderLiveUI();
}
function openNP() {
  if (!P.cur) return;
  const np = $('#np'); if (np.classList.contains('open')) return;
  updateNP(); np.classList.add('open'); np.setAttribute('aria-hidden', 'false');
  pushLayer(() => { np.classList.remove('open'); np.setAttribute('aria-hidden', 'true'); });
  startViz();
}
function closeNP() { if ($('#np').classList.contains('open')) popLayer(); }

/* ---------- Visualizer ---------- */
let actx = null, analyser = null, freq = null, vizOn = false;
function ensureAudioGraph() {
  if (actx || isIOS || !audio.crossOrigin) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    actx = new AC();
    const src = actx.createMediaElementSource(audio);
    analyser = actx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = .82;
    src.connect(analyser); analyser.connect(actx.destination);
    freq = new Uint8Array(analyser.frequencyBinCount);
  } catch { actx = null; analyser = null; }
  if (actx && actx.state === 'suspended') actx.resume();
}
document.addEventListener('pointerdown', () => { if (actx && actx.state === 'suspended') actx.resume(); }, { passive: true });
function startViz() { if (vizOn) return; vizOn = true; requestAnimationFrame(drawViz); }
function drawViz(ts) {
  const np = $('#np'), c = $('#viz');
  if (!np || !np.classList.contains('open') || !c) { vizOn = false; return; }
  const x = c.getContext('2d'), W = c.width, H = c.height, cx = W / 2, cy = H / 2;
  x.clearRect(0, 0, W, H);
  const N = 72, playing = !audio.paused;
  let vals = new Array(N).fill(0);
  if (analyser && playing) { analyser.getByteFrequencyData(freq); for (let i = 0; i < N; i++) { const k = Math.floor((i < N / 2 ? i : N - i) / (N / 2) * 70); vals[i] = freq[k] / 255; } }
  else if (playing) { for (let i = 0; i < N; i++) vals[i] = (Math.sin(ts / 260 + i * .55) * .5 + .5) * (Math.sin(ts / 610 + i * .21) * .35 + .45); }
  const bass = vals.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
  const cov = $('#npCover'); if (cov && playing) cov.style.transform = `scale(${1 + bass * .035})`; else if (cov) cov.style.transform = '';
  const dyn = getComputedStyle(document.documentElement).getPropertyValue('--dyn').trim() || '168,85,247';
  const R = Math.min(W, H) * .36;
  const g = x.createRadialGradient(cx, cy, R * .6, cx, cy, R * 1.5);
  g.addColorStop(0, `rgba(${dyn},${.25 + bass * .35})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R * 1.5, 0, Math.PI * 2); x.fill();
  x.lineCap = 'round';
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2 - Math.PI / 2, len = 8 + vals[i] * R * .55;
    const x1 = cx + Math.cos(a) * R, y1 = cy + Math.sin(a) * R, x2 = cx + Math.cos(a) * (R + len), y2 = cy + Math.sin(a) * (R + len);
    x.strokeStyle = `rgba(${dyn},${.35 + vals[i] * .65})`; x.lineWidth = 5;
    x.shadowColor = `rgba(${dyn},.9)`; x.shadowBlur = 14;
    x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
  }
  x.shadowBlur = 0;
  requestAnimationFrame(drawViz);
}

/* =====================================================================
   LIVE — گوش دادن هم‌زمان (فقط وقتی هر دو آنلاین باشند)
   پروتکل: invite → accept → ping/pong (هم‌گام‌سازی ساعت) → state (هر ۲ ثانیه) → end
   ===================================================================== */
const L = { active: null, pending: null, hb: null, ping: null, peerGone: null, inviteSheet: null };
const isHost = () => L.active && L.active.role === 'host' && L.active.status === 'active';
const isGuest = () => L.active && L.active.role === 'guest' && L.active.status === 'active';
const pack = t => t && ({ id: t.id, title: t.title, artist: t.artist, audio_url: t.audio_url, cover_url: t.cover_url, duration: t.duration, owner: t.owner });

async function liveInvite(peerId, track) {
  if (!track) return;
  if (L.active) {
    if (L.active.status === 'active' && L.active.peer === peerId && L.active.role === 'host') { P.queue = [track]; P.i = 0; loadTrack(track, true); return toast('آهنگ برای هر دو عوض شد 🎧', 'live'); }
    return toast('الان در یک جلسه لایو هستی', 'warn');
  }
  if (!S.online.has(peerId)) return toast('دوستت الان آنلاین نیست — پخش هم‌زمان فقط وقتی هر دو آنلاین باشید ممکن است', 'warn');
  const sid = uid();
  await getProfile(peerId);
  L.active = { sid, role: 'host', peer: peerId, status: 'pending', track };
  rtSend('live', { type: 'invite', to: peerId, sid, track: pack(track), name: pName(me), avatar: me.avatar_url });
  sendMessage(peerId, `دعوت به گوش دادن هم‌زمان: ${track.title}`, 'live', track.id);
  toast(`دعوت برای ${pName(S.profiles.get(peerId))} فرستاده شد… منتظر قبول کردن`, 'live', { label: 'لغو', fn: () => cancelInvite() });
  L.active.timer = setTimeout(() => { if (L.active && L.active.sid === sid && L.active.status === 'pending') { cancelInvite(); toast('دوستت جواب نداد', 'warn'); } }, 45000);
}
function cancelInvite() {
  if (!L.active || L.active.status !== 'pending') return;
  rtSend('live', { type: 'cancel', to: L.active.peer, sid: L.active.sid });
  clearTimeout(L.active.timer); L.active = null;
}

async function onLive(p) {
  const A_ = L.active;
  switch (p.type) {
    case 'invite': {
      if (A_) return rtSend('live', { type: 'busy', to: p.from, sid: p.sid });
      if (!S.online.has(p.from)) return;
      const prof = await getProfile(p.from);
      vib([60, 40, 60]);
      showInvite(p, prof);
      break;
    }
    case 'cancel':
      if (L.inviteSheet && L.inviteSheet.sid === p.sid) { L.inviteSheet.close(); L.inviteSheet = null; toast('دعوت لغو شد', 'info'); }
      break;
    case 'busy': if (A_ && A_.sid === p.sid) { clearTimeout(A_.timer); L.active = null; toast('دوستت الان در یک لایو دیگر است', 'warn'); } break;
    case 'decline': if (A_ && A_.sid === p.sid) { clearTimeout(A_.timer); L.active = null; toast('دوستت دعوت را رد کرد', 'warn'); } break;
    case 'accept':
      if (A_ && A_.sid === p.sid && A_.role === 'host' && A_.status === 'pending') {
        clearTimeout(A_.timer); A_.status = 'active';
        P.queue = [A_.track]; P.i = 0; loadTrack(A_.track, true, 0);
        startHeartbeat(); liveUIChanged();
        toast(`🎧 لایو با ${pName(S.profiles.get(A_.peer))} شروع شد`, 'live'); vib(40);
      }
      break;
    case 'ping': if (A_ && A_.sid === p.sid) rtSend('live', { type: 'pong', to: p.from, sid: p.sid, t0: p.t0, th: Date.now() }); break;
    case 'pong':
      if (A_ && A_.sid === p.sid && A_.role === 'guest') {
        const t1 = Date.now(), rtt = t1 - p.t0;
        if (rtt < (A_.bestRtt || 1e9) * 1.3) { A_.offset = (p.t0 + t1) / 2 - p.th; A_.bestRtt = Math.min(rtt, A_.bestRtt || 1e9); }
      }
      break;
    case 'state': if (A_ && A_.sid === p.sid && A_.role === 'guest') applyState(p); break;
    case 'ctrl':
      if (A_ && A_.sid === p.sid && A_.role === 'host' && A_.status === 'active') {
        if (p.action === 'play' && p.track) { P.queue = [p.track]; P.i = 0; loadTrack(p.track, true); toast(`${pName(S.profiles.get(A_.peer))} آهنگ را عوض کرد 🎵`, 'live'); }
        else if (p.action === 'pause') audio.pause();
        else if (p.action === 'play-resume') safePlay();
        else if (p.action === 'next') next();
        else if (p.action === 'prev') prev();
        else if (p.action === 'seek') audio.currentTime = p.value;
        setTimeout(sendState, 80);
      }
      break;
    case 'end': if (A_ && A_.sid === p.sid) { endLive(false); toast('جلسه لایو تمام شد', 'info'); } break;
  }
}

function showInvite(p, prof) {
  const t = p.track;
  const sh = openSheet(`<div class="invite">
    <div class="ivc"><span class="ring"></span><span class="ring b"></span><div class="cvw">${cover(t)}</div></div>
    <h3>${esc(pName(prof))} می‌خواد با تو هم‌زمان گوش بده 🎧</h3>
    <p><b style="color:var(--text)">${esc(t.title)}</b> — ${esc(t.artist || 'ناشناس')}</p>
    <div class="row2"><button class="btn ghost" data-x="no">رد کردن</button><button class="btn primary" data-x="yes">${I.live} قبول و پخش</button></div></div>`, { center: true });
  sh.sid = p.sid; L.inviteSheet = sh;
  let answered = false;
  $('[data-x=no]', sh.el).onclick = () => { answered = true; rtSend('live', { type: 'decline', to: p.from, sid: p.sid }); L.inviteSheet = null; sh.close(); };
  $('[data-x=yes]', sh.el).onclick = () => {
    answered = true; L.inviteSheet = null;
    if (!S.online.has(p.from)) { sh.close(); return toast('دوستت آفلاین شد', 'warn'); }
    L.active = { sid: p.sid, role: 'guest', peer: p.from, status: 'active', offset: 0, bestRtt: 1e9 };
    rtSend('live', { type: 'accept', to: p.from, sid: p.sid });
    P.queue = [t]; P.i = 0;
    loadTrack(t, true, 0);         // داخل کلیک کاربر → اجازه پخش خودکار
    liveUIChanged();
    sh.close(() => openNP());
    toast(`🎧 به لایو ${pName(prof)} وصل شدی`, 'live');
  };
  setTimeout(() => { if (!answered && L.inviteSheet === sh) { L.inviteSheet = null; sh.close(); } }, 44000);
}

function startHeartbeat() { clearInterval(L.hb); L.hb = setInterval(sendState, 2000); sendState(); }
function sendState() {
  const A_ = L.active; if (!A_ || A_.role !== 'host' || A_.status !== 'active' || !P.cur) return;
  rtSend('live', { type: 'state', to: A_.peer, sid: A_.sid, track: pack(P.cur), pos: audio.currentTime || 0, playing: !audio.paused, hostNow: serverNow() });
}
function startPings() {
  clearInterval(L.ping);
  let n = 0;
  const ping = () => { if (!L.active || L.active.role !== 'guest') return clearInterval(L.ping); rtSend('live', { type: 'ping', to: L.active.peer, sid: L.active.sid, t0: Date.now() }); };
  ping();
  L.ping = setInterval(() => { n++; ping(); if (n === 6) { clearInterval(L.ping); L.ping = setInterval(ping, 15000); } }, 250);
}
function applyState(s) {
  const A_ = L.active; if (!A_) return;
  if (!P.cur || P.cur.id !== s.track.id) { P.queue = [s.track]; P.i = 0; loadTrack(s.track, s.playing, 0); }
  if (audio.readyState < 1) { L.pending = s; return; }
  const target = s.pos + (s.playing ? Math.min(5, Math.max(0, serverNow() - s.hostNow) / 1000) : 0);
  if (s.playing && audio.paused) safePlay();
  if (!s.playing && !audio.paused) audio.pause();
  const diff = audio.currentTime - target;
  if (!s.playing || Math.abs(diff) > 0.35) { try { audio.currentTime = Math.max(0, target); } catch {} audio.playbackRate = 1; }
  else if (Math.abs(diff) > 0.04) audio.playbackRate = Math.min(1.04, Math.max(0.96, 1 - diff * 0.4));
  else audio.playbackRate = 1;
}
function guestCtrl(action, value) {
  if (!L.active) return;
  rtSend('live', { type: 'ctrl', to: L.active.peer, sid: L.active.sid, action, value });
}
function checkLivePeer() {
  const A_ = L.active; if (!A_) return;
  if (S.online.has(A_.peer)) { clearTimeout(L.peerGone); L.peerGone = null; return; }
  if (A_.status === 'pending') { clearTimeout(A_.timer); L.active = null; return toast('دوستت آفلاین شد', 'warn'); }
  if (!L.peerGone) L.peerGone = setTimeout(() => { L.peerGone = null; if (L.active && !S.online.has(L.active.peer)) { endLive(false); toast('دوستت آفلاین شد؛ لایو تمام شد', 'warn'); } }, 8000);
}
function endLive(notify = true) {
  const A_ = L.active; if (!A_) return;
  if (notify) rtSend('live', { type: 'end', to: A_.peer, sid: A_.sid });
  clearInterval(L.hb); clearInterval(L.ping); clearTimeout(L.peerGone); clearTimeout(A_.timer);
  L.active = null; L.pending = null; audio.playbackRate = 1;
  liveUIChanged();
}
window.addEventListener('pagehide', () => { if (L.active) endLive(true); });
function liveUIChanged() { document.body.classList.toggle('is-live', !!(L.active && L.active.status === 'active')); renderMini(); renderLiveUI(); updateChatStatus(); }
function renderLiveUI() {
  const on = L.active && L.active.status === 'active';
  const pill = $('#npLive'), bar = $('#npLiveBar'), ctx = $('#npCtx');
  if (!pill) return;
  pill.hidden = !on; ctx.hidden = on;
  if (on) {
    const peer = S.profiles.get(L.active.peer);
    bar.innerHTML = `<div class="livebar glass"><div class="avs">${avatar(me, 34)}${avatar(peer, 34)}</div><div class="lt">هم‌زمان با <b>${esc(pName(peer))}</b><br><small style="color:var(--muted)">${L.active.role === 'host' ? 'تو میزبانی؛ هر تغییری برای هر دو اعمال می‌شود' : 'کنترل‌ها برای هر دو نفر کار می‌کند'}</small></div><button class="btn danger sm" data-act="leaveLive">خروج</button></div>`;
  } else bar.innerHTML = '';
}

/* ---------- انتخاب دوست / آهنگ برای لایو ---------- */
function pickFriend({ title, onlineOnly, onPick }) {
  const list = [...S.followingProfiles].sort((a, b) => S.online.has(b.id) - S.online.has(a.id));
  const sh = openSheet(`<h3>${title}</h3>${list.length ? list.map(p => {
    const on = S.online.has(p.id);
    return `<div class="urow" data-pick="${p.id}" style="${onlineOnly && !on ? 'opacity:.4' : ''}">${avOnline(p, 48)}<div class="umeta"><b>${esc(pName(p))}</b><small>${on ? '🟢 آنلاین' : 'آفلاین'}</small></div></div>`;
  }).join('') : emptyState(I.users, 'هنوز کسی را دنبال نکرده‌ای', 'از بخش جستجو دوستانت را پیدا کن')}`);
  $$('[data-pick]', sh.el).forEach(r => r.onclick = () => {
    const id = r.dataset.pick;
    if (onlineOnly && !S.online.has(id)) return toast('این دوست آفلاین است', 'warn');
    sh.close(() => onPick(id));
  });
}
function pickTrack({ title, onPick }) {
  const groups = [['mine', 'آهنگ‌های من', S.tracks], ['liked', 'لایک‌شده‌ها', S.likedTracks], ...S.playlists.map(pl => ['pl:' + pl.id, pl.name, null])];
  const sh = openSheet(`<h3>${title}</h3>
    <label class="searchbox glass" style="position:static">${I.search}<input id="pkq" placeholder="جستجو در آهنگ‌هایت…"></label>
    <div class="tabs" id="pkTabs">${groups.map(([k, l], i) => `<button class="pill ${i ? '' : 'on'}" data-g="${k}">${esc(l)}</button>`).join('')}</div>
    <div id="pkList" class="tlist"></div>`);
  let cur = groups[0][2] || [];
  const draw = () => {
    const q = ($('#pkq', sh.el).value || '').trim().toLowerCase();
    const arr = cur.filter(t => !q || (t.title + ' ' + (t.artist || '')).toLowerCase().includes(q));
    $('#pkList', sh.el).innerHTML = arr.length ? arr.map(t => `<div class="trow" data-pt="${t.id}"><div class="tcv">${cover(t)}</div><div class="tmeta"><b>${esc(t.title)}</b><small>${esc(t.artist || 'ناشناس')}</small></div><span class="ibtn" style="color:var(--p1)">${I.play}</span></div>`).join('') : emptyState(I.music, 'آهنگی نیست', '');
    $$('[data-pt]', sh.el).forEach(r => r.onclick = () => { const t = S.tmap.get(r.dataset.pt); sh.close(() => onPick(t)); });
  };
  $('#pkq', sh.el).addEventListener('input', draw);
  $$('#pkTabs .pill', sh.el).forEach(b => b.onclick = async () => {
    $$('#pkTabs .pill', sh.el).forEach(x => x.classList.toggle('on', x === b));
    const g = groups.find(x => x[0] === b.dataset.g);
    if (g[2]) cur = g[2];
    else { const pl = S.playlists.find(x => x.id === g[0].slice(3)); cur = pl ? (await hydratePlaylists([pl]))[0].playlist_tracks.map(x => x.tracks) : []; reg(g[0], cur); }
    draw();
  });
  draw();
}

/* =====================================================================
   LIKES / FOLLOW / PLAYLISTS / TRACK MENU
   ===================================================================== */
async function toggleLike(id, btn) {
  const t = S.tmap.get(id); if (!t) return;
  const on = !S.liked.has(id);
  on ? S.liked.add(id) : S.liked.delete(id);
  $$(`.like[data-id="${id}"]`).forEach(b => { b.classList.toggle('on', on); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
  if (P.cur && P.cur.id === id) $('#npLike')?.classList.toggle('on', on);
  vib(12);
  const lref = db.collection('profiles').doc(me.id).collection('likes').doc(id);
  if (on) { S.likedTracks.unshift(t); lref.set({ created_at: Date.now() }).catch(e => toast(faErr(e), 'err')); }
  else { S.likedTracks = S.likedTracks.filter(x => x.id !== id); lref.delete().catch(() => {}); }
  reg('liked', S.likedTracks);
}
async function toggleFollow(id, btn) {
  const on = !S.following.has(id);
  const fref = db.collection('follows').doc(me.id + '_' + id);
  try {
    if (on) { await fref.set({ follower: me.id, following: id, created_at: Date.now() }); S.following.add(id); toast('دنبالش کردی ✨', 'ok'); }
    else { await fref.delete(); S.following.delete(id); }
  } catch (e) { return toast(faErr(e), 'err'); }
  S.followingProfiles = await getProfiles([...S.following]);
  $$(`[data-act=follow][data-id="${id}"]`).forEach(b => b.outerHTML = followBtn(id));
}
async function newPlaylist(thenAddTrack) {
  const sh = openSheet(`<h3>پلی‌لیست جدید</h3><form class="form" id="plf"><label class="field"><span>اسم پلی‌لیست</span><input name="n" required maxlength="60" placeholder="مثلاً: شب‌های آرام"></label><button class="btn primary big">ساختن</button></form>`);
  setTimeout(() => $('input', sh.el).focus(), 350);
  $('#plf', sh.el).onsubmit = async e => {
    e.preventDefault(); const b = $('button', sh.el); setBusy(b, true);
    const data = { owner: me.id, name: e.target.n.value.trim().slice(0, 60), track_ids: [], created_at: Date.now() };
    try { const r = await db.collection('playlists').add(data); data.id = r.id; } catch (err) { setBusy(b, false); return toast(faErr(err), 'err'); }
    data.playlist_tracks = []; S.playlists.unshift(data);
    if (thenAddTrack) await addToPlaylist(data.id, thenAddTrack);
    sh.close(() => { toast('پلی‌لیست ساخته شد 🎶', 'ok'); if (S.tab === 'library' && !S.sub) go('library'); });
  };
}
async function addToPlaylist(plId, t) {
  const pl = S.playlists.find(p => p.id === plId);
  const dup = pl && (pl.track_ids || []).includes(t.id);
  if (!dup) {
    try { await db.collection('playlists').doc(plId).update({ track_ids: FV().arrayUnion(t.id) }); } catch (e) { return toast(faErr(e), 'err'); }
    if (pl) { (pl.track_ids = pl.track_ids || []).push(t.id); (pl.playlist_tracks = pl.playlist_tracks || []).push({ track_id: t.id, tracks: t }); }
  }
  toast(dup ? 'قبلاً در این پلی‌لیست بود' : `به «${pl ? pl.name : 'پلی‌لیست'}» اضافه شد`, 'ok');
}

function trackMenu(id, listKey) {
  const t = S.tmap.get(id); if (!t) return;
  const mine = t.owner === me.id;
  const inPl = listKey && listKey.startsWith('pl:') && S.curPlaylist && S.curPlaylist.owner === me.id ? listKey.slice(3) : null;
  const sh = openSheet(`<div class="mhead"><div class="tcv">${cover(t)}</div><div><b>${esc(t.title)}</b><small>${esc(t.artist || 'ناشناس')}</small></div></div>
  <div class="menu">
    <button data-m="live">${I.live} گوش دادن هم‌زمان با دوست</button>
    <button data-m="next">${I.next2} پخش بعدی</button>
    <button data-m="queue">${I.queue} افزودن به صف</button>
    <button data-m="pl">${I.listplus} افزودن به پلی‌لیست</button>
    <button data-m="send">${I.send} ارسال برای دوست</button>
    ${t.owner !== me.id ? `<button data-m="owner">${I.user} پروفایل آپلودکننده</button>` : ''}
    ${inPl ? `<button data-m="unpl">${I.close} حذف از این پلی‌لیست</button>` : ''}
    ${mine ? `<button data-m="edit">${I.edit} ویرایش اطلاعات</button><button class="red" data-m="del">${I.trash} حذف آهنگ</button>` : ''}
  </div>`);
  $$('[data-m]', sh.el).forEach(b => b.onclick = () => {
    const m = b.dataset.m;
    const after = {
      live: () => pickFriend({ title: 'با کی گوش بدی؟', onlineOnly: true, onPick: pid => liveInvite(pid, t) }),
      next: () => { if (!P.cur) return playList([t], 0); P.queue.splice(P.i + 1, 0, t); toast('بعد از این آهنگ پخش می‌شود', 'ok'); },
      queue: () => { if (!P.cur) return playList([t], 0); P.queue.push(t); toast('به صف اضافه شد', 'ok'); },
      pl: () => { const s2 = openSheet(`<h3>افزودن به پلی‌لیست</h3><div class="menu"><button data-p="new">${I.plus} پلی‌لیست جدید</button>${S.playlists.map(p => `<button data-p="${p.id}">${I.lib} ${esc(p.name)}</button>`).join('')}</div>`);
        $$('[data-p]', s2.el).forEach(x => x.onclick = () => s2.close(() => x.dataset.p === 'new' ? newPlaylist(t) : addToPlaylist(x.dataset.p, t))); },
      send: () => pickFriend({ title: 'ارسال برای…', onPick: pid => { sendMessage(pid, t.title, 'track', t.id); toast('آهنگ فرستاده شد 🎵', 'ok'); } }),
      owner: () => openSub('user', t.owner),
      unpl: async () => { await db.collection('playlists').doc(inPl).update({ track_ids: FV().arrayRemove(t.id) }); const pl = S.playlists.find(p => p.id === inPl); if (pl) pl.track_ids = (pl.track_ids || []).filter(x => x !== t.id); if (pl) pl.playlist_tracks = (pl.playlist_tracks || []).filter(x => x.track_id !== t.id); toast('حذف شد', 'ok'); refresh(); },
      edit: () => editTrack(t),
      del: () => confirmBox('این آهنگ حذف شود؟', 'آهنگ از Spotylive برای همیشه پاک می‌شود.', 'حذف', async () => {
        try { await db.collection('tracks').doc(t.id).delete(); } catch (e) { return toast(faErr(e), 'err'); }
        S.tracks = S.tracks.filter(x => x.id !== t.id); reg('mine', S.tracks);
        S.likedTracks = S.likedTracks.filter(x => x.id !== t.id); reg('liked', S.likedTracks);
        toast('آهنگ حذف شد', 'ok'); refresh();
      }),
    }[m];
    sh.close(after);
  });
}
function confirmBox(title, text, okLabel, fn) {
  const sh = openSheet(`<div style="text-align:center"><h3>${esc(title)}</h3><p style="color:var(--muted);margin:-6px 0 20px">${esc(text)}</p><div class="row2"><button class="btn ghost" data-c="0">انصراف</button><button class="btn danger" data-c="1">${esc(okLabel)}</button></div></div>`, { center: true });
  $('[data-c="0"]', sh.el).onclick = () => sh.close();
  $('[data-c="1"]', sh.el).onclick = () => sh.close(fn);
}
function editTrack(t) {
  let newCover = null;
  const sh = openSheet(`<h3>ویرایش آهنگ</h3><div class="upitem"><div class="tcv" id="etc">${cover(t)}<span class="camo">${I.camera}</span></div>
    <div class="uf"><input id="et1" value="${esc(t.title)}" placeholder="نام آهنگ"><input id="et2" value="${esc(t.artist || '')}" placeholder="خواننده"></div></div>
    <button class="btn primary big" id="ets">ذخیره</button>`);
  $('#etc', sh.el).onclick = () => pickImage(async f => { newCover = await resizeImage(f, 640); $('#etc', sh.el).innerHTML = `<img class="cv" src="${URL.createObjectURL(newCover)}"><span class="camo">${I.camera}</span>`; });
  $('#ets', sh.el).onclick = async () => {
    const b = $('#ets', sh.el); setBusy(b, true);
    try {
      const upd = { title: $('#et1', sh.el).value.trim() || t.title, artist: $('#et2', sh.el).value.trim() };
      if (newCover) upd.cover_url = await uploadImage(newCover, 'covers');
      upd.title_lc = upd.title.toLowerCase(); upd.artist_lc = upd.artist.toLowerCase();
      await db.collection('tracks').doc(t.id).update(upd);
      Object.assign(t, upd); sh.close(() => { toast('ذخیره شد', 'ok'); refresh(); if (P.cur && P.cur.id === t.id) { renderMini(); updateNP(); } });
    } catch (e) { setBusy(b, false); toast(faErr(e), 'err'); }
  };
}

/* =====================================================================
   UPLOAD
   ===================================================================== */
// آپلود به Cloudinary (unsigned) — آهنگ‌ها با resource type «video»
function cloudUpload(kind, file, onProg) {
  return new Promise((res, rej) => {
    const cn = CFG.CLOUDINARY_CLOUD_NAME, pr = CFG.CLOUDINARY_UPLOAD_PRESET;
    if (!cn || !pr || /YOUR|PASTE/i.test(cn + pr)) return rej(new Error('تنظیمات Cloudinary در config.js وارد نشده'));
    const fd = new FormData();
    fd.append('file', file); fd.append('upload_preset', pr); fd.append('folder', `spotylive/${me.id}/${kind}`);
    const x = new XMLHttpRequest();
    x.open('POST', `https://api.cloudinary.com/v1_1/${encodeURIComponent(cn)}/${kind === 'music' ? 'video' : 'image'}/upload`);
    x.upload.onprogress = e => e.lengthComputable && onProg && onProg(e.loaded / e.total);
    x.onload = () => { let j = {}; try { j = JSON.parse(x.responseText); } catch {} x.status < 300 && j.secure_url ? res(j) : rej(new Error((j.error && j.error.message) || 'upload failed')); };
    x.onerror = () => rej(new Error('network'));
    x.send(fd);
  });
}
async function uploadImage(blob, folder) {
  const j = await cloudUpload(folder, blob);
  return j.secure_url;
}
function resizeImage(file, max = 640) {
  return new Promise((res, rej) => {
    const img = new Image(); img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => b ? res(b) : rej(new Error('image')), 'image/jpeg', .88);
    }; img.onerror = rej; img.src = URL.createObjectURL(file);
  });
}
function pickImage(cb) { const i = $('#fileImg'); i.value = ''; i.onchange = () => i.files[0] && cb(i.files[0]); i.click(); }
function readTags(file) {
  return new Promise(res => {
    if (!window.jsmediatags) return res({});
    try { window.jsmediatags.read(file, { onSuccess: r => res(r.tags || {}), onError: () => res({}) }); } catch { res({}); }
  });
}
function readDuration(file) {
  return new Promise(res => { const a = new Audio(); a.preload = 'metadata'; a.onloadedmetadata = () => { res(a.duration || 0); URL.revokeObjectURL(a.src); }; a.onerror = () => res(0); a.src = URL.createObjectURL(file); setTimeout(() => res(0), 6000); });
}

function openUpload() {
  const items = [];
  const sh = openSheet(`<h3>آپلود آهنگ</h3>
    <div class="dropzone" id="dz">${I.upload}<div><b style="color:var(--text)">فایل‌های آهنگ را انتخاب کن</b><br><small>MP3، M4A، FLAC، WAV، OGG · حداکثر ۱۰۰ مگابایت · چند فایل با هم</small></div></div>
    <div id="upList"></div>
    <button class="btn primary big" id="upGo" hidden>${I.upload} آپلود همه</button>`);
  const dz = $('#dz', sh.el), list = $('#upList', sh.el), go_ = $('#upGo', sh.el);
  const add = async files => {
    for (const f of files) {
      if (!/^audio\//.test(f.type) && !/\.(mp3|m4a|aac|flac|wav|ogg|opus|webm)$/i.test(f.name)) { toast(`«${f.name}» فایل صوتی نیست`, 'warn'); continue; }
      if (f.size > 100 * 1024 * 1024) { toast(`«${f.name}» بیشتر از ۱۰۰ مگ است`, 'warn'); continue; }
      const it = { file: f, title: f.name.replace(/\.[^.]+$/, ''), artist: '', cover: null, duration: 0, id: uid() };
      items.push(it);
      list.insertAdjacentHTML('beforeend', `<div class="upitem" id="u${it.id}"><div class="tcv">${cover({ title: it.title })}<span class="camo">${I.camera}</span></div>
        <div class="uf"><input data-k="title" value="${esc(it.title)}" placeholder="نام آهنگ"><input data-k="artist" placeholder="خواننده"></div>
        <button class="ibtn" data-rm="${it.id}">${I.close}</button><i class="prog"></i></div>`);
      const row = $('#u' + it.id, sh.el);
      $$('input', row).forEach(inp => inp.oninput = () => it[inp.dataset.k] = inp.value);
      $('[data-rm]', row).onclick = () => { items.splice(items.indexOf(it), 1); row.remove(); go_.hidden = !items.length; };
      $('.tcv', row).onclick = () => pickImage(async img => { it.cover = await resizeImage(img, 640); $('.tcv', row).innerHTML = `<img class="cv" src="${URL.createObjectURL(it.cover)}"><span class="camo">${I.camera}</span>`; });
      go_.hidden = false;
      // خواندن اطلاعات ID3 (اسم، خواننده، کاور)
      const [tags, dur] = await Promise.all([readTags(f), readDuration(f)]);
      it.duration = dur;
      if (tags.title) { it.title = tags.title; $('[data-k=title]', row).value = tags.title; }
      if (tags.artist) { it.artist = tags.artist; $('[data-k=artist]', row).value = tags.artist; }
      if (tags.picture && !it.cover) {
        try {
          const pic = tags.picture, blob = new Blob([new Uint8Array(pic.data)], { type: pic.format || 'image/jpeg' });
          it.cover = await resizeImage(blob, 640);
          $('.tcv', row).innerHTML = `<img class="cv" src="${URL.createObjectURL(it.cover)}"><span class="camo">${I.camera}</span>`;
        } catch {}
      }
    }
  };
  dz.onclick = () => { const i = $('#fileAudio'); i.value = ''; i.onchange = () => add([...i.files]); i.click(); };
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); };
  dz.ondragleave = () => dz.classList.remove('over');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('over'); add([...e.dataTransfer.files]); };
  go_.onclick = async () => {
    setBusy(go_, true, 'در حال آپلود…');
    let ok = 0;
    for (const it of [...items]) {
      const row = $('#u' + it.id, sh.el); if (!row || row.classList.contains('done')) continue;
      const bar = $('.prog', row);
      try {
        const up = await cloudUpload('music', it.file, p => bar.style.width = (p * 92) + '%');
        let cover_url = null; if (it.cover) cover_url = await uploadImage(it.cover, 'covers');
        const title = (it.title || 'بدون نام').trim().slice(0, 200), artist = (it.artist || '').trim().slice(0, 200);
        const data = { owner: me.id, title, artist, title_lc: title.toLowerCase(), artist_lc: artist.toLowerCase(), audio_url: up.secure_url, cover_url, duration: it.duration || up.duration || 0, created_at: Date.now() };
        const ref = await db.collection('tracks').add(data); data.id = ref.id;
        bar.style.width = '100%'; row.classList.add('done'); ok++;
        S.tracks.unshift(data);
      } catch (e) { row.classList.add('fail'); toast(`آپلود «${it.title}» ناموفق: ${faErr(e)}`, 'err'); }
    }
    reg('mine', S.tracks);
    setBusy(go_, false);
    if (ok) sh.close(() => { toast(`${fa(ok)} آهنگ آپلود شد 🎉`, 'ok'); if (S.tab === 'library' || S.tab === 'home') { S.libTab = 'mine'; go(S.tab); } });
  };
}

/* =====================================================================
   PROFILE ACTIONS
   ===================================================================== */
function editProfile() {
  const sh = openSheet(`<h3>ویرایش پروفایل</h3><form class="form" id="epf">
    <label class="field"><span>نام نمایشی</span><input name="d" maxlength="40" value="${esc(me.display_name || '')}"></label>
    <label class="field"><span>نام کاربری</span><input name="u" dir="ltr" maxlength="24" value="${esc(me.username)}"></label>
    <label class="field"><span>درباره من</span><textarea name="b" maxlength="160">${esc(me.bio || '')}</textarea></label>
    <button class="btn primary big">ذخیره</button></form>`);
  $('#epf', sh.el).onsubmit = async e => {
    e.preventDefault(); const f = e.target, b = $('button', f); setBusy(b, true);
    const u = f.u.value.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(u)) { setBusy(b, false); return toast('نام کاربری معتبر نیست', 'err'); }
    const upd = { display_name: f.d.value.trim() || u, username: u, bio: f.b.value.trim() };
    upd.name_lc = upd.display_name.toLowerCase();
    try {
      if (u !== me.username) await claimUsername(me.id, u, { old: me.username });
      await db.collection('profiles').doc(me.id).update(upd);
    } catch (err) { setBusy(b, false); return toast(faErr(err), 'err'); }
    Object.assign(me, upd); sh.close(() => { toast('ذخیره شد ✅', 'ok'); go('profile'); });
  };
}
function changeAvatar() {
  pickImage(async f => {
    try { toast('در حال آپلود عکس…'); const blob = await resizeImage(f, 512); const url = await uploadImage(blob, 'avatars');
      await db.collection('profiles').doc(me.id).update({ avatar_url: url }); me.avatar_url = url; toast('عکس پروفایل عوض شد ✨', 'ok'); go('profile'); }
    catch (e) { toast(faErr(e), 'err'); }
  });
}
function changePassword() {
  const sh = openSheet(`<h3>تغییر رمز عبور</h3>
    <p style="text-align:center;color:var(--muted);margin:-6px 0 16px;line-height:1.9">برای امنیت، یک <b style="color:var(--text)">لینک تأیید</b> به <span class="otp-mail">${esc(me.email)}</span> می‌فرستیم.<br>روی لینک بزن و رمز جدید را همان‌جا انتخاب کن.</p>
    <button class="btn primary big" id="cpSend">ارسال لینک تغییر رمز</button>`);
  $('#cpSend', sh.el).onclick = async () => {
    const b = $('#cpSend', sh.el); setBusy(b, true);
    try { await auth.sendPasswordResetEmail(me.email); sh.close(() => toast('لینک تغییر رمز به ایمیلت فرستاده شد ✉️', 'ok')); }
    catch (e) { setBusy(b, false); toast(faErr(e), 'err'); }
  };
}
async function followListSheet(kind) {
  const col = kind === 'followers' ? 'follower' : 'following', where = kind === 'followers' ? 'following' : 'follower';
  const snap = await db.collection('follows').where(where, '==', me.id).get();
  const ps = await getProfiles(docs(snap).map(r => r[col]));
  const sh = openSheet(`<h3>${kind === 'followers' ? 'دنبال‌کننده‌ها' : 'دنبال‌شده‌ها'}</h3>${ps.map(p => userRow(p, followBtn(p.id))).join('') || emptyState(I.users, 'خالی است', '')}`);
  sh.el.addEventListener('click', e => { const u = e.target.closest('.urow'); if (u && !e.target.closest('[data-act=follow]')) { e.stopPropagation(); sh.close(() => openSub('user', u.dataset.id)); } }, true);
}

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
function installApp() {
  if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; return; }
  openSheet(`<h3>نصب Spotylive</h3><div style="line-height:2.1;color:var(--muted);font-size:15px">
    <b style="color:var(--text)">اندروید (Chrome):</b> منوی ⋮ بالای مرورگر ← «Add to Home screen / نصب برنامه»<br>
    <b style="color:var(--text)">آیفون (Safari):</b> دکمه اشتراک‌گذاری ⬆️ ← «Add to Home Screen»<br>
    <b style="color:var(--text)">کامپیوتر (Chrome/Edge):</b> آیکون نصب در نوار آدرس</div>`);
}

/* =====================================================================
   GLOBAL CLICK ACTIONS
   ===================================================================== */
const ACT = {
  eye: el => { const i = el.parentElement.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; },
  auth: el => showAuth(el.dataset.m),
  resend: async () => { try { await auth.currentUser.sendEmailVerification(); toast('لینک دوباره ارسال شد ✉️', 'ok'); startResendTimer($('#auth .resend')); } catch (e) { toast(faErr(e), 'err'); } },
  authOut: async () => { await auth.signOut(); showAuth('login'); },
  tab: el => { if (chatEl) { chatEl.remove(); chatEl = null; S.chatWith = null; } layers.length = 0; S.sub = null; closeNPSilent(); go(el.dataset.tab); },
  back: () => subBack(),
  playFrom: el => { const list = S.lists[el.dataset.list]; playList(list, +el.dataset.i); },
  playOne: el => { const t = S.tmap.get(el.dataset.id); t && playList([t], 0); },
  playAll: el => { P.shuffle = false; playList(S.lists[el.dataset.list], 0); },
  shuffleAll: el => { const l = S.lists[el.dataset.list]; if (!l || !l.length) return; P.shuffle = true; playList(l, Math.floor(Math.random() * l.length)); },
  like: (el, e) => { e.stopPropagation(); toggleLike(el.dataset.id, el); },
  likeCur: () => P.cur && toggleLike(P.cur.id),
  tmenu: (el, e) => { e.stopPropagation(); trackMenu(el.dataset.id, el.dataset.list); },
  toggle: (el, e) => { e.stopPropagation(); togglePlay(); },
  next: () => next(), prev: () => prev(),
  shuffle: () => { P.shuffle = !P.shuffle; $('#bShuf').classList.toggle('on', P.shuffle); toast(P.shuffle ? 'پخش تصادفی روشن' : 'پخش تصادفی خاموش'); },
  repeat: () => { P.repeat = { off: 'all', all: 'one', one: 'off' }[P.repeat]; updateNP(); toast({ off: 'تکرار خاموش', all: 'تکرار همه', one: 'تکرار همین آهنگ' }[P.repeat]); },
  npClose: () => closeNP(),
  npMore: () => P.cur && trackMenu(P.cur.id),
  queue: () => {
    const sh = openSheet(`<h3>صف پخش</h3><div class="tlist">${P.queue.map((t, i) => `<div class="trow ${i === P.i ? 'playing' : ''}" data-q="${i}" data-id="${t.id}"><div class="tcv">${cover(t)}<span class="eq"><i></i><i></i><i></i></span></div><div class="tmeta"><b>${esc(t.title)}</b><small>${esc(t.artist || 'ناشناس')}</small></div></div>`).join('')}</div>`);
    $$('[data-q]', sh.el).forEach(r => r.onclick = () => { if (isGuest()) { sh.close(); return playList(P.queue, +r.dataset.q); } P.i = +r.dataset.q; loadTrack(P.queue[P.i]); sh.close(); });
  },
  upload: () => openUpload(),
  libTab: el => { S.libTab = el.dataset.k; go('library'); },
  newPlaylist: () => newPlaylist(),
  playlist: el => openSub('playlist', el.dataset.id),
  openLiked: () => openSub('liked'),
  renamePl: el => {
    const pl = S.curPlaylist;
    const sh = openSheet(`<h3>تغییر نام</h3><form class="form" id="rnf"><label class="field"><input name="n" maxlength="60" value="${esc(pl.name)}"></label><button class="btn primary big">ذخیره</button></form>`);
    $('#rnf', sh.el).onsubmit = async e => { e.preventDefault(); const n = e.target.n.value.trim(); if (!n) return; await db.collection('playlists').doc(pl.id).update({ name: n.slice(0, 60) }); const x = S.playlists.find(p => p.id === pl.id); if (x) x.name = n; sh.close(() => refresh()); };
  },
  delPl: el => confirmBox('پلی‌لیست حذف شود؟', 'آهنگ‌ها پاک نمی‌شوند، فقط پلی‌لیست.', 'حذف', async () => {
    await db.collection('playlists').doc(el.dataset.id).delete(); S.playlists = S.playlists.filter(p => p.id !== el.dataset.id); toast('حذف شد', 'ok'); subBack();
  }),
  user: el => { if (chatEl) { const id = el.dataset.id; popLayer(() => openSub('user', id)); } else openSub('user', el.dataset.id); },
  follow: (el, e) => { e.stopPropagation(); toggleFollow(el.dataset.id, el); },
  openChat: (el, e) => { e && e.stopPropagation(); openChat(el.dataset.id); },
  closeChat: () => closeChat(),
  newChat: () => pickFriend({ title: 'گفتگو با…', onPick: id => openChat(id) }),
  liveFromChat: el => {
    const id = el.dataset.id;
    if (L.active && L.active.status === 'active' && L.active.peer === id) return openNP();
    if (!S.online.has(id)) return toast('دوستت آفلاین است — پخش هم‌زمان فقط وقتی هر دو آنلاین باشید کار می‌کند', 'warn');
    pickTrack({ title: '🎧 یک آهنگ برای پخش هم‌زمان انتخاب کن', onPick: t => liveInvite(id, t) });
  },
  shareTrackPick: el => { const id = el.dataset.id; pickTrack({ title: 'ارسال آهنگ', onPick: t => sendMessage(id, t.title, 'track', t.id) }); },
  liveFromNP: () => {
    if (L.active && L.active.status === 'active') return toast('الان در لایو هستی 🎧', 'live');
    const t = P.cur; if (!t) return;
    pickFriend({ title: 'با کی هم‌زمان گوش بدی؟', onlineOnly: true, onPick: id => liveInvite(id, t) });
  },
  leaveLive: () => { endLive(true); toast('از لایو خارج شدی', 'info'); },
  editProfile: () => editProfile(),
  changeAvatar: () => changeAvatar(),
  changePass: () => changePassword(),
  followers: () => followListSheet('followers'),
  followingList: () => followListSheet('following'),
  installApp: () => installApp(),
  logout: () => confirmBox('خروج از حساب؟', '', 'خروج', logout),
};
function closeNPSilent() { const np = $('#np'); if (np.classList.contains('open')) { np.classList.remove('open'); } }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const f = ACT[el.dataset.act]; if (!f) return;
  if (el.tagName === 'A') e.preventDefault();
  f(el, e);
});
document.addEventListener('keydown', e => {
  if (!me || e.target.closest('input,textarea')) return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowLeft' && e.altKey) next();
  if (e.code === 'ArrowRight' && e.altKey) prev();
});

boot();
})();
