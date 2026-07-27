# Art of Lekkerrrr

Rock Paper Scissors browser game with customizable hand figures, animated battle UI, and score tracking.

## Play

Open `index.html` in a browser (no server required).

## UI & Features

### 1. Hero Header
- Animated title **"Art of Lekkerrrr"**
- Subtitle: **"Enter the Hero Arena"**
- Fade/slide entrance animations

### 2. Battle Rules
Cards explaining combat logic:
- Rock crushes Scissors
- Scissors cuts Paper
- Paper covers Rock
- Identical gestures result in a Tie

### 3. Hand Variants
Three visual styles per gesture:
- **Plain** — Classic, no-frills pose
- **Light** — Bright, luminous variant
- **Dark** — Shadowy, intense variant

### 4. Choose Your Hand (Main Control Panel)
- **Gesture buttons**: Rock / Paper / Scissor
- **Variant chips**: Plain / Light / Dark
- **Figure grid**: 12 hand figure thumbnails per gesture-variant combo; tap one to select
- **Details button** — opens Figure Details Modal
- **FIGHT! button** — starts a battle against CPU

### 5. Battle Result Modal
- Side-by-side comparison of **You vs CPU**
- Shows selected gestures, variants, and figure numbers
- Displays animated result: **YOU WIN / YOU LOSE / IT'S A TIE**
- Play Again — resets selection to default
- Reset Scores — clears win/loss/tie counters

### 6. Figure Details Modal
- Large preview of the selected figure
- Lists current selection:
  - Gesture
  - Variant
  - Figure number

### 7. Scoreboard
Live counters for:
- **Wins**
- **Losses**
- **Ties**
- **Reset Scores** button to zero out all counters

## Interaction & Accessibility
- Click or keyboard (Enter / Space) to select gestures, variants, and figures
- **Escape** closes any open modal
- Battle modal closes when clicking outside the content area
- Controls are disabled while modals are inactive
- Scroll reveal animations on cards and rule tiles using IntersectionObserver

## Visual Design
- Dark theme with neon cyan, magenta, and lime accents
- Background image (`assets/background.png`)
- Comic Neue font from Google Fonts
- Animated borders, hover shadows, bounce-in modals, and pulse effects
- Responsive layout scaling down for mobile (`max-width: 900px` and `600px`)

## Assets
- `assets/web_icon.png` — browser favicon
- `assets/background.png` — page background
- `assets/{gesture}/{variant}/` — 12 PNG files each for rock/paper/scissor across plain/light/dark variants

## Tech Stack
- Single-file HTML (`index.html`)
- Inline CSS, no build step
- Vanilla JavaScript (no frameworks or libraries)
- Google Fonts CDN
