import { useEffect, useRef, useState } from "react";
import useLegacyEngine from "./hooks/useLegacyEngine.js";
import BlocklyPanel from "./components/BlocklyPanel.jsx";
import AIChatPanel from "./components/AIChatPanel.jsx";
import { PART_ICONS } from "./partIcons.jsx";
import {
  IconPlay,
  IconStop,
  IconReset,
  IconCheck,
  IconUndo,
  IconRedo,
  IconSave,
  IconLoad,
  IconExpand,
  IconShrink,
  IconBot,
  IconPuzzle,
  IconCode,
  IconPlus,
  IconMinus,
  IconFrame,
  IconClose,
  IconWrench,
  IconMore,
  IconChip,
} from "./icons.jsx";

const COMPONENT_NAMES = [
  "ESP32",
  "LED",
  "Button",
  "Servo",
  "Buzzer",
  "Potentiometer",
];

// clamp helper for panel resizing/zoom
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

  // Four independent panels: Canvas (always on) + AI Chat + Blocks + Code.
  // Any panel can be toggled off, and any two shown together get a
  // drag handle between them. All start closed - only the canvas
  // shows by default, like Wokwi/Tinkercad's blank workspace.
  const [showAIChat, setShowAIChat] = useState(false);
  const [showBlockly, setShowBlockly] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const [chatWidth, setChatWidth] = useState(380);
  const [blocklyWidth, setBlocklyWidth] = useState(440);
  const [rightWidth, setRightWidth] = useState(420);
  const [codeFontSize, setCodeFontSize] = useState(15);

  // Which panel (if any) is currently the one fullscreen element.
  const [fullscreenTarget, setFullscreenTarget] = useState(null);

  const partsLauncherRef = useRef(null);
  const menuRef = useRef(null);
  const canvasSectionRef = useRef(null);
  const chatWrapperRef = useRef(null);
  const blocklyWrapperRef = useRef(null);
  const rightPanelRef = useRef(null);

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

  // Track which of the 3 panels (if any) is the fullscreen element,
  // so each panel's own button can show "exit fullscreen" correctly.
  useEffect(() => {
    function onFsChange() {
      const el = document.fullscreenElement;
      if (el && el === canvasSectionRef.current) setFullscreenTarget("canvas");
      else if (el && el === chatWrapperRef.current) setFullscreenTarget("chat");
      else if (el && el === blocklyWrapperRef.current) setFullscreenTarget("blockly");
      else if (el && el === rightPanelRef.current) setFullscreenTarget("code");
      else setFullscreenTarget(null);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function togglePanelFullscreen(ref) {
    const el = ref.current;
    if (!el) return;

    if (document.fullscreenElement === el) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen().catch((err) => {
        console.error("Fullscreen request failed:", err);
      });
    }
  }

  // Legacy engine (app.js) attaches its own click listener to each
  // .component div to actually place it on canvas. We just close the
  // popover after that click bubbles up here - no legacy code touched.
  function handlePartsPanelClick(e) {
    if (e.target.closest(".component")) {
      setPartsOpen(false);
    }
  }

  // ---------------------------------------
  // Wokwi-style panel resizing (drag edges)
  // ---------------------------------------

  function startResizeChat(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = chatWidth;

    function onMove(ev) {
      setChatWidth(clamp(startWidth + (ev.clientX - startX), 300, 640));
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function startResizeBlockly(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = blocklyWidth;

    function onMove(ev) {
      setBlocklyWidth(clamp(startWidth + (startX - ev.clientX), 300, 900));
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function startResizeRight(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;

    function onMove(ev) {
      setRightWidth(clamp(startWidth + (startX - ev.clientX), 300, 900));
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  const [serialHeight, setSerialHeight] = useState(180);

  function startResizeSerial(e) {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = serialHeight;

    function onMove(ev) {
      setSerialHeight(clamp(startHeight + (startY - ev.clientY), 90, 500));
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  // Code panel font-size "zoom" - Ctrl+wheel, matching the zoom
  // gesture on the canvas and inside the Blocks workspace.
  function handleCodeWheelZoom(e) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setCodeFontSize((f) => clamp(f + (e.deltaY < 0 ? 1 : -1), 10, 34));
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
          <div className="logo-mark">
            <IconChip size={22} />
          </div>
          <div className="logo-text">
            <h2>STEMbotix</h2>
            <span>Virtual Lab · AI, Robotics &amp; STEM Education</span>
          </div>
        </a>

        <div className="top-buttons">
          <button id="runBtn" className="green-btn">
            <IconPlay size={15} /> Run
          </button>
          <button id="stopBtn" className="stop-btn" title="Stop the running simulation">
            <IconStop size={15} /> Stop
          </button>
          <button id="resetBtn">
            <IconReset size={15} /> Reset
          </button>

          <div className="panel-toggle-group">
            <button
              className={"panel-toggle-btn" + (showAIChat ? " active" : "")}
              onClick={() => setShowAIChat((v) => !v)}
              title="Show/hide the AI Chat panel"
            >
              <IconBot size={15} /> AI Chat
            </button>
            <button
              className={"panel-toggle-btn" + (showBlockly ? " active" : "")}
              onClick={() => setShowBlockly((v) => !v)}
              title="Show/hide the Blocks workspace"
            >
              <IconPuzzle size={15} /> Blocks
            </button>
            <button
              className={"panel-toggle-btn" + (showCode ? " active" : "")}
              onClick={() => setShowCode((v) => !v)}
              title="Show/hide the Code panel"
            >
              <IconCode size={15} /> Code
            </button>
          </div>

          {/* Everything else lives behind the ⋮ menu, Wokwi-style.
              Buttons stay mounted always (just hidden via CSS) since
              the legacy engine wires them up once by id at load time. */}
          <div className="header-menu" ref={menuRef}>
            <button
              className="header-menu-btn"
              title="More actions"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <IconMore size={16} />
            </button>

            <div className={"header-menu-panel" + (menuOpen ? " open" : "")}>
              <button id="checkBtn" onClick={() => setMenuOpen(false)}>
                <IconCheck size={14} /> Check Wiring
              </button>
              <button id="undoBtn" title="Undo (Ctrl+Z)" disabled onClick={() => setMenuOpen(false)}>
                <IconUndo size={14} /> Undo
              </button>
              <button id="redoBtn" title="Redo (Ctrl+Y)" disabled onClick={() => setMenuOpen(false)}>
                <IconRedo size={14} /> Redo
              </button>
              <button id="saveBtn" onClick={() => setMenuOpen(false)}>
                <IconSave size={14} /> Save
              </button>
              <button id="loadBtn" onClick={() => setMenuOpen(false)}>
                <IconLoad size={14} /> Load
              </button>
              <button id="fullscreenBtn" title="Toggle fullscreen (whole app)" onClick={() => setMenuOpen(false)}>
                <IconFrame size={14} /> Fullscreen
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN: 4 independent panels ================= */}
      <main className="workspace">
        {/* ---------- AI CHAT (optional, resizable) ---------- */}
        <section
          className={"chat-wrapper" + (showAIChat ? "" : " panel-collapsed")}
          ref={chatWrapperRef}
          style={
            showAIChat
              ? { width: chatWidth, flexBasis: chatWidth }
              : { width: 0, flexBasis: 0 }
          }
        >
          <div className="panel-header">
            <IconBot size={15} className="panel-header-icon" />
            <span className="panel-header-title">AI Chat</span>
            <button
              className="panel-fullscreen-btn"
              title="Fullscreen the AI Chat panel"
              onClick={() => togglePanelFullscreen(chatWrapperRef)}
            >
              {fullscreenTarget === "chat" ? <IconShrink size={14} /> : <IconExpand size={14} />}
            </button>
          </div>
          <div className="panel-body">
            <AIChatPanel visible={showAIChat} />
          </div>
        </section>

        {showAIChat && <div className="v-resizer" onMouseDown={startResizeChat} />}

        {/* ---------- CANVAS ---------- */}
        <section className="canvas-section" ref={canvasSectionRef}>
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
              <IconPlus size={15} /> Add Component
            </button>

            <div
              className={"component-popover" + (partsOpen ? " open" : "")}
              id="componentList"
              onClick={handlePartsPanelClick}
            >
              <div className="component-popover-title">Parts</div>
              <div className="component-popover-list">
                {COMPONENT_NAMES.map((name) => {
                  const Glyph = PART_ICONS[name];
                  return (
                    <div className="component" key={name}>
                      <span className="component-glyph">{Glyph && <Glyph />}</span>
                      <span className="component-label">{name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="zoom-controls">
            <button id="zoomOutBtn" title="Zoom out">
              <IconMinus size={15} />
            </button>
            <span id="zoomLevelLabel">100%</span>
            <button id="zoomInBtn" title="Zoom in">
              <IconPlus size={15} />
            </button>
            <button id="zoomResetBtn" title="Reset view">
              <IconFrame size={14} />
            </button>
          </div>

          <button
            className="panel-fullscreen-btn panel-fullscreen-floating"
            title="Fullscreen the canvas"
            onClick={() => togglePanelFullscreen(canvasSectionRef)}
          >
            {fullscreenTarget === "canvas" ? <IconShrink size={14} /> : <IconExpand size={14} />}
          </button>

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
                <IconClose size={11} />
              </span>
              <IconChip size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} />
              Learn robotics for real - explore <b>STEMbotix</b> kits &amp; courses →
            </a>
          )}
        </section>

        {/* ---------- BLOCKS (optional, resizable) ---------- */}
        {showBlockly && <div className="v-resizer" onMouseDown={startResizeBlockly} />}

        <section
          className={"blockly-wrapper" + (showBlockly ? "" : " panel-collapsed")}
          ref={blocklyWrapperRef}
          style={
            showBlockly
              ? { width: blocklyWidth, flexBasis: blocklyWidth }
              : { width: 0, flexBasis: 0 }
          }
        >
          <div className="panel-header">
            <IconPuzzle size={15} className="panel-header-icon" />
            <span className="panel-header-title">Blocks</span>
            <button
              className="panel-fullscreen-btn"
              title="Fullscreen the Blocks workspace"
              onClick={() => togglePanelFullscreen(blocklyWrapperRef)}
            >
              {fullscreenTarget === "blockly" ? <IconShrink size={14} /> : <IconExpand size={14} />}
            </button>
          </div>
          <div className="panel-body">
            <BlocklyPanel visible={showBlockly} />
          </div>
        </section>

        {/* ---------- CODE (optional, resizable) ---------- */}
        {showCode && <div className="v-resizer" onMouseDown={startResizeRight} />}

        <aside
          className={"right-panel" + (showCode ? "" : " panel-collapsed")}
          ref={rightPanelRef}
          style={
            showCode
              ? { width: rightWidth, flexBasis: rightWidth }
              : { width: 0, flexBasis: 0 }
          }
        >
          <div className="panel-header">
            <IconCode size={15} className="panel-header-icon" />
            <span className="panel-header-title">Code</span>

            <div className="code-zoom">
              <button onClick={() => setCodeFontSize((f) => clamp(f - 1, 10, 34))} title="Smaller text">
                <IconMinus size={12} />
              </button>
              <span>{codeFontSize}px</span>
              <button onClick={() => setCodeFontSize((f) => clamp(f + 1, 10, 34))} title="Bigger text">
                <IconPlus size={12} />
              </button>
            </div>

            <button
              className="build-circuit-btn"
              title="Build a circuit from this Arduino code - reads pinMode/.attach/tone/analogRead, no AI or API needed"
              onClick={() => {
                if (typeof window.buildCircuitFromArduino === "function") {
                  window.buildCircuitFromArduino();
                }
              }}
            >
              <IconWrench size={13} /> Build Circuit
            </button>

            <button
              className="panel-fullscreen-btn"
              title="Fullscreen the Code panel"
              onClick={() => togglePanelFullscreen(rightPanelRef)}
            >
              {fullscreenTarget === "code" ? <IconShrink size={14} /> : <IconExpand size={14} />}
            </button>
          </div>

          <textarea
            id="codeEditor"
            spellCheck="false"
            placeholder="// Paste or write Arduino code here, then hit Build Circuit - no AI needed"
            style={{ fontSize: codeFontSize + "px" }}
            onWheel={handleCodeWheelZoom}
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
