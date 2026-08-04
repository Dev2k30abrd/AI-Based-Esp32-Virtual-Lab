# ==========================================
# STEMbotix Blockly Circuit Validator
# Stage 1 output: components / connections / logic only.
# ==========================================

import json
import re
from components import COMPONENTS


# ------------------------------------------
# Registry
# ------------------------------------------

ALLOWED_COMPONENTS = set(COMPONENTS.keys())

ESP32_PINS = set(COMPONENTS["ESP32"]["pins"])

COMPONENT_PINS = {
    name: set(data["pins"])
    for name, data in COMPONENTS.items()
    if name != "ESP32"
}

SUPPORTED_EVENTS = {
    "startup",
    "timer",
    "buttonPressed",
    "buttonReleased",
    "potentiometerChanged"
}

SUPPORTED_ACTIONS = {
    "turnOn",
    "turnOff",
    "toggle",
    "blink",
    "stopBlink",
    "servoWrite",
    "buzzerOn",
    "buzzerOff",
    "serialPrint",
    "sequence"
}

LED_COLORS = {"red", "green", "blue", "yellow", "white"}


# ==========================================
# Validate Blockly Circuit JSON
# ==========================================

def validate_blockly(text):

    try:
        circuit = json.loads(text)

    except Exception:

        # Last-resort repair: strip a stray trailing comma before
        # a closing brace/bracket and try once more.

        try:
            repaired = re.sub(r",(\s*[}\]])", r"\1", text)
            circuit = json.loads(repaired)
        except Exception:

            return {
                "success": False,
                "error": "Invalid JSON returned by AI (blockly stage)."
            }

    if "components" not in circuit:

        return {
            "success": False,
            "error": "Missing key: components"
        }

    circuit.setdefault("connections", [])
    circuit.setdefault("logic", [])

    # ==========================================
    # COMPONENTS
    # ==========================================

    cleaned_components = []

    component_types = {}

    component_counter = {}

    esp32_found = False

    for component in circuit["components"]:

        if isinstance(component, str):

            component = {
                "type": component
            }

        if not isinstance(component, dict):
            continue

        ctype = component.get("type")

        if ctype not in ALLOWED_COMPONENTS:
            continue

        if ctype == "ESP32":

            if esp32_found:
                continue

            esp32_found = True

            component["id"] = "ESP32"

        else:

            cid = component.get("id")

            if not cid:

                component_counter[ctype] = component_counter.get(ctype, 0) + 1

                cid = f"{ctype}{component_counter[ctype]}"

                component["id"] = cid

        component_types[component["id"]] = ctype

        if ctype == "LED":

            color = component.get("color") or component.get("ledColor")

            component["color"] = color if color in LED_COLORS else "red"

            component.pop("ledColor", None)

        cleaned_components.append(component)

    if not esp32_found:

        cleaned_components.insert(
            0,
            {
                "id": "ESP32",
                "type": "ESP32"
            }
        )

        component_types["ESP32"] = "ESP32"

    circuit["components"] = cleaned_components

    if len(circuit["components"]) <= 1:

        # Only ESP32, no actual parts - nothing useful to build/simulate.
        return {
            "success": False,
            "error": "No valid components in AI response."
        }

    # ==========================================
    # CONNECTIONS
    # ==========================================

    cleaned_connections = []

    seen = set()

    for connection in circuit["connections"]:

        if not isinstance(connection, dict):
            continue

        try:

            from_component = connection["fromComponent"]
            to_component = connection["toComponent"]

            from_pin = str(connection["fromPin"])
            to_pin = str(connection["toPin"])

        except Exception:
            continue

        from_type = "ESP32" if from_component == "ESP32" else component_types.get(from_component)
        to_type = "ESP32" if to_component == "ESP32" else component_types.get(to_component)

        if from_type is None or to_type is None:
            continue

        if from_type == "ESP32" and from_pin not in ESP32_PINS:
            continue

        if to_type == "ESP32" and to_pin not in ESP32_PINS:
            continue

        if from_type != "ESP32" and from_pin not in COMPONENT_PINS[from_type]:
            continue

        if to_type != "ESP32" and to_pin not in COMPONENT_PINS[to_type]:
            continue

        key = (from_component, from_pin, to_component, to_pin)

        if key in seen:
            continue

        seen.add(key)

        cleaned_connections.append(connection)

    circuit["connections"] = cleaned_connections

    # ==========================================
    # LOGIC
    # ==========================================

    cleaned_logic = []

    for rule in circuit["logic"]:

        if not isinstance(rule, dict):
            continue

        event = rule.get("event")
        action = rule.get("action")

        if event not in SUPPORTED_EVENTS:
            continue

        if action not in SUPPORTED_ACTIONS:
            continue

        source = rule.get("source")

        if source:

            if source != "ESP32" and source not in component_types:
                continue

        target = rule.get("target")

        if target:

            target_ids = target if isinstance(target, list) else [target]

            target_ids = [t for t in target_ids if isinstance(t, str)]

            target_ids = [
                t for t in target_ids
                if t == "ESP32" or t in component_types
            ]

            if not target_ids:
                continue

            rule["target"] = target_ids if isinstance(target, list) else target_ids[0]

        if action == "sequence":

            steps = rule.get("steps")

            if not isinstance(steps, list):
                continue

            cleaned_steps = []

            for step in steps:

                if not isinstance(step, dict):
                    continue

                step_target = step.get("target")
                step_state = step.get("state")
                step_duration = step.get("duration", 0)

                if not isinstance(step_target, str):
                    continue

                if step_target != "ESP32" and step_target not in component_types:
                    continue

                if step_state not in ("on", "off"):
                    continue

                try:
                    step_duration = max(0, int(step_duration))
                except (TypeError, ValueError):
                    step_duration = 0

                cleaned_steps.append({
                    "target": step_target,
                    "state": step_state,
                    "duration": step_duration
                })

            if not cleaned_steps:
                continue

            rule["steps"] = cleaned_steps

        cleaned_logic.append(rule)

    circuit["logic"] = cleaned_logic

    return {
        "success": True,
        "circuit": circuit
    }
