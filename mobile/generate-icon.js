/**
 * Premium app icon generator
 * Run: npm install sharp  &&  node generate-icon.js
 */
const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('sharp not found. Run:  npm install sharp');
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, 'assets', 'images');

// ─── SVG design ──────────────────────────────────────────────────────────────
// Deep-dark background, glowing open book, gold spine, amber page highlight,
// subtle "V" vault mark.  1024 × 1024 units.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Background radial glow -->
    <radialGradient id="bgGlow" cx="50%" cy="55%" r="55%">
      <stop offset="0%"  stop-color="#1a0e2e"/>
      <stop offset="100%" stop-color="#06040f"/>
    </radialGradient>

    <!-- Gold spine gradient -->
    <linearGradient id="spineGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#ffe08a"/>
      <stop offset="40%"  stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>

    <!-- Left page gradient -->
    <linearGradient id="pageLeft" x1="1" y1="0" x2="0" y2="0.15">
      <stop offset="0%"   stop-color="#fdf6e3"/>
      <stop offset="100%" stop-color="#c8b88a"/>
    </linearGradient>

    <!-- Right page gradient -->
    <linearGradient id="pageRight" x1="0" y1="0" x2="1" y2="0.15">
      <stop offset="0%"   stop-color="#fdf6e3"/>
      <stop offset="100%" stop-color="#c8b88a"/>
    </linearGradient>

    <!-- Amber glow beneath book -->
    <radialGradient id="bookGlow" cx="50%" cy="80%" r="55%">
      <stop offset="0%"  stop-color="#f59e0b" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>

    <!-- Gold text shimmer -->
    <linearGradient id="textGold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#ffe08a"/>
      <stop offset="50%"  stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>

    <!-- Drop shadow filter -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="28" flood-color="#000" flood-opacity="0.7"/>
    </filter>

    <!-- Glow filter for spine -->
    <filter id="spineGlow" x="-50%" y="-10%" width="200%" height="120%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- ── Background ── -->
  <rect width="1024" height="1024" rx="192" fill="url(#bgGlow)"/>

  <!-- ── Ambient glow under book ── -->
  <ellipse cx="512" cy="680" rx="320" ry="120" fill="url(#bookGlow)"/>

  <!-- ── Book group ── -->
  <g filter="url(#shadow)">

    <!-- Left page (slight perspective tilt) -->
    <path d="
      M 512 310
      C 460 305, 330 315, 248 340
      L 240 700
      C 322 675, 458 665, 512 672
      Z
    " fill="url(#pageLeft)"/>

    <!-- Right page -->
    <path d="
      M 512 310
      C 564 305, 694 315, 776 340
      L 784 700
      C 702 675, 566 665, 512 672
      Z
    " fill="url(#pageRight)"/>

    <!-- Spine -->
    <path d="
      M 512 300
      L 512 680
      C 512 680, 506 682, 504 686
      L 504 698
      C 506 696, 509 694, 512 694
      C 515 694, 518 696, 520 698
      L 520 686
      C 518 682, 512 680, 512 680
      Z
    " fill="url(#spineGold)" filter="url(#spineGlow)" stroke="#ffe08a" stroke-width="1.5"/>

    <!-- Page lines – left side -->
    <line x1="400" y1="390" x2="480" y2="388" stroke="#c4a96a" stroke-width="5" stroke-linecap="round" opacity="0.55"/>
    <line x1="385" y1="430" x2="478" y2="428" stroke="#c4a96a" stroke-width="4" stroke-linecap="round" opacity="0.45"/>
    <line x1="375" y1="468" x2="475" y2="467" stroke="#c4a96a" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
    <line x1="368" y1="504" x2="473" y2="503" stroke="#c4a96a" stroke-width="4" stroke-linecap="round" opacity="0.35"/>
    <line x1="363" y1="539" x2="472" y2="539" stroke="#c4a96a" stroke-width="3.5" stroke-linecap="round" opacity="0.3"/>
    <line x1="360" y1="572" x2="470" y2="572" stroke="#c4a96a" stroke-width="3.5" stroke-linecap="round" opacity="0.28"/>
    <line x1="358" y1="604" x2="469" y2="605" stroke="#c4a96a" stroke-width="3" stroke-linecap="round" opacity="0.25"/>

    <!-- Page lines – right side -->
    <line x1="544" y1="388" x2="624" y2="390" stroke="#c4a96a" stroke-width="5" stroke-linecap="round" opacity="0.55"/>
    <line x1="546" y1="428" x2="639" y2="430" stroke="#c4a96a" stroke-width="4" stroke-linecap="round" opacity="0.45"/>
    <line x1="549" y1="467" x2="649" y2="468" stroke="#c4a96a" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
    <line x1="551" y1="503" x2="656" y2="504" stroke="#c4a96a" stroke-width="4" stroke-linecap="round" opacity="0.35"/>
    <line x1="552" y1="539" x2="661" y2="539" stroke="#c4a96a" stroke-width="3.5" stroke-linecap="round" opacity="0.3"/>
    <line x1="554" y1="572" x2="664" y2="572" stroke="#c4a96a" stroke-width="3.5" stroke-linecap="round" opacity="0.28"/>
    <line x1="555" y1="605" x2="666" y2="604" stroke="#c4a96a" stroke-width="3" stroke-linecap="round" opacity="0.25"/>

    <!-- Cover curve top (decorative arc) -->
    <path d="M 248 340 Q 380 296 512 310 Q 644 296 776 340" fill="none"
          stroke="url(#spineGold)" stroke-width="6" stroke-linecap="round" opacity="0.8"/>

  </g>

  <!-- ── Diamond / gem accent above spine ── -->
  <g transform="translate(512, 268)">
    <polygon points="0,-28  18,0  0,20  -18,0"
             fill="#fbbf24" opacity="0.95"/>
    <polygon points="0,-28  18,0  0,-6"
             fill="#fde68a" opacity="0.85"/>
    <polygon points="0,20   18,0  0,-6  -18,0"
             fill="#d97706" opacity="0.9"/>
  </g>

  <!-- ── "VAULT" wordmark ── -->
  <text
    x="512" y="790"
    text-anchor="middle"
    font-family="Georgia, serif"
    font-size="68"
    font-weight="bold"
    letter-spacing="18"
    fill="url(#textGold)"
    opacity="0.92"
  >VAULT</text>

  <!-- ── Thin horizontal rule ── -->
  <line x1="340" y1="808" x2="684" y2="808"
        stroke="#f59e0b" stroke-width="1.5" opacity="0.4"/>

  <!-- ── Tagline ── -->
  <text
    x="512" y="848"
    text-anchor="middle"
    font-family="Georgia, serif"
    font-size="30"
    letter-spacing="7"
    fill="#fde68a"
    opacity="0.55"
  >READ · LISTEN · GROW</text>

</svg>
`;

// ─── Export ───────────────────────────────────────────────────────────────────
async function generate() {
  const buf = Buffer.from(svg);

  // 1024×1024 main icon
  await sharp(buf).resize(1024, 1024).png().toFile(path.join(OUT_DIR, 'icon.png'));
  console.log('✓ icon.png');

  // 1024×1024 adaptive (Android – no rounding, system applies mask)
  await sharp(buf).resize(1024, 1024).png().toFile(path.join(OUT_DIR, 'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png');

  // 32×32 favicon
  await sharp(buf).resize(32, 32).png().toFile(path.join(OUT_DIR, 'favicon.png'));
  console.log('✓ favicon.png');

  console.log('\nDone! Rebuild your Expo app to see the new icon.');
}

generate().catch((err) => { console.error(err); process.exit(1); });
