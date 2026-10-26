#!/usr/bin/env node
/**
 * Renders the marketplace images from the HTML templates in ./src:
 *   nutrilens-cover-1920x1080.png   (16:9 cover)
 *   nutrilens-landing-1080x1080.png (1:1 landing page image)
 *
 * Usage: node marketing/build.js
 * Needs Google Chrome (set CHROME_PATH if it is not in the default location).
 * Screens come from web/public/showcase, so recapture those first if the UI changes.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, 'src');

const CHROME =
  process.env.CHROME_PATH ||
  {
    win32: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  }[process.platform] ||
  'google-chrome';

// Lucide icon nodes (ISC licence), stroke icons on a 24x24 grid.
const ICONS = {
  sparkles:
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  camera:
    '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  'shield-check':
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  'book-open':
    '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  'layout-dashboard':
    '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  'scan-line':
    '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
};

const icon = (name, color) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// Simple Icons (CC0) brand marks, recoloured.
const logo = (name, color) => {
  const svg = fs.readFileSync(path.join(SRC, 'logos', `${name}.svg`), 'utf8');
  return svg.replace('<svg ', `<svg fill="${color}" aria-hidden="true" `).replace(/<title>.*?<\/title>/, '');
};

function build(template, output) {
  const html = fs
    .readFileSync(path.join(SRC, template), 'utf8')
    .replace(/{{icon:([\w-]+):(#[0-9a-fA-F]{6})}}/g, (_, name, color) => {
      if (!ICONS[name]) throw new Error(`Unknown icon ${name}`);
      return icon(name, color);
    })
    .replace(/{{logo:([\w-]+):(#[0-9a-fA-F]{6})}}/g, (_, name, color) => logo(name, color));
  const file = path.join(SRC, output);
  fs.writeFileSync(file, html);
  return file;
}

function render(htmlFile, pngName, width, height, scale) {
  const out = path.join(__dirname, pngName);
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    `--window-size=${width},${height}`,
    `--force-device-scale-factor=${scale}`,
    '--virtual-time-budget=10000',
    `--screenshot=${out}`,
    `file:///${htmlFile.replace(/\\/g, '/')}`,
  ], { stdio: 'ignore' });
  console.log(`Rendered ${path.relative(process.cwd(), out)}`);
}

render(build('cover.template.html', 'cover.html'), 'nutrilens-cover-1920x1080.png', 1280, 720, 1.5);
if (fs.existsSync(path.join(SRC, 'square.template.html'))) {
  render(build('square.template.html', 'square.html'), 'nutrilens-landing-1080x1080.png', 1080, 1080, 1);
}
