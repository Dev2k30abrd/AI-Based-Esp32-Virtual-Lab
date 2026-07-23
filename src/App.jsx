import { useEffect, useRef, useState } from "react";
import useLegacyEngine from "./hooks/useLegacyEngine.js";

const COMPONENT_NAMES = [
  "ESP32",
  "LED",
  "Button",
  "Servo",
  "Buzzer",
  "Potentiometer",
];

const MODEL_OPTIONS = [
  {
    value: "nvidia/nemotron-3-super-120b-a12b:free",
    label: "🚀 Nemotron 3 Super 120B (Free)",
  },
  { value: "openai/gpt-oss-120b", label: "🧠 GPT OSS 120B" },
  { value: "qwen/qwen3-32b", label: "⚡ Qwen 3 32B" },
  { value: "google/gemma-3-27b-it", label: "💎 Gemma 3 27B" },
];

// clamp helper for panel resizing
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export default function App() {
  // Boots the original vanilla-JS canvas / wiring / Arduino simulator
  // engine once this component's markup has been rendered to the DOM.
  useLegacyEngine();

  const [partsOpen, setPartsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adOpen, setAdOpen] = useState(true);

  const [rightWidth, setRightWidth] = useState(380);
  const [serialHeight, setSerialHeight] = useState(180);

  const partsLauncherRef = useRef(null);
  const menuRef = useRef(null);

  // close popovers on outside click
  useEffect(() => {
    function handleOutsideClick(e) {
      if (partsLauncherRef.current && !partsLauncherRef.current.contains(e.target)) {
        setPartsOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Legacy engine (app.js) attaches its own click listener to each
  // .component div to actually place it on canvas. We just close the
  // popover after that click bubbles up here - no legacy code touched.
  function handlePartsPanelClick(e) {
    if (e.target.classList.contains("component")) {
      setPartsOpen(false);
    }
  }

  // ---------------------------------------
  // Wokwi-style panel resizing (drag edges)
  // ---------------------------------------

  function startResizeRight(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;

    function onMove(ev) {
      const next = clamp(startWidth + (startX - ev.clientX), 280, 720);
      setRightWidth(next);
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function startResizeSerial(e) {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = serialHeight;

    function onMove(ev) {
      const next = clamp(startHeight + (startY - ev.clientY), 90, 500);
      setSerialHeight(next);
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div id="appRoot" className="app-root">
      {/* ================= HEADER (company branded) ================= */}
      <header className="topbar">
        <a
          className="logo"
          href="https://www.stembotix.com/"
          target="_blank"
          rel="noopener noreferrer"
          title="STEMbotix - AI, Robotics & STEM Education"
        >
          <div className="logo-mark">S</div>
          <div className="logo-text">
            <h2>STEMbotix</h2>
            <span>Virtual Lab · AI, Robotics &amp; STEM Education</span>
          </div>
        </a>

        <div className="top-buttons">
          <button id="runBtn" className="green-btn">
            ▶ Run
          </button>
          <button id="resetBtn">↺ Reset</button>

          {/* Everything else lives behind the ⋮ menu, Wokwi-style.
              Buttons stay mounted always (just hidden via CSS) since
              the legacy engine wires them up once by id at load time. */}
          <div className="header-menu" ref={menuRef}>
            <button
              className="header-menu-btn"
              title="More actions"
              onClick={() => setMenuOpen((v) => !v)}
            >
              ⋮
            </button>

            <div className={"header-menu-panel" + (menuOpen ? " open" : "")}>
              <button id="checkBtn" onClick={() => setMenuOpen(false)}>
                ✔ Check Wiring
              </button>
              <button id="undoBtn" title="Undo (Ctrl+Z)" disabled onClick={() => setMenuOpen(false)}>
                ↩ Undo
              </button>
              <button id="redoBtn" title="Redo (Ctrl+Y)" disabled onClick={() => setMenuOpen(false)}>
                ↪ Redo
              </button>
              <button id="saveBtn" onClick={() => setMenuOpen(false)}>
                💾 Save
              </button>
              <button id="loadBtn" onClick={() => setMenuOpen(false)}>
                📂 Load
              </button>
              <button id="fullscreenBtn" title="Toggle fullscreen" onClick={() => setMenuOpen(false)}>
                ⛶ Fullscreen
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= AI BAR ================= */}
      <section className="ai-bar">
        <input
          id="promptInput"
          type="text"
          placeholder="Describe your circuit... Example: Blink LED on GPIO 5 every second"
        />

        <select id="modelSelect" defaultValue={MODEL_OPTIONS[0].value}>
          {MODEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button id="generateBtn">🤖 Generate Circuit</button>
        <button id="buildBtn">⚡ Build Circuit</button>
      </section>

      {/* ================= MAIN ================= */}
      <main className="workspace">
        {/* CENTER CANVAS */}
        <section className="canvas-section">
          <div id="canvasViewport">
            <div id="canvas">
              <div className="canvas-grid"></div>
            </div>
          </div>

          {/* Wokwi-style floating "+ Add Component" button + scrollable popover */}
          <div className="parts-launcher" ref={partsLauncherRef}>
            <button
              className="add-component-btn"
              onClick={() => setPartsOpen((v) => !v)}
            >
              ➕ Add Component
            </button>

            <div
              className={"component-popover" + (partsOpen ? " open" : "")}
              id="componentList"
              onClick={handlePartsPanelClick}
            >
              <div className="component-popover-title">Parts</div>
              <div className="component-popover-list">
                {COMPONENT_NAMES.map((name) => (
                  <div className="component" key={name}>
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="zoom-controls">
            <button id="zoomOutBtn" title="Zoom out">
              −
            </button>
            <span id="zoomLevelLabel">100%</span>
            <button id="zoomInBtn" title="Zoom in">
              +
            </button>
            <button id="zoomResetBtn" title="Reset view">
              ⤢
            </button>
          </div>

          {/* Company advertisement card */}
          {adOpen && (
            <a
              className="stembotix-ad"
              href="https://www.stembotix.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span
                className="stembotix-ad-close"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAdOpen(false);
                }}
              >
                ✕
              </span>
              🤖 Learn robotics for real - explore <b>STEMbotix</b> kits &amp; courses →
            </a>
          )}
        </section>

        {/* Drag handle: resize code/serial panel width, like Wokwi */}
        <div className="v-resizer" onMouseDown={startResizeRight} />

        {/* RIGHT PANEL */}
        <aside className="right-panel" style={{ width: rightWidth, flexBasis: rightWidth }}>
          <div className="tabs">
            <button className="tab active">Code</button>
            <button className="tab">Examples</button>
            <button className="tab">Board Info</button>
          </div>

          <textarea
            id="codeEditor"
            spellCheck="false"
            placeholder="// Arduino code will appear here"
          ></textarea>
        </aside>
      </main>

      {/* Drag handle: resize serial monitor height, like Wokwi */}
      <div className="h-resizer" onMouseDown={startResizeSerial} />

      {/* ================= SERIAL MONITOR ================= */}
      <footer className="serial-monitor" style={{ height: serialHeight }}>
        <div className="serial-header">
          <span>Serial Monitor</span>
          <button id="clearSerial">Clear</button>
        </div>

        <div id="serialOutput">Virtual Lab Started...</div>
      </footer>
    </div>
  );
}
