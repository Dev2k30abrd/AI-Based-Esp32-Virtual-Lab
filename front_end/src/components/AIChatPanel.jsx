import { useEffect, useRef, useState } from "react";

// ==========================================
// Backend
// ==========================================

const API_URL = "http://127.0.0.1:8000/chat";

// Default = OpenRouter's own auto free-model router (picks
// whichever free model is currently up). Secondary = a single
// named free model if you want something fixed instead.
const MODEL_OPTIONS = [
  { value: "", label: "🤖 Auto Free (recommended - switches models automatically)" },
  { value: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "🚀 Nemotron 3 Ultra 550B (Free)" },
];

const SESSIONS_KEY = "stembotix_chat_sessions_v1";

// ==========================================
// Example prompts - one category per component,
// each phrased the way the backend's logic engine
// understands best (named events/actions it supports).
// Click any one to drop it straight into the chat box.
// ==========================================

const EXAMPLES = [
  {
    category: "ESP32 / General",
    icon: "🔷",
    prompts: [
      "Blink the onboard LED on GPIO 2 every 500ms",
      "Print 'Hello STEMbotix' to the serial monitor once every second",
      "Turn an LED on for 2 seconds at startup, then turn it off",
      "Print the word 'Ready' to the serial monitor once, at startup",
      "Blink an LED fast for 1 second, then slow forever after that",
    ],
  },
  {
    category: "LED",
    icon: "💡",
    prompts: [
      "Blink an LED on GPIO 5 every 300ms",
      "Turn on 3 LEDs one after another, 400ms apart, then repeat",
      "Two LEDs that blink at different speeds at the same time",
      "A red LED and a green LED that alternate - only one on at a time",
      "5 LEDs that light up one by one like a loading bar, then all turn off and restart",
      "An LED that blinks twice quickly, pauses, then repeats",
    ],
  },
  {
    category: "Button",
    icon: "🔘",
    prompts: [
      "An LED that turns on while a button is held down, and off when released",
      "Pressing a button toggles an LED on and off each time",
      "Two buttons, each independently controlling its own LED",
      "A button that turns on 3 LEDs at once, and turns them all off on release",
      "One button that cycles a single LED through on, blinking, and off each press",
    ],
  },
  {
    category: "Servo",
    icon: "🦾",
    prompts: [
      "A button press moves a servo to 90 degrees, releasing it returns it to 0",
      "A potentiometer that continuously controls a servo's angle",
      "A button that sweeps a servo between 0 and 180 while held",
      "Two buttons - one moves a servo to 0 degrees, the other to 180",
      "A servo gate that opens (90°) when a button is pressed and closes when released",
    ],
  },
  {
    category: "Buzzer",
    icon: "🔊",
    prompts: [
      "A button that makes a buzzer beep continuously while held down",
      "An LED and a buzzer that blink together when a button is pressed, and stop when released",
      "A buzzer that beeps once every 2 seconds on its own",
      "A doorbell - pressing a button makes the buzzer beep once",
      "An alarm - a button toggles a buzzer and a red LED blinking together on/off",
    ],
  },
  {
    category: "Potentiometer",
    icon: "🎚️",
    prompts: [
      "Use a potentiometer to control the angle of a servo",
      "Print the potentiometer's raw value to the serial monitor continuously",
      "A potentiometer that dims an LED's blink speed as it turns",
      "A volume-knob style potentiometer that controls a buzzer's pitch",
    ],
  },
  {
    category: "Traffic Light",
    icon: "🚦",
    prompts: [
      "A classic traffic light - red for 3 seconds, yellow for 1 second, green for 3 seconds, repeat",
      "A pedestrian crossing traffic light with red, yellow and green LEDs that cycle automatically",
      "A traffic light that a button can pause on red when pressed",
      "Two traffic lights (6 LEDs total) for a 4-way intersection that alternate - one is green while the other is red",
    ],
  },
  {
    category: "Disco / Party Lights",
    icon: "🪩",
    prompts: [
      "A disco light with 5 different-coloured LEDs chasing one after another, fast",
      "A party light strip - red, yellow, green and blue LEDs flashing in a repeating pattern",
      "A disco light that speeds up the flashing pattern while a button is held down",
      "6 colourful LEDs blinking in a bouncing back-and-forth chase pattern",
      "A buzzer beat with LEDs flashing in time with it, like a mini dance floor",
    ],
  },
  {
    category: "Multi-Component / Logic",
    icon: "🧠",
    prompts: [
      "Button1 makes LED1 and Buzzer1 blink together every 250ms while held, and stop when released",
      "3 buttons, each toggling its own LED independently",
      "A potentiometer drives a servo, and a separate button toggles a buzzer on/off",
      "A security system - a button arms a blinking red LED, a second button disarms it and beeps the buzzer once",
      "A reaction game - a button lights an LED and beeps once when pressed",
    ],
  },
];

// Any prompt (not just the curated examples above) is fair game -
// the backend will ask a clarifying question if something's
// missing, so it's fine to just describe whatever circuit comes
// to mind, however specific or unusual.

// Backend errors should always be plain strings, but never let a
// stray object/array render as "[object Object]" if one slips through.
function toText(value, fallback) {
  if (typeof value === "string" && value.trim()) return value;
  if (value == null) return fallback;
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;

  }
}

const WELCOME_MESSAGE = {
  role: "assistant",
  text:
    "Hi! Describe the circuit you want in plain language and I'll build it - " +
    "components, wiring, logic and Arduino code. If anything's unclear I'll ask " +
    "before generating. Check the Examples tab for prompts that work great.",
};

// ==========================================
// Session store (ChatGPT-style: many saved
// conversations, one active at a time)
// ==========================================

function loadSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function saveSessions(sessions) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // storage full/unavailable - chat still works this session
  }
}

function titleFrom(text) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 42 ? clean.slice(0, 42) + "…" : clean;
}

export default function AIChatPanel({ visible }) {
  const [tab, setTab] = useState("chat"); // "chat" | "examples" | "history"
  const [sessions, setSessions] = useState(() => loadSessions());

  // activeId is null for a brand-new, not-yet-saved chat - exactly
  // like opening a fresh ChatGPT conversation before your first message.
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);

  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODEL_OPTIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [openCategory, setOpenCategory] = useState(EXAMPLES[0].category);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  function persistActive(id, msgs) {
    if (!id) return;

    setSessions((prev) => {
      const existing = prev[id];

      const firstUserMsg = msgs.find((m) => m.role === "user");

      const next = {
        ...prev,
        [id]: {
          id,
          title: existing?.title || (firstUserMsg ? titleFrom(firstUserMsg.text) : "New chat"),
          messages: msgs,
          updatedAt: Date.now(),
        },
      };

      saveSessions(next);
      return next;
    });
  }

  function appendMessage(msg) {
    setMessages((prev) => {
      const next = [...prev, msg];
      persistActive(activeId, next);
      return next;
    });
  }

  async function send(promptOverride) {
    const prompt = (promptOverride ?? input).trim();
    if (!prompt || loading) return;

    appendMessage({ role: "user", text: prompt });
    setInput("");
    setLoading(true);

    const serial = document.getElementById("serialOutput");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          session_id: activeId,
          model: model || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Backend Error : " + response.status);
      }

      const result = await response.json();

      // First reply of a brand-new chat - adopt the backend's
      // session_id as this chat's permanent id and save it.
      let effectiveId = activeId;
      if (!effectiveId && result.session_id) {
        effectiveId = result.session_id;
        setActiveId(effectiveId);
      }

      const finish = (assistantMsg) => {
        setMessages((prev) => {
          const next = [...prev, assistantMsg];
          persistActive(effectiveId, next);
          return next;
        });
      };

      if (result.type === "clarify") {
        finish({
          role: "assistant",
          text: toText(result.message, "Could you give a bit more detail?"),
          suggestions: result.suggestions || [],
        });
      } else if (result.type === "error") {
        finish({
          role: "assistant",
          text: "⚠️ " + toText(result.message, "Something went wrong generating that circuit."),
          isError: true,
        });
        if (result.components && typeof window.autoBuildCircuit === "function") {
          window.autoBuildCircuit({
            components: result.components,
            connections: result.connections,
            logic: result.logic,
            arduino:
              "// Arduino code generation failed - see chat for details.\n\nvoid setup(){\n}\n\nvoid loop(){\n}\n",
          });
        }
      } else if (result.type === "circuit_ready") {
        finish({
          role: "assistant",
          text: "✅ Circuit generated and validated. Building it on the canvas now...",
          warnings: result.warnings || [],
        });

        if (serial) {
          serial.innerHTML += "🤖 AI circuit ready - building...<br>";
        }

        if (typeof window.autoBuildCircuit === "function") {
          window.autoBuildCircuit({
            components: result.components,
            connections: result.connections,
            logic: result.logic,
            arduino: result.arduino,
          });
        }
      } else {
        finish({
          role: "assistant",
          text: "Unexpected response from the AI backend.",
          isError: true,
        });
      }
    } catch (err) {
      appendMessage({
        role: "assistant",
        text: "❌ " + toText(err?.message || err, "Request failed."),
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function useExample(text) {
    setTab("chat");
    setInput(text);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  // Always opens a brand-new, empty conversation - like ChatGPT's
  // "New chat". The previous one stays saved under History.
  function newChat() {
    setMessages([WELCOME_MESSAGE]);
    setActiveId(null);
    setInput("");
    setTab("chat");
  }

  function openHistoryChat(id) {
    const session = sessions[id];
    if (!session) return;
    setActiveId(id);
    setMessages(session.messages);
    setTab("chat");
  }

  function deleteHistoryChat(e, id) {
    e.stopPropagation();
    setSessions((prev) => {
      const next = { ...prev };
      delete next[id];
      saveSessions(next);
      return next;
    });
    if (activeId === id) newChat();
  }

  const historyList = Object.values(sessions).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className={"ai-chat-panel" + (visible ? " visible" : "")}>
      <div className="ai-chat-tabs">
        <button
          className={"ai-chat-tab" + (tab === "chat" ? " active" : "")}
          onClick={() => setTab("chat")}
        >
          💬 Chat
        </button>
        <button
          className={"ai-chat-tab" + (tab === "examples" ? " active" : "")}
          onClick={() => setTab("examples")}
        >
          📋 Examples
        </button>
        <button
          className={"ai-chat-tab" + (tab === "history" ? " active" : "")}
          onClick={() => setTab("history")}
        >
          🕘 History{historyList.length ? ` (${historyList.length})` : ""}
        </button>
        <div className="ai-chat-tabs-spacer" />
        <button className="ai-chat-new" title="Start a new conversation" onClick={newChat}>
          ＋ New
        </button>
      </div>

      {tab === "chat" && (
        <>
          <div className="ai-chat-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  "ai-chat-bubble-row " + (m.role === "user" ? "from-user" : "from-ai")
                }
              >
                <div
                  className={
                    "ai-chat-bubble" +
                    (m.role === "user" ? " user" : " assistant") +
                    (m.isError ? " error" : "")
                  }
                >
                  {m.text}

                  {!!m.warnings?.length && (
                    <div className="ai-chat-warnings">
                      {m.warnings.map((w, wi) => (
                        <div key={wi}>⚠ {w}</div>
                      ))}
                    </div>
                  )}

                  {!!m.suggestions?.length && (
                    <div className="ai-chat-suggestions">
                      {m.suggestions.map((s, si) => (
                        <button
                          key={si}
                          className="ai-chat-suggestion-chip"
                          onClick={() => send(s)}
                          disabled={loading}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-chat-bubble-row from-ai">
                <div className="ai-chat-bubble assistant ai-chat-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          <div className="ai-chat-composer">
            <select
              className="ai-chat-model-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              title="Model to use"
            >
              {MODEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="ai-chat-input-row">
              <textarea
                ref={inputRef}
                className="ai-chat-input"
                rows={1}
                placeholder="Describe your circuit... e.g. Blink an LED on GPIO 5 every 500ms"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="ai-chat-send"
                onClick={() => send()}
                disabled={loading || !input.trim()}
                title="Send (Enter)"
              >
                {loading ? "…" : "➤"}
              </button>
            </div>
          </div>
        </>
      )}

      {tab === "examples" && (
        <div className="ai-examples">
          <div className="ai-examples-intro">
            Tap any prompt to try it - each one is phrased so the AI has everything
            it needs to build the circuit in one go.
          </div>

          {EXAMPLES.map((group) => (
            <div className="ai-example-group" key={group.category}>
              <button
                className={
                  "ai-example-group-header" +
                  (openCategory === group.category ? " open" : "")
                }
                onClick={() =>
                  setOpenCategory((c) => (c === group.category ? null : group.category))
                }
              >
                <span className="ai-example-group-icon">{group.icon}</span>
                <span className="ai-example-group-title">{group.category}</span>
                <span className="ai-example-group-chevron">
                  {openCategory === group.category ? "▾" : "▸"}
                </span>
              </button>

              {openCategory === group.category && (
                <div className="ai-example-list">
                  {group.prompts.map((p, i) => (
                    <button
                      key={i}
                      className="ai-example-item"
                      onClick={() => useExample(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "history" && (
        <div className="ai-history">
          {historyList.length === 0 && (
            <div className="ai-history-empty">
              No saved chats yet - conversations show up here once you send a message.
            </div>
          )}

          {historyList.map((s) => (
            <button
              key={s.id}
              className={"ai-history-item" + (s.id === activeId ? " active" : "")}
              onClick={() => openHistoryChat(s.id)}
            >
              <div className="ai-history-item-main">
                <div className="ai-history-item-title">{s.title}</div>
                <div className="ai-history-item-meta">
                  {new Date(s.updatedAt).toLocaleString()} · {s.messages.length} messages
                </div>
              </div>
              <span
                className="ai-history-item-delete"
                title="Delete this chat"
                onClick={(e) => deleteHistoryChat(e, s.id)}
              >
                🗑
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
