"use strict";
/* Reusable canvas particle engine (no dependencies).
   Two layers share one engine/loop: "bg" (ambient, behind the UI) and "fg" (effects, above everything).
   All glow is additive ('lighter'); smoke/confetti use normal blending. */
const FX = (() => {
  const mq = window.matchMedia
    ? matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };
  const lowEnd =
    (navigator.hardwareConcurrency || 8) <= 4 ||
    (navigator.deviceMemory || 8) <= 4;
  const E = {
    reduced: mq.matches,
    frames: 0,
    q: 1, // quality multiplier for particle counts
    mouse: { x: 0, y: 0 },
  };
  if (mq.addEventListener)
    mq.addEventListener("change", () => {
      E.reduced = mq.matches;
      initAmbient();
    });
  const COL = {
    cyan: [0, 255, 255],
    lime: [50, 205, 50],
    pink: [255, 105, 180],
    gold: [255, 196, 0],
    white: [255, 255, 255],
    green: [120, 255, 140],
    orange: [255, 130, 30],
    smoke: [30, 34, 30],
  };
  const sprites = {};
  const sprite = (name, soft) => {
    const k = name + (soft ? "s" : "");
    if (sprites[k]) return sprites[k];
    const c = document.createElement("canvas"),
      s = 64;
    c.width = c.height = s;
    const g = c.getContext("2d"),
      [r, gg, b] = COL[name],
      gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    if (soft) {
      gr.addColorStop(0, `rgba(${r},${gg},${b},.55)`);
      gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    } else {
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(0.18, `rgba(${r},${gg},${b},.95)`);
      gr.addColorStop(0.5, `rgba(${r},${gg},${b},.25)`);
      gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    }
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    return (sprites[k] = c);
  };
  const rnd = (a, b) => a + Math.random() * (b - a),
    pickc = (a) => a[Math.floor(Math.random() * a.length)];

  class Layer {
    constructor(z, maxDpr) {
      this.c = document.createElement("canvas");
      this.c.className = "fx-canvas";
      this.c.setAttribute("aria-hidden", "true");
      this.c.style.cssText = `position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:${z}`;
      this.x = this.c.getContext("2d");
      this.p = [];
      this.maxDpr = maxDpr;
      this.dirty = true;
    }
    size() {
      const d = Math.min(window.devicePixelRatio || 1, this.maxDpr);
      this.d = d;
      this.w = innerWidth;
      this.h = innerHeight;
      this.c.width = Math.max(1, Math.round(this.w * d));
      this.c.height = Math.max(1, Math.round(this.h * d));
      this.dirty = true;
    }
  }
  const bg = new Layer(0, lowEnd ? 1 : 1.5),
    fg = new Layer(2000, lowEnd ? 1 : 1.5);
  let cap = 650;
  const setQuality = () => {
    const small = Math.min(innerWidth, innerHeight) < 640;
    E.q = (small ? 0.5 : 1) * (lowEnd ? 0.6 : 1) * (E.adapt || 1);
    cap = Math.round(650 * E.q);
  };

  /* ---------- ambient ---------- */
  function initAmbient() {
    setQuality();
    const n = Math.round((innerWidth * innerHeight) / 17000);
    const count = Math.max(
      12,
      Math.min(90, Math.round(n * E.q * (E.reduced ? 0.35 : 1))),
    );
    const cols = ["cyan", "lime", "pink", "green", "lime", "cyan"];
    bg.p = Array.from({ length: count }, () => {
      const z = rnd(0.2, 1);
      return {
        x: rnd(0, innerWidth),
        y: rnd(0, innerHeight),
        z,
        r: 3 + z * 9,
        vx: rnd(-8, 8) * z,
        vy: rnd(-14, -3) * z,
        ph: rnd(0, 6.28),
        fs: rnd(0.6, 1.8),
        s: sprite(pickc(cols)),
        dust: Math.random() < 0.3,
      };
    });
  }
  function drawBg(dt, t) {
    const { x: g, w, h, d } = bg;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = "lighter";
    const mx = E.mouse.x - 0.5,
      my = E.mouse.y - 0.5,
      sp = E.reduced ? 0 : 1;
    for (const p of bg.p) {
      p.x += p.vx * dt * sp + Math.sin(t * 0.0006 * p.fs + p.ph) * 6 * p.z * dt * sp;
      p.y += p.vy * dt * sp;
      if (p.y < -20) {
        p.y = h + 20;
        p.x = rnd(0, w);
      }
      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      const tw = 0.5 + 0.5 * Math.sin(t * 0.002 * p.fs + p.ph),
        a = (p.dust ? 0.3 : 0.45 + 0.55 * tw) * (0.4 + p.z * 0.6),
        px = p.x - mx * 40 * p.z * sp,
        py = p.y - my * 40 * p.z * sp;
      g.globalAlpha = a;
      g.drawImage(p.s, px - p.r, py - p.r, p.r * 2, p.r * 2);
    }
    g.globalAlpha = 1;
  }

  /* ---------- foreground particles ---------- */
  const add = (o) => {
    if (fg.p.length >= cap) return;
    fg.p.push(o);
  };
  const num = (n) => Math.max(1, Math.round(n * E.q));

  function drawFg(dt) {
    const { x: g, w, h, d } = fg;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, w, h);
    const a = fg.p;
    let j = 0;
    for (let i = 0; i < a.length; i++) {
      const p = a[i];
      p.t += dt;
      if (p.t >= p.life) continue;
      a[j++] = p;
      const k = p.t / p.life;
      p.vy += (p.g || 0) * dt;
      if (p.drag) {
        const f = Math.pow(p.drag, dt * 60);
        p.vx *= f;
        p.vy *= f;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.sway) p.x += Math.sin(p.t * p.sway + p.ph) * 30 * dt;
      const fade = p.fadeIn ? Math.min(1, p.t / p.fadeIn) : 1,
        al = (p.a == null ? 1 : p.a) * (1 - k * k) * fade;
      switch (p.type) {
        case "ring": {
          const r = p.r0 + (p.r1 - p.r0) * (1 - Math.pow(1 - k, 3));
          g.globalCompositeOperation = "lighter";
          g.strokeStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${al * 0.25})`;
          g.lineWidth = p.lw * 3 * (1 - k * 0.7);
          g.beginPath();
          g.arc(p.x, p.y, r, 0, 6.2832);
          g.stroke();
          g.strokeStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${al})`;
          g.lineWidth = p.lw * (1 - k * 0.7);
          g.stroke();
          break;
        }
        case "spark": {
          g.globalCompositeOperation = "lighter";
          g.strokeStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${al})`;
          g.lineWidth = p.size * (1 - k);
          g.lineCap = "round";
          g.beginPath();
          g.moveTo(p.x, p.y);
          g.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
          g.stroke();
          break;
        }
        case "rect": {
          g.globalCompositeOperation = "source-over";
          p.rot += p.vr * dt;
          g.save();
          g.translate(p.x, p.y);
          g.rotate(p.rot);
          g.scale(1, Math.cos(p.t * p.flip + p.ph));
          g.globalAlpha = Math.min(1, al * 1.4);
          g.fillStyle = p.col;
          g.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
          g.restore();
          g.globalAlpha = 1;
          break;
        }
        case "text": {
          g.globalCompositeOperation = "source-over";
          g.globalAlpha = Math.min(1, (1 - k) * 2.2) * fade;
          g.font = `800 ${p.size}px Roboto,"Segoe UI",system-ui,sans-serif`;
          g.textAlign = "center";
          g.lineWidth = 4;
          g.strokeStyle = "rgba(0,0,0,.75)";
          g.strokeText(p.str, p.x, p.y);
          g.fillStyle = p.col;
          g.fillText(p.str, p.x, p.y);
          g.globalAlpha = 1;
          break;
        }
        default: {
          const s = p.size * (p.grow ? 1 + k * p.grow : 1 - k * 0.5);
          g.globalCompositeOperation = p.add === false ? "source-over" : "lighter";
          g.globalAlpha = Math.max(0, al * (p.a == null ? 1 : 1));
          g.drawImage(p.s, p.x - s, p.y - s, s * 2, s * 2);
          g.globalAlpha = 1;
        }
      }
    }
    a.length = j;
    g.globalCompositeOperation = "source-over";
  }

  /* ---------- loop ---------- */
  let last = 0,
    raf = 0,
    slow = 0,
    fast = 0;
  function loop(now) {
    raf = 0;
    if (document.hidden) {
      last = 0;
      return;
    }
    let dt = last ? (now - last) / 1000 : 0.016;
    last = now;
    if (dt > 0.1) dt = 0.1;
    E.frames++;
    // adaptive quality: shed particles when frames are consistently slow
    if (dt > 0.034) {
      if (++slow > 40 && (E.adapt || 1) > 0.35) {
        E.adapt = (E.adapt || 1) * 0.7;
        slow = 0;
        initAmbient();
      }
    } else if (slow > 0) slow--;
    fast = 0;
    drawBg(dt, now);
    if (fg.p.length || fg.dirty) {
      drawFg(dt);
      fg.dirty = fg.p.length > 0;
    }
    raf = requestAnimationFrame(loop);
  }
  const start = () => {
    if (!raf && !document.hidden) raf = requestAnimationFrame(loop);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    } else start();
  });
  let rt;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      bg.size();
      fg.size();
      initAmbient();
    }, 150);
  });
  addEventListener(
    "pointermove",
    (e) => {
      E.mouse.x = e.clientX / innerWidth;
      E.mouse.y = e.clientY / innerHeight;
    },
    { passive: true },
  );

  /* ---------- public emitters ---------- */
  const glow = (x, y, o) =>
    add(
      Object.assign(
        { type: "glow", x, y, vx: 0, vy: 0, t: 0, life: 1, size: 8 },
        o,
      ),
    );
  Object.assign(E, {
    init() {
      if (bg.c.isConnected) return;
      document.body.prepend(bg.c);
      document.body.append(fg.c);
      bg.size();
      fg.size();
      initAmbient();
      start();
    },
    count: () => fg.p.length,
    ambientCount: () => bg.p.length,
    COL,
    /* radial burst of glowing particles */
    burst(x, y, o = {}) {
      const n = num(o.n || 40),
        cols = o.colors || ["cyan", "lime", "pink", "gold"];
      for (let i = 0; i < n; i++) {
        const a = rnd(0, 6.2832),
          v = rnd(0.3, 1) * (o.speed || 300);
        glow(x, y, {
          s: sprite(pickc(cols)),
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          g: o.gravity == null ? 120 : o.gravity,
          drag: 0.96,
          size: rnd(0.6, 1) * (o.size || 12),
          life: rnd(0.5, 1) * (o.life || 1),
        });
      }
    },
    sparks(x, y, n = 30, o = {}) {
      const cols = o.colors || ["white", "gold", "cyan", "orange"];
      for (let i = 0; i < num(n); i++) {
        const a = rnd(0, 6.2832),
          v = rnd(150, 700);
        add({
          type: "spark",
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          g: 500,
          drag: 0.94,
          t: 0,
          life: rnd(0.35, 0.8),
          size: rnd(1.5, 3.5),
          c: COL[pickc(cols)],
        });
      }
    },
    ring(x, y, color = "cyan", max = 220, dur = 0.8, lw = 4) {
      add({
        type: "ring",
        x,
        y,
        vx: 0,
        vy: 0,
        t: 0,
        life: dur,
        r0: 6,
        r1: max,
        lw,
        c: COL[color],
      });
    },
    confetti(duration = 2.4, n = 120) {
      if (E.reduced) return;
      const cols = ["#ffc400", "#32cd32", "#ff69b4", "#00ffff", "#ffe27a"],
        total = num(n);
      for (let i = 0; i < total; i++)
        setTimeout(
          () => {
            if (document.hidden) return;
            add({
              type: "rect",
              x: rnd(0, innerWidth),
              y: rnd(-40, -10),
              vx: rnd(-60, 60),
              vy: rnd(120, 340),
              g: 80,
              t: 0,
              life: rnd(2.2, 3.8),
              size: rnd(3, 6),
              rot: rnd(0, 6),
              vr: rnd(-6, 6),
              flip: rnd(4, 10),
              ph: rnd(0, 6),
              col: pickc(cols),
              sway: rnd(1, 3),
              a: 1,
            });
          },
          rnd(0, duration * 1000),
        );
    },
    smoke(x, y, n = 24) {
      for (let i = 0; i < num(n); i++)
        glow(x + rnd(-60, 60), y + rnd(-20, 30), {
          s: sprite("smoke", true),
          add: false,
          vx: rnd(-25, 25),
          vy: rnd(-70, -20),
          drag: 0.99,
          size: rnd(30, 60),
          grow: 1.2,
          a: 0.9,
          life: rnd(1.4, 2.6),
          fadeIn: 0.2,
        });
    },
    embers(duration = 2.5, n = 40) {
      if (E.reduced) return;
      for (let i = 0; i < num(n); i++)
        setTimeout(
          () => {
            if (document.hidden) return;
            glow(rnd(0, innerWidth), rnd(-20, 0), {
              s: sprite(Math.random() < 0.6 ? "orange" : "pink"),
              vx: rnd(-30, 30),
              vy: rnd(60, 160),
              size: rnd(3, 7),
              life: rnd(2, 3.4),
              sway: rnd(1, 3),
              ph: rnd(0, 6),
              a: 0.9,
            });
          },
          rnd(0, duration * 1000),
        );
    },
    text(x, y, str, color = "#32cd32", size = 22) {
      add({
        type: "text",
        x,
        y,
        vx: rnd(-10, 10),
        vy: -70,
        drag: 0.99,
        t: 0,
        life: 1.7,
        str,
        col: color,
        size,
      });
    },
    /* click / selection sparkle */
    sparkle(x, y, n = 10) {
      E.burst(x, y, {
        n,
        speed: 160,
        size: 7,
        life: 0.6,
        gravity: 0,
        colors: ["cyan", "pink", "lime", "white"],
      });
    },
    trail(x, y) {
      glow(x + rnd(-4, 4), y + rnd(-4, 4), {
        s: sprite(pickc(["cyan", "lime", "pink"])),
        vx: rnd(-12, 12),
        vy: rnd(-24, -4),
        size: rnd(4, 8),
        life: 0.55,
      });
    },
    /* quick shake of an element via Web Animations API */
    shake(elm, px = 10, ms = 420) {
      if (E.reduced || !elm || !elm.animate) return;
      const f = [];
      for (let i = 0; i <= 8; i++) {
        const k = 1 - i / 8;
        f.push({
          transform: `translate(${rnd(-px, px) * k}px,${rnd(-px, px) * k}px) rotate(${rnd(-0.6, 0.6) * k}deg)`,
        });
      }
      f.push({ transform: "none" });
      elm.animate(f, { duration: ms, easing: "ease-out" });
    },
  });
  return E;
})();
if (document.body) FX.init();
else document.addEventListener("DOMContentLoaded", () => FX.init());
