# AI-Based ESP32 Virtual Lab

A browser-based electronics playground for ESP32 — drag parts onto a canvas, wire them up, write Arduino code (or generate it with AI / build it with Blocks), hit Run, and watch it actually work. No hardware needed.

## What it does

- **Canvas simulator** — place ESP32, LEDs, buttons, servo, buzzer, potentiometer and wire them together like a real breadboard.
- **Code panel** — write Arduino-style code, run it against the simulated pins.
- **Blocks mode** — visual programming with Blockly for anyone not comfortable with code yet.
- **AI Chat** — describe a circuit in plain English and it builds the components + wiring + code for you.
- **Check Wiring** — catches wiring mistakes before you run.
- **Save / Load** — pick up your circuit later.

## Tech stack

React + Vite for the shell, a hand-built canvas/SVG engine underneath for placement, wiring, and the Arduino interpreter.

## Running it locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

For a production build:

```bash
npm run build
npm run preview
```

## AI Chat backend

The "Generate Circuit" feature calls a local backend at `http://127.0.0.1:8000/generate`. Run that backend separately if you want to use AI-generated circuits — everything else works without it.

## Status

Actively being built. Issues and PRs welcome.
