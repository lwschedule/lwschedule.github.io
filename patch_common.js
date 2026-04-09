const fs = require('fs');
const file = 'common.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "{ href: '/quarters', icon: '📊', text: 'Quarters' },",
  "{ href: '/quarters', icon: '📊', text: 'Quarters/Semesters' },\n    { href: '#', icon: '🗺️', text: 'Map (Coming Soon)', disabled: true },"
);

// We need to modify the loop too.
content = content.replace(
  /if \(link\.href === '\/info' \|\| link\.href === '\/settings'\) {/,
  "if (link.disabled) {\n      linksHtml += `<div style=\"display: flex; align-items: center; gap: 15px; padding: 12px 15px; color: var(--text); opacity: 0.4; cursor: not-allowed;\"><span class=\"sidebar-icon\" style=\"font-size: 1.3em;\">${link.icon}</span> <span class=\"sidebar-text\" style=\"font-weight: 500;\">${link.text}</span></div>`;\n    } else if (link.href === '/info' || link.href === '/settings') {"
);

fs.writeFileSync(file, content, 'utf8');
