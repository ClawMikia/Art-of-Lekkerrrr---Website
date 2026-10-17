# Art of Lekkerrrr

A browser-based Rock-Paper-Scissors game with a reward and trophy system.

## Features

- Choose your hand: **Rock**, **Paper**, or **Scissors**
- Select a variant: **Plain**, **Light**, or **Dark**
- Pick a figure number (1–12)
- Battle against the CPU with instant results
- Persistent score tracking (Wins / Losses / Ties)
- Unlock milestones, achievements, medals, and badges
- Level-up XP system with ranks
- Trophy room to view and filter rewards
- Keyboard shortcuts for fast play
- Responsive design
- **Neon Hero Arena+** 3D-style UI: glass panels, pointer-tilt cards with specular highlight, 3D coverflow figure picker, camera-style page transitions, popping dialogs
- Canvas particle engine: ambient fireflies with mouse parallax, battle clash (sparks, shockwave, screen shake, confetti / smoke / shimmer rings), reward bursts with floating +XP, click sparkles
- Honors `prefers-reduced-motion`; particle counts scale down on small screens and hidden tabs pause rendering

## How to Play

1. Open `index.html` in a browser.
2. Select a **Gesture** (Rock / Paper / Scissor).
3. Select a **Variant** (Plain / Light / Dark).
4. Pick a **Figure** (1–12).
5. Click **Fight!** (or press `Enter` / `F`) to battle the CPU.

## Controls

### Main Game

| Key | Action |
|-----|--------|
| R / P / S | Rock / Paper / Scissor |
| 1 / 2 / 3 | Plain / Light / Dark |
| ← / → | Previous / next figure |
| Enter or F | Fight |
| D | Details |
| X | Reset scores |
| T | Trophy Room |
| ? | Show shortcuts |
| Esc | Close a dialog |

### Battle Result

| Key | Action |
|-----|--------|
| A | Play again |
| X | Reset scores |

### Trophy Room

| Key | Action |
|-----|--------|
| ← / → | Previous / next tab |
| 1 / 2 / 3 | All / Unlocked / Locked |
| / | Search rewards |
| B | Back to game |
| Esc | Close a dialog |

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (no build, no CDN, no 3D engine; CSS perspective + canvas 2D)

## Files

- `index.html` — Main game screen
- `trophy-room.html` — Trophy / rewards gallery
- `css/style.css` — Styles
- `js/common.js` — Shared utilities and modal system
- `js/fx.js` — Canvas particle engine (`FX`)
- `js/ui.js` — Tilt, ripples, number ticks, page transitions, battle/reward choreography (`UI`)
- `js/stats.js` — Statistics and reward logic
- `js/rewards-data.js` — Reward definitions
- `js/main.js` — Main game flow
- `js/trophy.js` — Trophy room logic
