import { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly/core";
import "blockly/blocks";
import * as En from "blockly/msg/en";
import { arduinoGenerator, ARDUINO_TOOLBOX, STARTER_XML } from "../blockly/arduinoBlocks.js";
import { buildBlocklyXmlFromCircuit } from "../blockly/logicToBlocks.js";

Blockly.setLocale(En);

// ==========================================
// Tinkercad-style Blocks workspace.
//
// Always mounted (kept alive off-screen when the
// "Code" tab is active) so the workspace and the
// user's blocks survive switching tabs. Generates
// real Arduino text into the SAME #codeEditor the
// rest of the app already uses, then reuses the
// existing (already-softcoded) build/run pipeline
// - nothing downstream needed to change to support
// blocks.
// ==========================================

export default function BlocklyPanel({ visible }) {
  const containerRef = useRef(null);
  const workspaceRef = useRef(null);
  const [error, setError] = useState(null);

  // Inject the workspace once.
  useEffect(() => {
    if (!containerRef.current || workspaceRef.current) return;

    try {
      const workspace = Blockly.inject(containerRef.current, {
        toolbox: ARDUINO_TOOLBOX,
        trashcan: true,
        scrollbars: true,
        sounds: false,
        zoom: {
          controls: true,
          wheel: true,
          startScale: 0.9,
          maxScale: 4,
          minScale: 0.15,
        },
        grid: {
          spacing: 20,
          length: 3,
          colour: "#334155",
          snap: true,
        },
        theme: Blockly.Theme.defineTheme("stembotixDark", {
          base: Blockly.Themes.Classic,
          componentStyles: {
            workspaceBackgroundColour: "#0f172a",
            toolboxBackgroundColour: "#1e293b",
            toolboxForegroundColour: "#e2e8f0",
            flyoutBackgroundColour: "#1e293b",
            flyoutForegroundColour: "#e2e8f0",
            scrollbarColour: "#475569",
          },
        }),
      });

      Blockly.Xml.domToWorkspace(
        Blockly.utils.xml.textToDom(STARTER_XML),
        workspace
      );

      workspaceRef.current = workspace;
    } catch (err) {
      // Never let a Blockly failure crash the rest of the app (the
      // canvas/wiring engine lives in the same React tree - an
      // uncaught error here used to take the whole thing down with
      // it). Just disable this tab and keep going.
      console.error("Blockly failed to load:", err);
      setError(err.message || String(err));
    }

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, []);

  // Blockly renders at 0x0 while its container is display:none, so
  // whenever this tab becomes visible again, force it to re-measure.
  useEffect(() => {
    if (visible && workspaceRef.current) {
      setTimeout(() => Blockly.svgResize(workspaceRef.current), 0);
    }
  }, [visible]);

  // Keep Blockly's SVG sized correctly through panel drag-resizing,
  // entering/exiting fullscreen, and plain window resizes.
  useEffect(() => {
    function resync() {
      if (workspaceRef.current) Blockly.svgResize(workspaceRef.current);
    }

    window.addEventListener("resize", resync);
    document.addEventListener("fullscreenchange", resync);

    let observer = null;
    if (window.ResizeObserver && containerRef.current) {
      observer = new ResizeObserver(resync);
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", resync);
      document.removeEventListener("fullscreenchange", resync);
      if (observer) observer.disconnect();
    };
  }, []);

  // Bridge for the legacy AI/autobuild pipeline (plain JS, outside
  // React) to push a freshly-generated circuit's blocks in here -
  // so "Generate Circuit" fills canvas + code + blocks together.
  useEffect(() => {
    window.loadCircuitIntoBlockly = (circuit) => {
      const workspace = workspaceRef.current;
      if (!workspace) return;

      try {
        const xml = buildBlocklyXmlFromCircuit(circuit);
        workspace.clear();
        Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xml), workspace);
      } catch (err) {
        console.error("Failed to load circuit into Blockly:", err);
      }
    };

    return () => {
      delete window.loadCircuitIntoBlockly;
    };
  }, []);

  function handleBuildAndRun() {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const code = arduinoGenerator.workspaceToCode(workspace);

    const codeEditor = document.getElementById("codeEditor");
    if (codeEditor) codeEditor.value = code;

    if (typeof window.buildCircuitFromArduino === "function") {
      window.buildCircuitFromArduino();
    }
  }

  return (
    <div className={"blockly-panel" + (visible ? " visible" : "")}>
      <div className="blockly-toolbar">
        <button className="green-btn" onClick={handleBuildAndRun} disabled={!!error}>
          ⚡ Build &amp; Run from Blocks
        </button>
        <span className="blockly-hint">
          {error
            ? "Blocks failed to load - use the Code tab instead."
            : "Drag blocks in, then Build & Run - same as pasting code."}
        </span>
      </div>
      <div className="blockly-workspace" ref={containerRef}></div>
    </div>
  );
}
