// Small part-preview glyphs shown in the "Add Component" drawer.
// These are cheap, recognizable stand-ins (not the full simulated part -
// the real, detailed SVG is built by public/legacy/components/*.js once
// a part is actually placed on the canvas).

function Wrap({ children }) {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      {children}
    </svg>
  );
}

export const PartIconEsp32 = () => (
  <Wrap>
    <rect x="7" y="7" width="20" height="20" rx="2" fill="#1f2937" stroke="#475569" strokeWidth="1.2" />
    <rect x="12" y="12" width="10" height="10" rx="1" fill="#0f172a" stroke="#334155" />
    {[9, 12.6, 16.2, 19.8, 23.4].map((y) => (
      <g key={y}>
        <line x1="2.5" y1={y} x2="7" y2={y} stroke="#94a3b8" strokeWidth="1.4" />
        <line x1="27" y1={y} x2="31.5" y2={y} stroke="#94a3b8" strokeWidth="1.4" />
      </g>
    ))}
    <circle cx="16.8" cy="16.8" r="2.6" fill="none" stroke="#38bdf8" strokeWidth="1" />
  </Wrap>
);

export const PartIconLed = () => (
  <Wrap>
    <line x1="13" y1="21" x2="13" y2="30" stroke="#cbd5e1" strokeWidth="1.6" />
    <line x1="21" y1="21" x2="21" y2="27" stroke="#cbd5e1" strokeWidth="1.6" />
    <path
      d="M9 15 Q9 5 17 5 Q25 5 25 15 L25 21 L9 21 Z"
      fill="#7f1d1d"
      stroke="#fca5a5"
      strokeWidth="1"
    />
    <ellipse cx="17" cy="12" rx="4.5" ry="3" fill="#ff5555" opacity="0.55" />
  </Wrap>
);

export const PartIconButton = () => (
  <Wrap>
    <rect x="5" y="5" width="24" height="24" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
    <rect x="10" y="10" width="14" height="14" rx="2" fill="#334155" stroke="#64748b" />
    <circle cx="17" cy="17" r="4.2" fill="#0ea5e9" opacity="0.85" />
    {[[7, 7], [27, 7], [7, 27], [27, 27]].map(([x, y]) => (
      <circle key={x + "-" + y} cx={x} cy={y} r="1.4" fill="#94a3b8" />
    ))}
  </Wrap>
);

export const PartIconServo = () => (
  <Wrap>
    <rect x="8" y="12" width="18" height="16" rx="1.5" fill="#334155" stroke="#64748b" strokeWidth="1.2" />
    <rect x="4" y="16" width="4" height="8" fill="#475569" />
    <circle cx="17" cy="12" r="4.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
    <rect x="15.3" y="4" width="3.4" height="9" rx="1.2" fill="#f59e0b" transform="rotate(28 17 12)" />
  </Wrap>
);

export const PartIconBuzzer = () => (
  <Wrap>
    <circle cx="17" cy="17" r="12" fill="#111827" stroke="#475569" strokeWidth="1.2" />
    <circle cx="17" cy="17" r="7.2" fill="#1e293b" stroke="#64748b" />
    <circle cx="17" cy="17" r="2" fill="#f59e0b" />
    <line x1="9" y1="27" x2="9" y2="31" stroke="#cbd5e1" strokeWidth="1.6" />
    <line x1="25" y1="27" x2="25" y2="31" stroke="#cbd5e1" strokeWidth="1.6" />
  </Wrap>
);

export const PartIconPot = () => (
  <Wrap>
    <rect x="6" y="10" width="22" height="16" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
    <circle cx="17" cy="18" r="7" fill="#334155" stroke="#94a3b8" strokeWidth="1.2" />
    <line x1="17" y1="18" x2="21.5" y2="13.7" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
    <line x1="5" y1="10" x2="5" y2="6" stroke="#cbd5e1" strokeWidth="1.6" />
    <line x1="17" y1="26" x2="17" y2="30" stroke="#cbd5e1" strokeWidth="1.6" />
    <line x1="29" y1="10" x2="29" y2="6" stroke="#cbd5e1" strokeWidth="1.6" />
  </Wrap>
);

export const PART_ICONS = {
  ESP32: PartIconEsp32,
  LED: PartIconLed,
  Button: PartIconButton,
  Servo: PartIconServo,
  Buzzer: PartIconBuzzer,
  Potentiometer: PartIconPot,
};
