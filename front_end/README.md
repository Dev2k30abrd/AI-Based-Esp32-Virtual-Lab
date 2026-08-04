# STEMbotix Virtual Lab — React Edition

This is your original vanilla-JS project (`Frontend.zip`) restructured as a **Vite + React** app.

## How to run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

For a production build:

```bash
npm run build
npm run preview
```

> Note: `ai.js` still points at `http://127.0.0.1:8000/generate` for the "Generate Circuit"
> AI feature, same as your original code — make sure that backend is running if you want
> to use it.

## What changed vs. the original

- **`index.html` → `src/App.jsx`.** The header, AI bar, component panel, canvas, code editor
  and serial monitor are now JSX, rendered by React. All the original element `id`s and
  `class`es (`#canvas`, `#codeEditor`, `#serialOutput`, `.component`, `.pin`, etc.) were kept
  **exactly the same**, since the simulator engine looks up the DOM by those.
- **State/build tooling**: added `package.json`, `vite.config.js` — a standard Vite React
  setup (chosen since you asked for Vite + React).
- **`style.css`** moved to `src/style.css` and imported from `main.jsx`, unchanged otherwise.

## Why the simulator engine itself wasn't rewritten as React state

Your app's core (`app.js`, `canvas/*`, `simulator/*`, `components/*`, `ai.js`, `autobuild.js`,
`config/components.js` — about 5,000 lines) is a hand-built canvas/SVG simulator: drag & drop
placement, a wire-drawing engine, a custom Arduino tokenizer → parser → interpreter, a GPIO/logic
engine, and an AI circuit auto-builder. It's fundamentally **imperative DOM code** reading and
mutating `<svg>`/`<div>` elements directly (`pin.closest("svg")`, `.dataset.state`, manually drawn
wire paths, etc.), not data that naturally maps to React's re-render model.

Rewriting all of that as idiomatic React (state in `useState`/`useReducer`, wires as
declarative SVG driven by component state, the interpreter dispatching through React state
updates instead of direct DOM writes) is a legitimate next step, but it's a substantial,
bug-prone rewrite of thousands of lines of working logic — effectively re-architecting the whole
simulator, not "converting to React."

So this version keeps your **original engine 100% intact and unmodified** (just cleaned of
Windows line endings), served as-is from `public/legacy/` in the exact same script order your
`index.html` used, and loaded by a small hook (`src/hooks/useLegacyEngine.js`) once React has
rendered the page. React owns the shell/layout; your existing simulator owns the canvas exactly
like it did before. Everything — dragging components, wiring pins, Run/Reset/Check Wiring,
Save/Load, the Arduino interpreter, the AI "Generate Circuit" flow — works the same as your
original `Frontend/` folder.

## If you want the "real" React rewrite later

That would mean:
- Placed components & their positions → React state (`useState`/`zustand`, which is already in
  your `package.json`), rendered as `<PlacedComponent>` components instead of raw DOM nodes.
- Wires → an SVG layer whose `<path>`s are computed from that same state instead of imperative
  `drawWire`/`updateWire` DOM calls.
- The tokenizer/parser/interpreter/logic-engine (the actual Arduino simulation logic) can move
  over almost as-is — that part is already mostly pure logic, not DOM manipulation.

Happy to do that as a follow-up step if/when you want it — just say the word.
