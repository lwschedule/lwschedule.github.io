const fs = require('fs');
let css = fs.readFileSync('common.css', 'utf8');

// Use var(--glass-bg-strong) everywhere for better definition
css = css.replace(/body:not\(\.no-glass\) \.time-block,\nbody:not\(\.no-glass\) \.countdown-block,/g, '');
css += `
body:not(.no-glass) .time-block,
body:not(.no-glass) .countdown-block {
  background: var(--glass-bg-strong) !important;
  border: 1px solid var(--glass-border) !important;
  backdrop-filter: var(--glass-blur) !important;
  -webkit-backdrop-filter: var(--glass-blur) !important;
  box-shadow: var(--glow) !important;
  border-radius: 12px !important;
}

body:not(.no-glass) #digitalClock,
body:not(.no-glass) #holidayCountdown {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
`;

css += `
body:not(.no-glass) .infoContent .infoSection,
body:not(.no-glass) .versionBadge {
  background: var(--glass-bg-strong) !important;
  border: 1px solid var(--glass-border) !important;
  backdrop-filter: var(--glass-blur) !important;
  -webkit-backdrop-filter: var(--glass-blur) !important;
  box-shadow: var(--glow) !important;
}
`;

css += `
body:not(.no-glass) .scheduleTable th,
body:not(.no-glass) .weekTable th,
body:not(.no-glass) .holidayTable th {
  backdrop-filter: var(--glass-blur) !important;
  -webkit-backdrop-filter: var(--glass-blur) !important;
}
`;

// Update table highlight:
css = css.replace(/body:not\(\.no-glass\) \.scheduleTable tr\.highlight,\nbody:not\(\.no-glass\) \.weekTable tr\.highlight,\nbody:not\(\.no-glass\) \.holidayTable tr\.highlight \{\n  outline: 2px solid #ffffff;\n  outline-offset: -2px;\n  background: var\(--glass-bg-strong\);\n\}/, `body:not(.no-glass) .scheduleTable tr.highlight,
body:not(.no-glass) .weekTable tr.highlight,
body:not(.no-glass) .holidayTable tr.highlight {
  outline: none;
  background: var(--glass-bg-strong);
}`);

css += `
body:not(.no-glass) .scheduleTable tr.highlight td,
body:not(.no-glass) .weekTable tr.highlight td,
body:not(.no-glass) .holidayTable tr.highlight td {
  border-top: 2px solid white !important;
  border-bottom: 2px solid white !important;
  background: transparent;
}
body:not(.no-glass) .scheduleTable tr.highlight td:first-child,
body:not(.no-glass) .weekTable tr.highlight td:first-child,
body:not(.no-glass) .holidayTable tr.highlight td:first-child {
  border-left: 2px solid white !important;
}
body:not(.no-glass) .scheduleTable tr.highlight td:last-child,
body:not(.no-glass) .weekTable tr.highlight td:last-child,
body:not(.no-glass) .holidayTable tr.highlight td:last-child {
  border-right: 2px solid white !important;
}

body:not(.no-glass) .calendar-day.today {
  outline: 2px solid white !important;
  outline-offset: -2px !important;
  z-index: 5;
}

.month-forward-icon {
  transform: scaleX(-1) !important;
}

/* Safari translateZ hack */
body:not(.no-glass) .mainBtn,
body:not(.no-glass) .saveBtn,
body:not(.no-glass) .calendar-day,
body:not(.no-glass) .action-btn,
body:not(.no-glass) .lunchBtn,
body:not(.no-glass) .calendar-nav button {
  will-change: transform;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}
`;

// Remove any 'outline: none' occurrences injected by replacements to preserve keyboard focus outlines
css = css.replace(/outline:\s*none;?/g, '');

fs.writeFileSync('common.css', css);
