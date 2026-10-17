"use strict";
const $ = (s, r = document) => r.querySelector(s),
  $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (t, c, h) => {
  const e = document.createElement(t);
  if (c) e.className = c;
  if (h != null) e.innerHTML = h;
  return e;
};
const cap = (s) => s[0].toUpperCase() + s.slice(1),
  asset = (p) => encodeURI("assets/" + p);
const store = (a) => ({
  get(k) {
    try {
      return JSON.parse(a().getItem(k));
    } catch (e) {
      return null;
    }
  },
  set(k, v) {
    try {
      a().setItem(k, JSON.stringify(v));
    } catch (e) {}
  },
});
const LS = store(() => localStorage),
  SS = store(() => sessionStorage);
const Snd = {
  t: 0,
  c: {},
  p(k) {
    try {
      (this.c[k] || (this.c[k] = new Audio("assets/sounds/" + k + ".mp3")))
        .cloneNode()
        .play()
        .catch(() => {});
    } catch (e) {}
  },
  nav() {
    const n = performance.now();
    if (n - this.t < 60) return;
    this.t = n;
    this.p("navigate");
  },
  ver() {
    this.p("verdict");
  },
};
const LK = { stack: [], keys: {} };
function modal(node, onDismiss, keys = {}) {
  const bd = el("div", "backdrop");
  node.classList.add("modal");
  node.tabIndex = -1;
  bd.append(node);
  const m = {
    keys,
    close() {
      const i = LK.stack.indexOf(m);
      if (i < 0) return;
      LK.stack.splice(i, 1);
      bd.remove();
      document.body.classList.toggle("noscroll", LK.stack.length > 0);
      if (typeof UI !== "undefined") UI.modalClosed(LK.stack.length);
      onDismiss && onDismiss();
    },
  };
  bd.addEventListener("mousedown", (e) => {
    if (e.target === bd) m.close();
  });
  LK.stack.push(m);
  document.body.append(bd);
  document.body.classList.add("noscroll");
  if (typeof UI !== "undefined") UI.modalOpen(bd, node);
  node.focus({ preventScroll: true });
  return m;
}
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target;
  if (/^(INPUT|TEXTAREA)$/.test(t.tagName)) {
    if (e.key === "Escape") t.blur();
    return;
  }
  if (t.closest("button,a") && (e.key === "Enter" || e.key === " ")) return;
  const top = LK.stack[LK.stack.length - 1];
  if (top && e.key === "Escape") {
    e.preventDefault();
    top.close();
    return;
  }
  const f = (top ? top.keys : LK.keys)[e.key.toLowerCase()];
  if (f && !e.repeat) {
    e.preventDefault();
    f();
  }
});
// Mouse clicks release focus so Enter still means "Fight" afterwards; keyboard users keep focus.
document.addEventListener("click", (e) => {
  if (e.detail > 0) {
    const b = e.target.closest("button");
    if (b) b.blur();
  }
});
