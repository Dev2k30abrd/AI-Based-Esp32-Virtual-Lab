# ==========================================
# STEMbotix Arduino Code Validator
# Stage 2 output: raw C++ text, checked against the validated circuit.
# ==========================================

import re


def _gpio_pins_used(circuit):

    pins = set()

    for c in circuit.get("connections", []):

        for side_component, side_pin in (
            (c.get("fromComponent"), c.get("fromPin")),
            (c.get("toComponent"), c.get("toPin"))
        ):

            if side_component == "ESP32" and side_pin not in ("GND", "3V3"):
                pins.add(str(side_pin))

    return pins


def validate_arduino(code, circuit=None):

    if not isinstance(code, str) or not code.strip():

        return {
            "success": False,
            "error": "AI returned empty Arduino code."
        }

    code = code.strip()

    # Strip any stray markdown fences the model left in.
    code = re.sub(r"^```[a-zA-Z+]*\n?", "", code)
    code = re.sub(r"```$", "", code).strip()

    warnings = []

    # ------------------------------------------
    # Required functions - auto-repair if missing
    # ------------------------------------------

    if "void setup" not in code:
        code += "\n\nvoid setup() {\n}\n"
        warnings.append("Missing void setup() - stub added.")

    if "void loop" not in code:
        code += "\nvoid loop() {\n}\n"
        warnings.append("Missing void loop() - stub added.")

    # ------------------------------------------
    # Constructs the simulator's parser cannot see at all.
    # It doesn't error on these - it just silently skips the
    # line - so a circuit built from code containing them will
    # LOOK correct and then do nothing at Run. Hard-fail instead
    # so the caller retries with compliant code.
    # ------------------------------------------

    banned_patterns = [
        (r"\bfor\s*\(", "for() loops aren't supported by the simulator"),
        (r"\bwhile\s*\(", "while() loops aren't supported by the simulator"),
        (r"\bmillis\s*\(", "millis() isn't supported - use delay() instead"),
        (r"\bmicros\s*\(", "micros() isn't supported - use delay() instead"),
        (r"\brandom\s*\(", "random() isn't supported by the simulator"),
    ]

    for pattern, reason in banned_patterns:

        if re.search(pattern, code, flags=re.MULTILINE):

            return {
                "success": False,
                "error": f"Generated code uses an unsupported construct: {reason}."
            }

    # ------------------------------------------
    # Balanced braces / parens - reject if broken,
    # this can't be auto-repaired safely.
    # ------------------------------------------

    if code.count("{") != code.count("}"):

        return {
            "success": False,
            "error": "Unbalanced braces in generated Arduino code."
        }

    if code.count("(") != code.count(")"):

        return {
            "success": False,
            "error": "Unbalanced parentheses in generated Arduino code."
        }

    # ------------------------------------------
    # Cross-check: every GPIO used in the circuit
    # should appear somewhere in the code (soft check,
    # warning only - AI may use a constant/macro name).
    # ------------------------------------------

    if circuit:

        for pin in _gpio_pins_used(circuit):

            if pin not in code:
                warnings.append(f"GPIO {pin} not referenced in code - check pin mapping.")

    return {
        "success": True,
        "code": code,
        "warnings": warnings
    }
