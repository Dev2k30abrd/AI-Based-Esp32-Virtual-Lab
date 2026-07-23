# ==========================================
# STEMbotix AI Output Validator
# Logic Engine Version
# ==========================================

import json
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
    "serialPrint"
}


# ==========================================
# Validate AI Response
# ==========================================

def validate_ai_response(text):

    try:
        circuit = json.loads(text)

    except Exception:

        return {
            "success": False,
            "response": "Invalid JSON returned by AI."
        }

    # ------------------------------------------
    # Required Keys
    # ------------------------------------------

    for key in [
        "components",
        "connections",
        "logic",
        "arduino"
    ]:

        if key not in circuit:

            return {
                "success": False,
                "response": f"Missing key: {key}"
            }

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

        if from_component == "ESP32":
            from_type = "ESP32"
        else:
            from_type = component_types.get(from_component)

        if to_component == "ESP32":
            to_type = "ESP32"
        else:
            to_type = component_types.get(to_component)

        if from_type is None or to_type is None:
            continue

        if from_type == "ESP32":

            if from_pin not in ESP32_PINS:
                continue

        if to_type == "ESP32":

            if to_pin not in ESP32_PINS:
                continue

        if from_type != "ESP32":

            if from_pin not in COMPONENT_PINS[from_type]:
                continue

        if to_type != "ESP32":

            if to_pin not in COMPONENT_PINS[to_type]:
                continue

        key = (
            from_component,
            from_pin,
            to_component,
            to_pin
        )

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

        cleaned_logic.append(rule)

    circuit["logic"] = cleaned_logic

    # ==========================================
    # Arduino
    # ==========================================

    code = circuit.get("arduino", "")

    if "void setup" not in code:

        return {
            "success": False,
            "response": "Arduino code missing setup()."
        }

    if "void loop" not in code:

        return {
            "success": False,
            "response": "Arduino code missing loop()."
        }

    # ==========================================
    # Success
    # ==========================================

    return {
        "success": True,
        "response": json.dumps(circuit)
    }