"use strict";
let ci = 0,
  fl = "all",
  q = "",
  ready = false;
const fmt = (ms) =>
  new Date(ms || Date.now()).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
const go = () => {
  Snd.nav();
  location.href = "index.html";
};
function tabsel() {
  $$(".tab").forEach((b, i) => b.classList.toggle("sel", i === ci));
}
function sum() {
  const b = RM.xpNext,
    a = RM.xpThis;
  $("#lv").innerHTML = "LV<br>" + RM.level;
  $("#rank").textContent = RM.rank;
  $("#xpb").style.width = ((RM.xp - a) * 100) / (b - a) + "%";
  $("#xpt").textContent =
    `${RM.xp} / ${b} XP to level ${RM.level + 1} \u2022 ${RM.count()} of ${RM.total()} unlocked`;
  $("#tabs").innerHTML = CATS.map(
    (c, i) =>
      `<button class="tab" data-i="${i}">${c[1]}<em>${RM.count(c[0])}/${RM.total(c[0])}</em></button>`,
  ).join("");
  tabsel();
}
function list() {
  const c = CATS[ci][0],
    items = RM.all.filter(
      (r) =>
        r.cat === c &&
        (fl === "all" || (fl === "unlocked") === RM.isU(r)) &&
        (!q ||
          r.title.toLowerCase().includes(q) ||
          r.desc.toLowerCase().includes(q)),
    );
  $("#empty").hidden = items.length > 0;
  $("#grid").innerHTML = items
    .map((r) => {
      const g = RM.isU(r);
      return `<button class="rw${g ? " got" : ""}" style="--rc:${RC[r.rarity]}" data-id="${r.id}"><img loading="lazy" src="assets/rewards/${r.icon}" alt=""><div><b>${r.title}</b><p>${r.desc}</p><div class="pb">${g ? "" : `<div class="bar"><i style="width:${RM.frac(r) * 100}%"></i></div>`}<span class="${g ? "ok" : ""}">${g ? "Unlocked " + fmt(RM.at(r)) : RM.progress(r) + " / " + r.target}</span></div></div></button>`;
    })
    .join("");
}
function detail(r) {
  const g = RM.isU(r),
    x = RX[r.rarity];
  const n = el(
    "div",
    "",
    `<h2 class="mt">${KIND[r.cat][2]}</h2><img class="dic${g ? "" : " lock"}" src="assets/rewards/${r.icon}" alt=""><h3 style="color:${g ? RC[r.rarity] : "var(--tp)"}">${r.title}</h3><span class="chip" style="--rc:${RC[r.rarity]}">${RN[r.rarity]}</span><p class="dd">${r.desc}</p>${g ? "" : `<div class="bar" style="--rc:${RC[r.rarity]}"><i style="width:${RM.frac(r) * 100}%"></i></div>`}<p class="st${g ? " ok" : ""}">${g ? `Unlocked ${fmt(RM.at(r))} \u2022 +${x} XP` : `${RM.progress(r)} / ${r.target} \u2022 +${x} XP when unlocked`}</p><button class="btn out full" id="cl">Close</button>`,
  );
  const m = modal(n);
  $("#cl", n).onclick = () => {
    Snd.nav();
    m.close();
  };
}
function confirmReset() {
  const n = el(
    "div",
    "",
    `<h2 class="mt">Reset progress?</h2><p class="cm">This erases every unlocked Milestone, Achievement, Medal and Badge and all lifetime stats. It cannot be undone.</p><div class="row2"><button class="btn out" id="no">Cancel</button><button class="btn mgf" id="yes">Reset</button></div>`,
  );
  const m = modal(n);
  $("#no", n).onclick = () => {
    Snd.nav();
    m.close();
  };
  $("#yes", n).onclick = () => {
    Snd.nav();
    RM.wipe();
    m.close();
    sum();
    list();
  };
}
const tab = (i) => {
  ci = (i + CATS.length) % CATS.length;
  if (ready) Snd.nav();
  tabsel();
  list();
};
const filt = (f) => {
  fl = f;
  $$("[data-fl]").forEach((b) => b.classList.toggle("sel", b.dataset.fl === f));
  if (ready) Snd.nav();
  list();
};
$("#tabs").onclick = (e) => {
  const b = e.target.closest("[data-i]");
  if (b) tab(+b.dataset.i);
};
$("#seg").onclick = (e) => {
  const b = e.target.closest("[data-fl]");
  if (b) filt(b.dataset.fl);
};
$("#grid").onclick = (e) => {
  const b = e.target.closest("[data-id]");
  if (b) {
    Snd.nav();
    detail(RM.all.find((r) => r.id === b.dataset.id));
  }
};
$("#q").oninput = (e) => {
  q = e.target.value.trim().toLowerCase();
  list();
};
$("#back").onclick = go;
$("#help").onclick = help;
$("#rp").onclick = () => {
  Snd.nav();
  confirmReset();
};
function help() {
  const n = el(
    "div",
    "",
    `<h2 class="mt">Keyboard shortcuts</h2><div class="kgrid"><div class="scard"><div class="sk"><kbd>\u2190</kbd> / <kbd>\u2192</kbd></div><div class="sv">Previous / next tab</div></div><div class="scard"><div class="sk"><kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd></div><div class="sv">All / Unlocked / Locked</div></div><div class="scard"><div class="sk"><kbd>/</kbd></div><div class="sv">Search rewards</div></div><div class="scard"><div class="sk"><kbd>B</kbd></div><div class="sv">Back to game</div></div><div class="scard"><div class="sk"><kbd>Esc</kbd></div><div class="sv">Close a dialog</div></div></div><button class="btn out full" id="cl">Close</button>`,
  );
  const m = modal(n);
  $("#cl", n).onclick = () => {
    Snd.nav();
    m.close();
  };
}
LK.keys = {
  arrowleft: () => tab(ci - 1),
  arrowright: () => tab(ci + 1),
  1: () => filt("all"),
  2: () => filt("unlocked"),
  3: () => filt("locked"),
  "/": () => $("#q").focus(),
  b: go,
};
sum();
filt("all");
ready = true;
