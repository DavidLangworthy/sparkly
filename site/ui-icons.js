const ICON_PATHS = {
  undo: `
    <path d="M9 14 4 9l5-5"/>
    <path d="M4 9h9a7 7 0 1 1 0 14h-1"/>
  `,
  share: `
    <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/>
    <path d="M12 16V3"/>
    <path d="m7 8 5-5 5 5"/>
  `,
  sliders: `
    <line x1="4" x2="20" y1="6" y2="6"/>
    <line x1="4" x2="20" y1="12" y2="12"/>
    <line x1="4" x2="20" y1="18" y2="18"/>
    <circle cx="9" cy="6" r="2"/>
    <circle cx="15" cy="12" r="2"/>
    <circle cx="11" cy="18" r="2"/>
  `,
  brush: `
    <path d="M14.5 4.5 19.5 9.5"/>
    <path d="M13 6 18 11"/>
    <path d="m6 21 5.2-1.2a4 4 0 0 0 2.1-1.1l6-6a2.5 2.5 0 0 0 0-3.5l-3.5-3.5a2.5 2.5 0 0 0-3.5 0l-6 6a4 4 0 0 0-1.1 2.1Z"/>
    <path d="M5 16c-1.2.8-2 2.1-2 3.5 0 .8.7 1.5 1.5 1.5C7 21 8 19.5 8 18"/>
  `,
  spray: `
    <path d="M5 9h8"/>
    <path d="M5 14h10"/>
    <path d="M5 19h7"/>
    <path d="M14 8h4v11a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2Z"/>
    <path d="M18 6c0-1.1-.9-2-2-2h-1"/>
    <circle cx="7" cy="5" r="1"/>
    <circle cx="10" cy="3.5" r=".9"/>
    <circle cx="11.5" cy="7" r=".9"/>
  `,
  trash: `
    <path d="M3 6h18"/>
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
    <path d="M19 6v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
  `,
  saveProject: `
    <path d="M5 3h11l3 3v15H5z"/>
    <path d="M8 3v6h8"/>
    <path d="M9 20v-6h6v6"/>
  `,
  folderOpen: `
    <path d="M3 19a2 2 0 0 0 2 2h11.5a2 2 0 0 0 1.9-1.4L21 12a2 2 0 0 0-1.9-2.6H11l-2-2H5a2 2 0 0 0-2 2z"/>
    <path d="M3 9h16"/>
  `,
  chevronDown: `
    <path d="m6 9 6 6 6-6"/>
  `,
  chevronUp: `
    <path d="m18 15-6-6-6 6"/>
  `,
  circle: `
    <circle cx="12" cy="12" r="9"/>
  `
};

function renderIcon(name, { label = "", size = 20, className = "" } = {}) {
  const paths = ICON_PATHS[name];
  if (!paths) {
    return "";
  }

  const title = label ? `<title>${label}</title>` : "";
  const classes = className ? ` ${className}` : "";
  return `
    <svg class="ui-icon${classes}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      ${title}
      ${paths}
    </svg>
  `;
}

export { renderIcon };
