"use strict";
/* 3D-style UI helpers: pointer tilt + specular, ripples, click sparkles, number ticks,
   camera-style page transitions and the battle / reward effect choreography. */
const UI = (() => {
  const U = {};
  const reduced = () => FX.reduced;
  const fine = matchMedia("(hover:hover) and (pointer:fine)");
  const TILT = "[data-tilt],.rw,.card.tl";

  /* ---------- page enter / leave (camera move) ---------- */
  document.body.classList.add("enter");
  setTimeout(() => document.body.classList.remove("enter"), 1100);
  U.go = (url) => {
    if (reduced()) {
      location.href = url;
      return;
    }
    document.body.classList.add("leaving");
    setTimeout(() => (location.href = url), 360);
  };
  // restore page if user returns via bfcache
  addEventListener("pageshow", (e) => {
    if (e.persisted) document.body.classList.remove("leaving");
  });

  /* ---------- stagger ---------- */
  U.stagger = (root, sel, max = 24) =>
    (sel ? [...root.querySelectorAll(sel)] : [...root.children]).forEach(
      (c, i) => c.style.setProperty("--k", Math.min(i, max)),
    );
  U.modalOpen = (bd, node) => {
    document.body.classList.add("has-modal");
    U.stagger(node, "", 14);
    if (/\bnoray\b/.test(node.className)) return;
  };
  U.modalClosed = (left) => {
    if (!left) document.body.classList.remove("has-modal");
  };

  /* ---------- number tick/flip ---------- */
  U.setNum = (el, v) => {
    const s = String(v);
    if (el.textContent === s) return;
    const first = el.dataset.init !== "1";
    el.textContent = s;
    el.dataset.init = "1";
    if (first || reduced()) return;
    el.classList.remove("tick");
    void el.offsetWidth;
    el.classList.add("tick");
  };
  U.pulse = (el) => {
    if (!el || reduced()) return;
    el.classList.remove("pulse");
    void el.offsetWidth;
    el.classList.add("pulse");
  };

  /* ---------- tilt with specular highlight ---------- */
  let cur = null,
    pend = null,
    raf = 0;
  const maxFor = (t) => +t.dataset.tilt || (t.classList.contains("rw") ? 8 : 6);
  const apply = () => {
    raf = 0;
    if (!pend) return;
    const { t, x, y } = pend,
      r = t.getBoundingClientRect(),
      nx = (x - r.left) / r.width - 0.5,
      ny = (y - r.top) / r.height - 0.5,
      m = maxFor(t);
    t.style.setProperty("--rx", (-ny * 2 * m).toFixed(2) + "deg");
    t.style.setProperty("--ry", (nx * 2 * m).toFixed(2) + "deg");
    t.style.setProperty("--mx", ((nx + 0.5) * 100).toFixed(1) + "%");
    t.style.setProperty("--my", ((ny + 0.5) * 100).toFixed(1) + "%");
    t.style.setProperty("--sp", "1");
  };
  const rest = (t) => {
    if (!t) return;
    t.style.setProperty("--rx", "0deg");
    t.style.setProperty("--ry", "0deg");
    t.style.setProperty("--sp", "0");
    t.classList.remove("tilting");
  };
  let lastTrail = 0;
  document.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") return;
      const t = !reduced() && fine.matches ? e.target.closest(TILT) : null;
      if (t !== cur) {
        rest(cur);
        cur = t;
        if (t) t.classList.add("tilting");
      }
      // hold the tilt still while the pointer is over a control, so the control
      // does not slide away from under the cursor mid-click
      const hot = t && e.target.closest("button,a,input,select,.nav");
      if (t && !hot) {
        pend = { t, x: e.clientX, y: e.clientY };
        if (!raf) raf = requestAnimationFrame(apply);
      }
      // hover trail over interactive things
      if (!reduced() && e.target.closest && e.target.closest(".btn,.fig,.rw,.tab,.g,.v")) {
        const n = performance.now();
        if (n - lastTrail > 55) {
          lastTrail = n;
          FX.trail(e.clientX, e.clientY);
        }
      }
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => {
    rest(cur);
    cur = null;
  });
  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) {
      rest(cur);
      cur = null;
    }
  });

  /* ---------- ripple + click sparkle ---------- */
  const RIP = ".btn,.tab,.rw,.back,.link";
  document.addEventListener(
    "pointerdown",
    (e) => {
      const b = e.target.closest(RIP);
      if (!b || reduced()) return;
      const r = b.getBoundingClientRect(),
        d = Math.max(r.width, r.height) * 2,
        s = document.createElement("span");
      s.className = "ripple";
      s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      b.append(s);
      setTimeout(() => s.remove(), 700);
    },
    { passive: true },
  );
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest("button,.fig");
      if (!b) return;
      let x = e.clientX,
        y = e.clientY;
      if (!e.detail) {
        const r = b.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      const sel = b.matches(".g,.v,.fig,.tab,[data-fl]");
      FX.sparkle(x, y, sel ? 14 : 9);
    },
    { passive: true },
  );
  // keyboard-driven selection (R/P/S/1-3/arrows) gets sparkles on the selected control too
  U.selectSpark = (elm) => {
    if (!elm || reduced()) return;
    const r = elm.getBoundingClientRect();
    FX.sparkle(r.left + r.width / 2, r.top + r.height / 2, 10);
  };

  /* ---------- battle choreography ---------- */
  const center = (e) => {
    const r = e.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };
  U.battleFX = (node, res) => {
    node.classList.add("battle", "res-" + res);
    const vs = node.querySelector(".vs"),
      box = node.querySelector(".res");
    const at = reduced() ? 80 : 560;
    setTimeout(() => {
      if (!node.isConnected) return;
      const [x, y] = center(vs || node);
      FX.sparks(x, y, 46);
      FX.burst(x, y, { n: 26, speed: 380, size: 14 });
      FX.ring(x, y, "white", 240, 0.7, 5);
      setTimeout(() => FX.ring(x, y, res === "tie" ? "cyan" : res === "win" ? "lime" : "pink", 340, 1, 3), 120);
      FX.shake(node, 12);
      FX.shake(document.querySelector(".wrap"), 6, 380);
      node.classList.add("hit");
      const [bx, by] = center(box || node);
      if (res === "win") {
        FX.confetti(2.6, 130);
        FX.burst(bx, by, { n: 34, speed: 260, colors: ["gold", "lime", "pink"] });
      } else if (res === "lose") {
        FX.smoke(x, y + 20, 26);
        FX.embers(2.6, 46);
      } else {
        [0, 420, 840].forEach((d) =>
          setTimeout(() => {
            if (node.isConnected) FX.ring(bx, by, "cyan", 260, 1.1, 3);
          }, d),
        );
        FX.burst(x, y, { n: 24, speed: 200, colors: ["cyan", "white"], gravity: 0 });
      }
    }, at);
  };

  /* ---------- reward choreography ---------- */
  U.rewardFX = (node, list, xpEach, levelUp) => {
    node.classList.add("reward");
    const rays = document.createElement("div");
    rays.className = "rays";
    node.prepend(rays);
    const go = () => {
      if (!node.isConnected) return;
      const [x, y] = center(node);
      FX.burst(x, y, { n: 60, speed: 480, size: 15, colors: ["gold", "cyan", "pink", "lime", "white"] });
      FX.ring(x, y, "gold", 300, 0.9, 4);
      FX.sparks(x, y, 24, { colors: ["gold", "white"] });
      const rows = [...node.querySelectorAll(".ur")].slice(0, 6);
      rows.forEach((r, i) =>
        setTimeout(() => {
          if (!node.isConnected) return;
          const b = r.getBoundingClientRect();
          if (b.bottom < 0 || b.top > innerHeight) return;
          FX.text(b.right - 50, b.top + 14, "+" + xpEach[i] + " XP", "#32cd32", 22);
          FX.burst(b.left + 36, b.top + b.height / 2, { n: 12, speed: 160, size: 8, gravity: 0, colors: ["gold", "white"] });
        }, 150 + i * 160),
      );
      if (levelUp) {
        FX.confetti(2.2, 80);
        setTimeout(() => node.isConnected && FX.ring(x, y, "pink", 380, 1.1, 4), 250);
      }
    };
    setTimeout(go, reduced() ? 60 : 380);
  };

  /* keep carousel / selection feedback hook */
  U.fit = () => {};
  return U;
})();
