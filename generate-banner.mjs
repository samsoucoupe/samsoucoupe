#!/usr/bin/env node
/**
 * Generates dark.svg and light.svg — the profile banner.
 * Structure copied from Sushmitadasari: 1180×610, two panels,
 * clip-path line reveal on dashboard, scanline sweep, animated border.
 *
 * Left panel: space décor (stars, planet, orbits) — no ASCII.
 * Right panel: SYSTEM.INFO dashboard with samsoucoupe data.
 */

import fs from "node:fs";

// ─── Dashboard data ───
const DASH = [
  { y: 42, t: "head", text: "samsoucoupe@ufo" },
  { y: 66, key: "Handle",   val: "samsoucoupe" },
  { y: 88, key: "Role",      val: "Backend Java · DevOps" },
  { y: 110, key: "Origin",   val: "France 🇫🇷" },
  { y: 132, key: "Focus",    val: "Spring Boot · CI/CD · Cloud" },
  { y: 154, key: "Status",   val: "Building • Automating • Shipping" },
  { y: 176, key: "ToolChain", val: "IntelliJ, Git, Docker, K8s" },
  { y: 198, blank: true },
  { y: 220, key: "Core.Lang",     val: "Java, Kotlin, Python, Go" },
  { y: 242, key: "Core.Backend",  val: "Spring Boot, JPA, Hibernate" },
  { y: 264, key: "Core.API",      val: "REST, GraphQL, gRPC" },
  { y: 286, key: "Core.Database", val: "PostgreSQL, MongoDB, Redis" },
  { y: 308, key: "Core.DevOps",   val: "Docker, K8s, Jenkins, ArgoCD" },
  { y: 330, blank: true },
  { y: 352, t: "section", text: "Contact" },
  { y: 374, key: "Grid.Discord",  val: "samsoucoupe#0" },
  { y: 396, key: "Grid.Coffee",   val: "buymeacoffee.com/samsoucoupe" },
  { y: 418, key: "Grid.Github",   val: "samsoucoupe/samsoucoupe" },
  { y: 440, blank: true },
  { y: 462, t: "section", text: "Live Stats" },
  { y: 484, t: "info", text: "See live GitHub stats badges below ↓" },
];

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function dots(key, val) {
  const total = 42;
  const used = key.length + esc(val).length + 4;
  const n = Math.max(1, total - used);
  return "·".repeat(n);
}

// ─── Left panel: space décor ───
function buildSpace(theme) {
  const dark = theme === "dark";
  const star = dark ? "#8b949e" : "#6e7681";
  const planet = dark ? "#bb9af7" : "#7847bd";
  const orbit = dark ? "#7aa2f7" : "#2e52de";
  const dot = dark ? "#7dcfff" : "#00718e";

  // Deterministic-ish stars for visual consistency
  const stars = [];
  const rng = mulberry32(42);
  for (let i = 0; i < 45; i++) {
    const x = 20 + rng() * 460;
    const y = 40 + rng() * 530;
    const r = 0.3 + rng() * 1.3;
    const dur = 1.5 + rng() * 3;
    const delay = rng() * 3;
    stars.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${star}" opacity="0.3"><animate attributeName="opacity" values="0.08;0.7;0.08" dur="${dur.toFixed(1)}s" begin="${delay.toFixed(1)}s" repeatCount="indefinite"/></circle>`
    );
  }

  return `<g>
  <radialGradient id="planetGlow">
    <stop offset="0%" stop-color="${planet}" stop-opacity="0.25"/>
    <stop offset="60%" stop-color="${planet}" stop-opacity="0.04"/>
    <stop offset="100%" stop-color="${planet}" stop-opacity="0"/>
  </radialGradient>
  <defs>
    <radialGradient id="planetFill" cx="35%" cy="35%">
      <stop offset="0%" stop-color="${dot}" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="${planet}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${planet}" stop-opacity="0.3"/>
    </radialGradient>
  </defs>

  <circle cx="250" cy="300" r="200" fill="url(#planetGlow)"/>

  <ellipse cx="250" cy="300" rx="180" ry="55" fill="none" stroke="${orbit}" stroke-width="1" opacity="0.2" stroke-dasharray="3,6"/>
  <ellipse cx="250" cy="300" rx="130" ry="38" fill="none" stroke="${orbit}" stroke-width="1" opacity="0.13" stroke-dasharray="2,4"/>

  <circle cx="250" cy="300" r="75" fill="url(#planetFill)"/>

  <g>
    <animateTransform attributeName="transform" type="rotate" from="0 250 300" to="360 250 300" dur="40s" repeatCount="indefinite"/>
    <circle cx="430" cy="300" r="3" fill="${dot}"/>
    <circle cx="120" cy="300" r="2" fill="${star}"/>
    <circle cx="380" cy="300" r="1.5" fill="${orbit}" opacity="0.8"/>
  </g>
  <g>
    <animateTransform attributeName="transform" type="rotate" from="360 250 300" to="0 250 300" dur="55s" repeatCount="indefinite"/>
    <circle cx="380" cy="300" r="2.5" fill="${dot}" opacity="0.7"/>
    <circle cx="120" cy="300" r="1.5" fill="${star}" opacity="0.5"/>
  </g>

  ${stars.join("\n  ")}
</g>`;
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Clip paths for dashboard lines ───
function buildClips(n) {
  const clips = [];
  let y = 26;
  for (let i = 0; i < n; i++) {
    const begin = (0.75 + i * 0.07).toFixed(2);
    clips.push(
      `<clipPath id="lc${i}"><rect x="500" y="${y.toFixed(2)}" width="0" height="24"><animate attributeName="width" from="0" to="690" dur="0.38s" begin="${begin}s" fill="freeze"/></rect></clipPath>`
    );
    y += 22;
  }
  return clips.join("\n");
}

// ─── Dashboard lines ───
function buildDashboard(theme) {
  const dark = theme === "dark";
  const headColor = dark ? "#7C3AED" : "#5B21B6";
  const keyColor  = dark ? "#22D3EE" : "#0891B2";
  const valColor  = dark ? "#E5E7EB" : "#1F2937";
  const dimColor  = dark ? "#475569" : "#9CA3AF";
  const accentColor = dark ? "#10B981" : "#047857";
  const fontFam = "'Courier New',Consolas,monospace";

  let out = "";
  for (let i = 0; i < DASH.length; i++) {
    const d = DASH[i];
    if (d.blank) {
      out += `<g clip-path="url(#lc${i})"><text x="520" y="${d.y}"> </text></g>\n`;
      continue;
    }
    if (d.t === "head") {
      out += `<g clip-path="url(#lc${i})"><text x="520" y="0"><tspan x="520" y="${d.y}" style="font-family:${fontFam};font-size:17px;font-weight:bold;fill:${headColor};">samsoucoupe</tspan><tspan style="font-family:${fontFam};font-size:15px;fill:${dimColor};">@ufo —${"—".repeat(42)}</tspan></text></g>\n`;
      continue;
    }
    if (d.t === "section") {
      out += `<g clip-path="url(#lc${i})"><text x="520" y="0"><tspan x="520" y="${d.y}" style="font-family:${fontFam};font-size:15px;font-weight:bold;fill:${accentColor};">- ${esc(d.text)} —${"—".repeat(38)}</tspan></text></g>\n`;
      continue;
    }
    if (d.t === "info") {
      out += `<g clip-path="url(#lc${i})"><text x="520" y="0"><tspan x="520" y="${d.y}" style="font-family:${fontFam};font-size:15px;fill:${dimColor};">. ${esc(d.text)}</tspan></text></g>\n`;
      continue;
    }
    // normal key/val line
    const d2 = dots(d.key, d.val);
    out += `<g clip-path="url(#lc${i})"><text x="520" y="0"><tspan x="520" y="${d.y}" style="font-family:${fontFam};font-size:15px;fill:${dimColor};">. </tspan><tspan style="font-family:${fontFam};font-size:15px;font-weight:bold;fill:${keyColor};">${esc(d.key)}</tspan><tspan style="font-family:${fontFam};font-size:15px;fill:${dimColor};"> : ${d2} </tspan><tspan style="font-family:${fontFam};font-size:15px;fill:${valColor};">${esc(d.val)}</tspan></text></g>\n`;
  }

  // Cursor blink at end
  const lastY = DASH[DASH.length - 1].y;
  out += `<rect x="522" y="${lastY + 1}.0" width="9" height="16" fill="${dark ? "#22D3EE" : "#0891B2"}" opacity="0"><animate attributeName="opacity" values="0;0;1;0;1;0;1;0" keyTimes="0;0.01;0.02;0.3;0.5;0.7;0.85;1" dur="1.4s" begin="3.66s" repeatCount="indefinite"/></rect>\n`;

  return out;
}

// ─── Full SVG ───
function buildSvg(theme) {
  const dark = theme === "dark";
  const bgInner = dark ? "#0B1120" : "#E8E8EE";
  const bgOuter = dark ? "#050816" : "#D5D6DB";
  const bc1 = dark ? "#7C3AED" : "#5B21B6";
  const bc2 = dark ? "#22D3EE" : "#0891B2";
  const bc3 = dark ? "#10B981" : "#047857";
  const scanColor = dark ? "#22D3EE" : "#0891B2";
  const lineColor = dark ? "#7DD3FC" : "#0891B2";
  const termLabel = dark ? "#64748B" : "#6B7280";
  const scanLabel = dark ? "#F87171" : "#DC2626";
  const panelTitle = dark ? "#38BDF8" : "#0EA5E9";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1180" height="610" viewBox="0 0 1180 610">
<defs>
  <style>
    .panel-title { font-family: 'Courier New', Consolas, monospace; font-size: 11px; fill: ${panelTitle}; letter-spacing: 2px; opacity: 0.7; }
    .term-label  { font-family: 'Courier New', Consolas, monospace; font-size: 12px; fill: ${termLabel}; letter-spacing: 0.5px; }
    .scan-label  { font-family: 'Courier New', Consolas, monospace; font-size: 10px; fill: ${scanLabel}; letter-spacing: 1px; }
  </style>
  <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${bc1}"/>
    <stop offset="50%" stop-color="${bc2}"/>
    <stop offset="100%" stop-color="${bc3}"/>
  </linearGradient>
  <radialGradient id="bgGlow" cx="30%" cy="20%" r="80%">
    <stop offset="0%" stop-color="${bgInner}"/>
    <stop offset="100%" stop-color="${bgOuter}"/>
  </radialGradient>
  <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
    <rect width="4" height="1" fill="${lineColor}" opacity="0.05"/>
  </pattern>
  <linearGradient id="scanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="${scanColor}" stop-opacity="0"/>
    <stop offset="45%" stop-color="${scanColor}" stop-opacity="0.05"/>
    <stop offset="50%" stop-color="${scanColor}" stop-opacity="0.65"/>
    <stop offset="55%" stop-color="${scanColor}" stop-opacity="0.05"/>
    <stop offset="100%" stop-color="${bc1}" stop-opacity="0"/>
  </linearGradient>
  <mask id="revealMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1180" height="620">
    <rect x="0" y="0" width="1180" height="0" fill="#fff">
      <animate attributeName="height" from="0" to="560" dur="2.6s" begin="0.2s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
    </rect>
  </mask>
${buildClips(DASH.length)}
</defs>

<rect width="1180" height="610" fill="url(#bgGlow)"/>
<rect width="1180" height="610" fill="url(#scanlines)"/>

<rect x="10" y="10" width="490" height="590" rx="16" fill="none" stroke="url(#borderGrad)" stroke-width="1" opacity="0.35"/>
<rect x="510" y="10" width="660" height="590" rx="16" fill="none" stroke="url(#borderGrad)" stroke-width="1" opacity="0.35"/>

<text x="30" y="24" class="panel-title">VISUAL.MAP</text>
<text x="524" y="24" class="panel-title">SYSTEM.INFO</text>
<text x="255" y="600" text-anchor="middle" class="term-label">samsoucoupe@ufo ~ % ./scan --abduct</text>
<text x="1132" y="24" class="scan-label">SCANNING</text>

<g mask="url(#revealMask)">
${buildSpace(theme)}
</g>

${buildDashboard(theme)}

<rect x="0" y="-70" width="1180" height="70" fill="url(#scanGrad)" opacity="0.7" style="mix-blend-mode:screen">
  <animateTransform attributeName="transform" type="translate" from="0 -70" to="0 680" dur="4.2s" repeatCount="indefinite"/>
</rect>

<rect x="3" y="3" width="1174" height="604" rx="16" fill="none" stroke="url(#borderGrad)" stroke-width="2" opacity="0.8">
  <animate attributeName="opacity" values="0.5;0.95;0.5" dur="3.2s" repeatCount="indefinite"/>
</rect>
</svg>`;
}

fs.writeFileSync("dark.svg", buildSvg("dark"), "utf8");
fs.writeFileSync("light.svg", buildSvg("light"), "utf8");
console.log("dark.svg + light.svg generated");
