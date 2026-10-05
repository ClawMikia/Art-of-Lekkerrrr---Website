"use strict";
const S = SS.get("lk_sel") || { g: "rock", v: "plain", f: 1 };
let sc = LS.get("lk_scores") || { w: 0, l: 0, t: 0 };
const pend = [];
let showing = false;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function render() {
  $$("[data-g]").forEach((b) => b.classList.toggle("sel", b.dataset.g === S.g));
  $$("[data-v]").forEach((b) => b.classList.toggle("sel", b.dataset.v === S.v));
  $("#figs").innerHTML = Array.from({ length: NF }, (_, i) => i + 1)
    .map(
      (n) =>
        `<button class="fig${n === S.f ? " sel" : ""}" data-f="${n}" aria-label="Figure ${n}"><img src="${asset(`${S.g}/${S.v}/${S.g} (${n}).png`)}" alt=""><small>#${n}</small></button>`,
    )
    .join("");
  SS.set("lk_sel", S);
}
function scores() {
  $("#sw").textContent = sc.w;
  $("#sl").textContent = sc.l;
  $("#st").textContent = sc.t;
  LS.set("lk_scores", sc);
}
function card() {
  const b = RM.xpNext,
    a = RM.xpThis;
  $("#lv").innerHTML = "LV<br>" + RM.level;
  $("#rank").textContent = RM.rank;
  $("#xpb").style.width = ((RM.xp - a) * 100) / (b - a) + "%";
  $("#xpt").textContent =
    `${RM.xp} / ${b} XP \u2022 ${RM.count()} / ${RM.total()} unlocked`;
}
const choose = (k, v) => {
  Snd.nav();
  S[k] = v;
  S.f = 1;
  render();
};
const step = (d) => {
  Snd.nav();
  S.f = ((S.f - 1 + d + NF) % NF) + 1;
  render();
};
function flush() {
  if (showing || !pend.length) return;
  const b = pend.splice(0);
  showing = true;
  card();
  const n = el(
    "div",
    "",
    `<h2 class="mt">${b.length > 1 ? b.length + " " : ""}Unlocked!</h2><div class="ulist">${b.map((r) => `<div class="ur" style="--rc:${RC[r.rarity]}"><img src="assets/rewards/${r.icon}" alt=""><div><small>${KIND[r.cat][2]}</small><b>${r.title}</b><p>${r.desc}</p><span class="chip" style="--rc:${RC[r.rarity]}">${RN[r.rarity]}</span><span class="xp">+${RX[r.rarity]} XP</span></div></div>`).join("")}</div><div class="row2"><button class="btn out lime" id="ot">Trophy Room</button><button class="btn fill" id="ct">Continue</button></div>`,
  );
  const cont = () => {
      Snd.nav();
      m.close();
    },
    tr = () => {
      Snd.nav();
      m.close();
      location.href = "trophy-room.html";
    };
  const m = modal(
    n,
    () => {
      showing = false;
      flush();
    },
    { enter: cont, t: tr },
  );
  $("#ct", n).onclick = cont;
  $("#ot", n).onclick = tr;
}
function battle() {
  const cg = pick(G),
    cv = pick(V),
    cf = 1 + Math.floor(Math.random() * NF);
  const r =
    S.g === cg
      ? "tie"
      : { rock: "scissor", scissor: "paper", paper: "rock" }[S.g] === cg
        ? "win"
        : "lose";
  const col = { win: "var(--li)", lose: "var(--mg)", tie: "var(--cy)" }[r],
    msg = { win: "You Win!", lose: "You Lose!", tie: "It's a Tie!" }[r];
  sc[{ win: "w", lose: "l", tie: "t" }[r]]++;
  scores();
  pend.push(...RM.fight(S.g, S.v, S.f, cg, cv, cf, r, sc.w - sc.l));
  card();
  const side = (w, c, g, v, f, alt) =>
    `<div class="comb"><b class="${c}">${w}</b><img src="${asset(`${g}/${v}/${g} (${f}).png`)}" alt="${alt}"><small>${cap(g)} / ${cap(v)} / #${f}</small></div>`;
  const n = el(
    "div",
    "",
    `<h2 class="mt">Scoreboard</h2><div class="vsrow">${side("You", "cy", S.g, S.v, S.f, "Your hand")}<b class="vs">VS</b>${side("CPU", "mg", cg, cv, cf, "CPU hand")}</div><div class="res" style="color:${col};border-color:${col}">${msg}</div><hr><div class="row2"><button class="btn out" id="pa">Play Again</button><button class="btn out" id="rs">Reset Scores</button></div>`,
  );
  const again = () => {
      Snd.nav();
      m.close();
      Object.assign(S, { g: "rock", v: "plain", f: 1 });
      render();
    },
    rst = () => {
      Snd.nav();
      m.close();
      resetScores();
    };
  const m = modal(n, flush, { a: again, x: rst });
  $("#pa", n).onclick = again;
  $("#rs", n).onclick = rst;
  Snd.ver();
}
function resetScores() {
  sc = { w: 0, l: 0, t: 0 };
  scores();
  pend.push(...RM.reset());
}
function details() {
  pend.push(...RM.details());
  const n = el(
    "div",
    "",
    `<h2 class="mt">Details</h2><div class="drow"><div class="dimg"><img src="${asset(`${S.g}/${S.v}/${S.g} (${S.f}).png`)}" alt="Selected figure"></div><div class="dlist"><div><span>Gesture</span><b>${cap(S.g)}</b></div><div><span>Variant</span><b>${cap(S.v)}</b></div><div><span>Figure</span><b>#${S.f}</b></div></div></div><button class="btn out full" id="cl">Close</button>`,
  );
  const m = modal(n, flush);
  $("#cl", n).onclick = () => {
    Snd.nav();
    m.close();
  };
}
function help() {
  const n = el(
    "div",
    "",
    `<h2 class="mt">Keyboard shortcuts</h2><div class="kgrid"><div class="scard"><div class="sk"><kbd>R</kbd> / <kbd>P</kbd> / <kbd>S</kbd></div><div class="sv">Rock / Paper / Scissor</div></div><div class="scard"><div class="sk"><kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd></div><div class="sv">Plain / Light / Dark</div></div><div class="scard"><div class="sk"><kbd>\u2190</kbd> / <kbd>\u2192</kbd></div><div class="sv">Previous / next figure</div></div><div class="scard"><div class="sk"><kbd>Enter</kbd> / <kbd>F</kbd></div><div class="sv">Fight</div></div><div class="scard"><div class="sk"><kbd>D</kbd></div><div class="sv">Details</div></div><div class="scard"><div class="sk"><kbd>X</kbd></div><div class="sv">Reset scores</div></div><div class="scard"><div class="sk"><kbd>T</kbd></div><div class="sv">Trophy Room</div></div><div class="scard"><div class="sk"><kbd>?</kbd></div><div class="sv">Shortcuts</div></div><div class="scard"><div class="sk"><kbd>Esc</kbd></div><div class="sv">Close a dialog</div></div></div><button class="btn out full" id="cl">Close</button>`,
  );
  const m = modal(n);
  $("#cl", n).onclick = () => {
    Snd.nav();
    m.close();
  };
}
const go = () => {
    Snd.ver();
    battle();
  },
  trophy = () => {
    Snd.nav();
    location.href = "trophy-room.html";
  };
$$("[data-g]").forEach((b) => (b.onclick = () => choose("g", b.dataset.g)));
$$("[data-v]").forEach((b) => (b.onclick = () => choose("v", b.dataset.v)));
$("#figs").onclick = (e) => {
  const b = e.target.closest("[data-f]");
  if (b) {
    Snd.nav();
    S.f = +b.dataset.f;
    render();
  }
};
$("#fight").onclick = go;
$("#det").onclick = () => {
  Snd.nav();
  details();
};
$("#reset").onclick = () => {
  Snd.nav();
  resetScores();
  flush();
};
$("#trophy").onclick = trophy;
$("#help").onclick = help;
LK.keys = {
  r: () => choose("g", "rock"),
  p: () => choose("g", "paper"),
  s: () => choose("g", "scissor"),
  1: () => choose("v", "plain"),
  2: () => choose("v", "light"),
  3: () => choose("v", "dark"),
  arrowleft: () => step(-1),
  arrowright: () => step(1),
  enter: go,
  f: go,
  d: () => {
    Snd.nav();
    details();
  },
  x: () => {
    Snd.nav();
    resetScores();
    flush();
  },
  t: trophy,
  "?": help,
};
render();
scores();
card();
