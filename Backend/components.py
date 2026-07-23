# ==========================================
# STEMbotix Component Registry
# ==========================================

COMPONENTS = {

    "ESP32":{

        "pins":[
            "2","4","5","12","13","14","15","16","17",
            "18","19","21","22","23","25","26","27",
            "32","33","34","35","3V3","GND"
        ]

    },

    "LED":{

        "pins":["ANODE","CATHODE"],

        "rules":[

            "ANODE -> GPIO",

            "CATHODE -> GND"

        ]

    },

    "Button":{

        "pins":["LEFT","RIGHT"],

        "rules":[

            "LEFT -> GPIO",

            "RIGHT -> GND"

        ]

    },

    "Servo":{

        "pins":["SIGNAL","VCC","GND"],

        "rules":[

            "SIGNAL -> GPIO",

            "VCC -> 3V3",

            "GND -> GND"

        ]

    },

    "Buzzer":{

        "pins":["POSITIVE","NEGATIVE"],

        "rules":[

            "POSITIVE -> GPIO",

            "NEGATIVE -> GND"

        ]

    },

    "Potentiometer":{

        "pins":["VCC","OUT","GND"],

        "rules":[

            "VCC -> 3V3",

            "OUT -> GPIO",

            "GND -> GND"

        ]

    }

}