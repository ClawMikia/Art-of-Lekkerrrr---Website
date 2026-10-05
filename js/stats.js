"use strict";
const G = ["rock", "paper", "scissor"],
  V = ["plain", "light", "dark"],
  NF = 12;
const RK = [
  "Rookie",
  "Challenger",
  "Contender",
  "Duelist",
  "Veteran",
  "Champion",
  "Hero",
  "Legend",
  "Mythic",
  "Immortal",
];
const RN = ["Common", "Uncommon", "Rare", "Epic", "Legendary"],
  RX = [10, 25, 50, 100, 200],
  RC = ["#9DB09D", "#32CD32", "#00FFFF", "#FF69B4", "#FFC400"];
const CATS = [
  ["milestone", "Milestones", "Milestone"],
  ["achievement", "Achievements", "Achievement"],
  ["medal", "Medals", "Medal"],
  ["badge", "Badges", "Badge"],
];
const KIND = Object.fromEntries(CATS.map((c) => [c[0], c]));
const band = (h) =>
  h < 5
    ? "night"
    : h < 8
      ? "dawn"
      : h < 12
        ? "morning"
        : h < 18
          ? "afternoon"
          : h < 21
            ? "evening"
            : "late";
class Stats {
  constructor(j) {
    this.c = {};
    this.used = new Set();
    this.won = new Set();
    if (j) {
      Object.assign(this.c, j.c);
      (j.used || []).forEach((x) => this.used.add(x));
      (j.won || []).forEach((x) => this.won.add(x));
    }
  }
  get(k) {
    return this.c[k] || 0;
  }
  inc(k) {
    this.c[k] = this.get(k) + 1;
  }
  max(k, v) {
    if (v > this.get(k)) this.c[k] = v;
  }
  fight(pg, pv, pf, cg, cv, cf, o, lead, now) {
    const c = this.c,
      g = (k) => this.get(k),
      i = (k) => this.inc(k),
      m = (k, v) => this.max(k, v);
    i("total");
    i("pg_" + pg);
    i("pv_" + pv);
    i("pf_" + pf);
    i(`pc_${pg}_${pv}`);
    i("cg_" + cg);
    i("cv_" + cv);
    i("cf_" + cf);
    i(`m_${pg}_${cg}`);
    i("tb_" + band(now.getHours()));
    if (now.getDay() % 6 === 0) i("wk");
    const idx = (G.indexOf(pg) * 3 + V.indexOf(pv)) * NF + pf - 1;
    this.used.add(idx);
    if (pg === cg && pv === cv && pf === cf) i("mirror");
    const pl = g("cur_ls");
    if (o === "win") {
      i("wins");
      i("wg_" + pg);
      i("wv_" + pv);
      i("wf_" + pf);
      i(`wc_${pg}_${pv}`);
      i("wcv_" + cv);
      i("wcf_" + cf);
      this.won.add(idx);
      if (pl >= 3) i("cb");
      c.cur_ws = g("cur_ws") + 1;
      m("bws", c.cur_ws);
      c.cur_ls = 0;
      c.cur_ts = 0;
      c.cur_nl = g("cur_nl") + 1;
      m("bnl", c.cur_nl);
    } else if (o === "lose") {
      i("losses");
      c.cur_ls = g("cur_ls") + 1;
      m("bls", c.cur_ls);
      c.cur_ws = 0;
      c.cur_ts = 0;
      c.cur_nl = 0;
    } else {
      i("ties");
      i("tg_" + pg);
      c.cur_ts = g("cur_ts") + 1;
      m("bts", c.cur_ts);
      c.cur_ws = 0;
      c.cur_ls = 0;
      c.cur_nl = g("cur_nl") + 1;
      m("bnl", c.cur_nl);
    }
    G.forEach((x) => {
      c["cur_sg_" + x] = o === "win" && pg === x ? g("cur_sg_" + x) + 1 : 0;
      m("bsg_" + x, c["cur_sg_" + x]);
    });
    V.forEach((x) => {
      c["cur_sv_" + x] = o === "win" && pv === x ? g("cur_sv_" + x) + 1 : 0;
      m("bsv_" + x, c["cur_sv_" + x]);
    });
    const day = Math.floor(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 864e5,
    );
    if (g("_last") !== day) {
      c._cur = g("_last") === day - 1 ? g("_cur") + 1 : 1;
      i("days");
      m("bds", c._cur);
      c._last = day;
      c._tg = 0;
      c._tw = 0;
    }
    c._tg = g("_tg") + 1;
    if (o === "win") c._tw = g("_tw") + 1;
    m("bdg", c._tg);
    m("bdw", c._tw);
    m("mlead", lead);
    m("dfc", -lead);
  }
  value(m) {
    const u = [...this.used],
      w = [...this.won];
    let p;
    if (m === "df") return u.length;
    if (m === "dwf") return w.length;
    if (m === "nl20" || m === "nl100") {
      const t = this.get("total");
      return t >= (m === "nl20" ? 20 : 100)
        ? Math.floor(((this.get("wins") + this.get("ties")) * 100) / t)
        : 0;
    }
    if (m === "gestWon")
      return G.filter((x) => this.get("wg_" + x) >= 1).length;
    if (m.startsWith("dgw_")) {
      p = G.indexOf(m.slice(4));
      return w.filter((x) => Math.floor(x / 36) === p).length;
    }
    if (m.startsWith("dg_")) {
      p = G.indexOf(m.slice(3));
      return u.filter((x) => Math.floor(x / 36) === p).length;
    }
    if (m.startsWith("dv_")) {
      p = V.indexOf(m.slice(3));
      return u.filter((x) => Math.floor(x / 12) % 3 === p).length;
    }
    if (m.startsWith("dc_")) {
      const q = m.split("_");
      p = G.indexOf(q[1]) * 3 + V.indexOf(q[2]);
      return u.filter((x) => Math.floor(x / 12) === p).length;
    }
    return this.get(m);
  }
}
const RM = (() => {
  const K = "lekkerrrr_progress_v1",
    all = REWARDS.map((o) => ({
      id: o.id,
      cat: o.cat,
      title: o.title,
      desc: o.desc,
      metric: o.metric,
      target: o.target,
      rarity: o.rarity,
      icon: o.icon,
    }));
  let stats = new Stats(),
    un = {};
  const d = LS.get(K);
  if (d) {
    stats = new Stats(d.stats);
    un = d.unlocked || {};
  }
  const save = () =>
    LS.set(K, {
      stats: { c: stats.c, used: [...stats.used], won: [...stats.won] },
      unlocked: un,
    });
  const fin = () => {
    const now = Date.now(),
      f = all.filter((r) => !(r.id in un) && stats.value(r.metric) >= r.target);
    f.forEach((r) => (un[r.id] = now));
    save();
    return f;
  };
  const R = {
    all,
    isU: (r) => r.id in un,
    at: (r) => un[r.id],
    progress: (r) => Math.min(stats.value(r.metric), r.target),
    frac: (r) => (R.isU(r) ? 1 : R.progress(r) / r.target),
    count: (c) => all.filter((r) => (!c || r.cat === c) && R.isU(r)).length,
    total: (c) => (c ? all.filter((r) => r.cat === c).length : all.length),
    get xp() {
      return all.reduce((s, r) => s + (R.isU(r) ? RX[r.rarity] : 0), 0);
    },
    get level() {
      return 1 + Math.floor(Math.sqrt(R.xp / 40));
    },
    get xpThis() {
      return 40 * (R.level - 1) ** 2;
    },
    get xpNext() {
      return 40 * R.level ** 2;
    },
    get rank() {
      return RK[Math.min(Math.floor((R.level - 1) / 3), RK.length - 1)];
    },
    fight(...a) {
      stats.fight(...a, new Date());
      return fin();
    },
    details() {
      stats.inc("det");
      return fin();
    },
    reset() {
      stats.inc("rst");
      return fin();
    },
    wipe() {
      stats = new Stats();
      un = {};
      save();
    },
  };
  return R;
})();
