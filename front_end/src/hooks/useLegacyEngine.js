import { useEffect } from "react";

// Same relative paths & load order as the original index.html <script> tags.
const LEGACY_SCRIPTS = [
  "/legacy/canvas/viewport.js",
  "/legacy/canvas/history.js",
  "/legacy/canvas/pinTooltip.js",
  "/legacy/components/esp32.js",
  "/legacy/components/led.js",
  "/legacy/components/button.js",
  "/legacy/components/buttonManager.js",
  "/legacy/components/servo.js",
  "/legacy/components/buzzer.js",
  "/legacy/components/potentiometer.js",
  "/legacy/canvas/wiring.js",
  "/legacy/canvas/wireRenderer.js",
  "/legacy/simulator/gpioManager.js",
  "/legacy/simulator/checkWiring.js",
  "/legacy/simulator/tokenizer.js",
  "/legacy/simulator/parser.js",
  "/legacy/simulator/logicEngine.js",
  "/legacy/simulator/interpreter.js",
  "/legacy/components/codeGenerator.js",
  "/legacy/components/arduinoBuilder.js",
  "/legacy/autobuild.js",
  "/legacy/config/components.js",
  "/legacy/app.js",
  "/legacy/fullscreen.js",
];

/**
 * The original STEMbotix Virtual Lab is a canvas/SVG based simulator
 * built with plain, imperative DOM code (drag & drop, wiring, a hand
 * written Arduino tokenizer/parser/interpreter, GPIO + logic engine).
 * The files rely on classic-script global scoping - e.g. canvas/
 * wireRenderer.js references a bare `canvas` identifier that resolves
 * to the browser's automatic `window.canvas` (from `<div id="canvas">`)
 * *before* app.js's own `const canvas = ...` executes later on.
 *
 * That only works if each file stays its own separate <script> (like
 * the original index.html), so this hook loads them individually,
 * in the same order, with `async = false` so the browser executes
 * them in insertion order once each has fetched - instead of bundling
 * them into one module/function scope, which would change scoping
 * semantics and break things like the line above.
 *
 * It waits for React to render the markup first, since the legacy
 * code expects #canvas, #codeEditor, .component, etc. to already
 * exist in the DOM (just like the original body-bottom <script> tags
 * did after the HTML above them had parsed).
 */
export default function useLegacyEngine() {
  useEffect(() => {
    if (document.body.dataset.stembotixLegacyLoaded === "true") {
      return;
    }
    document.body.dataset.stembotixLegacyLoaded = "true";

    LEGACY_SCRIPTS.forEach((src) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false; // preserve original execution order
      document.body.appendChild(script);
    });

    // Redraw wires whenever the canvas viewport changes size - e.g.
    // while dragging the code/serial panel resize handles, or on a
    // browser window resize - so wires never lag behind, Wokwi-style.
    if (window.ResizeObserver) {
      const viewportEl = document.getElementById("canvasViewport");

      if (viewportEl) {
        const observer = new ResizeObserver(() => {
          if (typeof window.updateAllConnections === "function") {
            window.updateAllConnections();
          }
        });

        observer.observe(viewportEl);
      }
    }

    // Not cleaning up on unmount - the engine attaches long-lived
    // listeners to `document`/`window` and is meant to live for the
    // page's lifetime (App only mounts once in this app anyway).
  }, []);
}
