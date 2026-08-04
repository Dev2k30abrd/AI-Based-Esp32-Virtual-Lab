// Small, consistent stroke-icon set used across the app shell.
// Kept dependency-free (plain inline SVG) and sized via `size` so every
// button in the toolbar lines up on the same grid.

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function Svg({ size = 16, children, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      aria-hidden="true"
      {...base}
    >
      {children}
    </svg>
  );
}

export const IconPlay = (p) => (
  <Svg {...p}>
    <path d="M7 4.5v15l13-7.5-13-7.5z" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconStop = (p) => (
  <Svg {...p}>
    <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconReset = (p) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v4.5h4.5" />
  </Svg>
);

export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const IconUndo = (p) => (
  <Svg {...p}>
    <path d="M9 7 4 12l5 5" />
    <path d="M4 12h11a5 5 0 0 1 0 10h-1" />
  </Svg>
);

export const IconRedo = (p) => (
  <Svg {...p}>
    <path d="M15 7l5 5-5 5" />
    <path d="M20 12H9a5 5 0 0 0 0 10h1" />
  </Svg>
);

export const IconSave = (p) => (
  <Svg {...p}>
    <path d="M5 4h11l3 3v13H5z" />
    <path d="M8 4v6h8V4" />
    <path d="M8 20v-6h8v6" />
  </Svg>
);

export const IconLoad = (p) => (
  <Svg {...p}>
    <path d="M4 7a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
  </Svg>
);

export const IconExpand = (p) => (
  <Svg {...p}>
    <path d="M9 4H4v5" />
    <path d="M15 4h5v5" />
    <path d="M9 20H4v-5" />
    <path d="M15 20h5v-5" />
  </Svg>
);

export const IconShrink = (p) => (
  <Svg {...p}>
    <path d="M4 9V4h5" />
    <path d="M20 9V4h-5" />
    <path d="M4 15v5h5" />
    <path d="M20 15v5h-5" />
  </Svg>
);

export const IconBot = (p) => (
  <Svg {...p}>
    <rect x="4" y="8" width="16" height="11" rx="2.5" />
    <path d="M12 8V4" />
    <circle cx="12" cy="3" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
    <path d="M9 17h6" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
  </Svg>
);

export const IconPuzzle = (p) => (
  <Svg {...p}>
    <path d="M9 4h4a1.6 1.6 0 0 1 0 3.2 1.6 1.6 0 0 0 0 3.2H17a1 1 0 0 1 1 1v3.4a1.6 1.6 0 0 1-3.2 0 1.6 1.6 0 0 0-3.2 0V19H7a1 1 0 0 1-1-1v-3.6a1.6 1.6 0 0 0 0-3.2A1.6 1.6 0 0 1 6 8H9z" />
  </Svg>
);

export const IconCode = (p) => (
  <Svg {...p}>
    <path d="M8.5 8 4 12l4.5 4" />
    <path d="M15.5 8 20 12l-4.5 4" />
    <path d="M13.5 5.5 10.5 18.5" />
  </Svg>
);

export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Svg>
);

export const IconMinus = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
);

export const IconFrame = (p) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M4 9h16" />
    <path d="M9 4v16" />
  </Svg>
);

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </Svg>
);

export const IconWrench = (p) => (
  <Svg {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 4.6L4 16.2V20h3.8l5.3-5.3a4 4 0 0 0 4.6-5.4l-2.6 2.6-2-.6-.6-2z" />
  </Svg>
);

export const IconMore = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconChip = (p) => (
  <Svg {...p}>
    <rect x="7" y="7" width="10" height="10" rx="1.2" />
    <path d="M9.5 7V4M12 7V4M14.5 7V4" />
    <path d="M9.5 20v-3M12 20v-3M14.5 20v-3" />
    <path d="M7 9.5H4M7 12H4M7 14.5H4" />
    <path d="M20 9.5h-3M20 12h-3M20 14.5h-3" />
  </Svg>
);
