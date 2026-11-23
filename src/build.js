/**
 * MiniSplitBTUMatrix — 241-Page Static Site Generator (Cloudflare Workers / Pages Ready)
 * Compiles 241 static HTML pages + sitemap.xml + robots.txt + ads.txt + Cloudflare assets config
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const SRC_DIR = path.join(ROOT, 'src');
const DIST_DIR = path.join(ROOT, 'dist');

const SITE_NAME = 'MiniSplitBTUMatrix';
const SITE_URL = 'https://minisplitbtumatrix.com';
const TODAY = '2026-11-23';

const sqftPages = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'sqft.json'), 'utf8'));
const spaces = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'spaces.json'), 'utf8'));
const multizone = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'multizone.json'), 'utf8'));
const comparisons = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'comparisons.json'), 'utf8'));

if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST_DIR, 'assets'), { recursive: true });

const cssRaw = fs.readFileSync(path.join(SRC_DIR, 'styles.css'), 'utf8');
const jsRaw = fs.readFileSync(path.join(SRC_DIR, 'app.js'), 'utf8');
const cssHash = crypto.createHash('md5').update(cssRaw).digest('hex').slice(0, 8);
const jsHash = crypto.createHash('md5').update(jsRaw).digest('hex').slice(0, 8);

const CSS_PATH = `/assets/styles.${cssHash}.css`;
const JS_PATH = `/assets/app.${jsHash}.js`;
fs.writeFileSync(path.join(DIST_DIR, `assets/styles.${cssHash}.css`), cssRaw);
fs.writeFileSync(path.join(DIST_DIR, `assets/app.${jsHash}.js`), jsRaw);

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

const allSearchEntries = [
  ...sqftPages.map(s => ({ label: s.shortLabel, url: `/sqft/${s.slug}/` })),
  ...spaces.map(sp => ({ label: sp.name, url: `/spaces/${sp.slug}/` })),
  ...multizone.map(m => ({ label: m.shortLabel, url: `/multizone/${m.slug}/` })),
  ...comparisons.map(c => ({ label: c.shortLabel, url: `/compare/${c.slug}/` }))
];
const DATALIST_HTML = `<datalist id="hvac-pages-list">${allSearchEntries.map(e => `<option value="${escapeAttr(e.label)}" data-url="${e.url}"></option>`).join('')}</datalist>`;

function writePage(relPath, html) {
  const full = path.join(DIST_DIR, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html);
}

const sitemapUrls = [];

function renderLayout({ title, description, canonicalPath, breadcrumbs, jsonLdGraph, mainHtml, sidebarLinks }) {
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  if (!canonicalPath.includes('404')) sitemapUrls.push(canonicalUrl);

  const schemaScript = JSON.stringify({ '@context': 'https://schema.org', '@graph': jsonLdGraph });
  const bcHtml = breadcrumbs.map((b, i) =>
    i < breadcrumbs.length - 1
      ? `<a href="${b.url}">${escapeHtml(b.name)}</a><span>/</span>`
      : `<span>${escapeHtml(b.name)}</span>`
  ).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>${escapeHtml(title)} | ${SITE_NAME}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="expect" href="#hero-panel" blocking="render">
  <link rel="stylesheet" href="${CSS_PATH}">
  <script type="application/ld+json">${schemaScript}</script>
  <script type="speculationrules">
    {"prefetch":[{"where":{"href_matches":"/*"},"eagerness":"moderate"}]}
  </script>
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="/">
        <span class="brand-badge">BTU</span>
        <span>${SITE_NAME}</span>
      </a>
      <nav class="nav-links" aria-label="Primary Navigation">
        <a href="/#sqft">Sq Ft Sizing</a>
        <a href="/#spaces">Garages &amp; Rooms</a>
        <a href="/#multizone">Multi-Zone</a>
        <a href="/#compare">SEER2 &amp; Breakers</a>
      </nav>
      <search class="search-bar">
        <input id="quick-jump" type="search" list="hvac-pages-list" placeholder="Jump to 500 sq ft, 2-Car Garage, 36k 3-Zone..." aria-label="Search mini split sizing pages">
        ${DATALIST_HTML}
      </search>
      <button id="theme-toggle" class="theme-btn" type="button" aria-label="Toggle color theme">🌙 Dark</button>
    </div>
  </header>

  <div class="container">
    <div class="ad-slot ad-leaderboard" data-refresh="true" aria-label="Advertisement">
      <span>Display Ad Slot — 728×90 Leaderboard (Mitsubishi / MRCOOL / Daikin / HVAC Installers)</span>
    </div>

    <div class="layout-grid">
      <main>
        <nav class="breadcrumb" aria-label="Breadcrumb">${bcHtml}</nav>
        ${mainHtml}
      </main>
      <aside class="sidebar-col">
        <div class="ad-slot ad-sidebar" data-refresh="true" aria-label="Sidebar Advertisement">
          <span>Sticky 300×600 High-RPM Display Ad Slot<br>(Heat Pumps, Mini-Split Kits &amp; Local HVAC Quotes)</span>
        </div>
        <div class="card" style="margin-top:16px">
          <h3 style="margin-top:0;font-size:1rem">High-Demand Sizing Shortcuts</h3>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${(sidebarLinks || []).map(l => `<a class="link-chip" href="${l.url}">${escapeHtml(l.label)}</a>`).join('')}
          </div>
        </div>
      </aside>
    </div>
  </div>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-links">
        <a href="/">Home</a>
        <a href="/about/">ACCA Thermal Methodology</a>
        <a href="/privacy-policy/">Privacy Policy</a>
        <a href="/terms/">Terms of Use</a>
        <a href="/contact/">Contact</a>
        <a href="/sitemap.xml">XML Sitemap</a>
      </div>
      <p>&copy; 2026 ${SITE_NAME}. Thermal sizing estimates apply ceiling-volume scaling, envelope R-value multipliers, and IECC climate zone heat-pump derating. Always verify final equipment nameplate MCA/MOP and perform a room-by-room ACCA Manual J calculation for whole-house retrofits.</p>
    </div>
  </footer>

  <div class="ad-mobile-sticky" aria-label="Mobile Sticky Ad">Mobile Adhesion Ad Unit (320×50) — Zero CLS</div>
  <script src="${JS_PATH}" defer></script>
</body>
</html>`;
}

function buildDatasetSchema(name, desc, url) {
  return {
    '@type': 'Dataset',
    name,
    description: desc,
    url: `${SITE_URL}${url}`,
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: { '@type': 'Organization', name: SITE_NAME, url: `${SITE_URL}/` },
    dateModified: TODAY
  };
}

function renderThermalSvg(sqft, ceilFt, recBtu, tons) {
  return `<div class="svg-blueprint-wrap">
    <svg viewBox="0 0 640 190" role="img" aria-label="Mini-split thermal airflow and inverter sizing diagram">
      <!-- Room Envelope -->
      <rect x="40" y="45" width="380" height="120" rx="8" fill="none" stroke="#0284c7" stroke-width="2"/>
      <!-- Wall-Mount Indoor Head -->
      <rect x="52" y="58" width="94" height="26" rx="4" fill="#0284c7"/>
      <text x="99" y="75" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="11" font-weight="700">INDOOR HEAD</text>
      <!-- Airflow Arcs -->
      <path d="M 152 72 Q 245 78 335 128" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6 4"/>
      <path d="M 152 78 Q 220 98 280 148" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 4"/>
      <!-- Line Set to Outdoor Condenser -->
      <line x1="420" y1="115" x2="490" y2="115" stroke="#ea580c" stroke-width="3"/>
      <rect x="490" y="75" width="110" height="80" rx="6" fill="none" stroke="#ea580c" stroke-width="2"/>
      <circle cx="535" cy="115" r="24" fill="none" stroke="#ea580c" stroke-width="2" stroke-dasharray="8 4"/>
      <text x="545" y="66" text-anchor="middle" fill="currentColor" font-family="monospace" font-size="11" font-weight="700">OUTDOOR INVERTER</text>
      <!-- Labels -->
      <text id="svg-room-label" x="40" y="28" fill="currentColor" font-family="monospace" font-size="14" font-weight="700">${sqft.toLocaleString()} sq ft × ${ceilFt}' Ceiling</text>
      <text id="svg-btu-label" x="600" y="28" text-anchor="end" fill="#0284c7" font-family="monospace" font-size="14" font-weight="700">${recBtu.toLocaleString()} BTU (${tons} Ton)</text>
      <text x="40" y="182" fill="currentColor" opacity="0.72" font-family="monospace" font-size="11">Variable-Speed DC Inverter • Soft-Start Ramp (No Inrush Spike) • 20+ SEER2 Efficiency</text>
    </svg>
  </div>`;
}

function renderAffiliateCards(btu, breaker) {
  return `<div class="affiliate-grid">
    <div class="aff-card"><div><strong>${btu.toLocaleString()} BTU 20+ SEER2 Inverter Kit</strong><p style="font-size:0.84rem;color:var(--text-muted);margin:6px 0">Compare MRCOOL DIY, Pioneer, Senville &amp; Mitsubishi Hyper-Heat units in the ${(btu / 12000).toFixed(2)}-Ton class.</p></div><a class="aff-btn" href="#sizing-table">Compare ${btu / 1000}k BTU Units →</a></div>
    <div class="aff-card"><div><strong>NEC 440.14 Disconnect &amp; Whip Kit</strong><p style="font-size:0.84rem;color:var(--text-muted);margin:6px 0">Matched for ${breaker} circuit with weatherproof non-fused pullout disconnect and 6-ft liquid-tight whip.</p></div><a class="aff-btn" href="#sizing-table">Electrical Specs →</a></div>
    <div class="aff-card"><div><strong>Condenser Wall Bracket / Snow Stand</strong><p style="font-size:0.84rem;color:var(--text-muted);margin:6px 0">Keeps outdoor heat-pump coils 18" above winter snowpack and lawn mower debris.</p></div><a class="aff-btn" href="#sizing-table">Mounting Options →</a></div>
  </div>`;
}

const defaultSidebar = [
  { label: '500 Sq Ft Mini Split Size', url: '/sqft/500-sq-ft-mini-split-size-btu-calculator/' },
  { label: '1,000 Sq Ft Mini Split Size', url: '/sqft/1000-sq-ft-mini-split-size-btu-calculator/' },
  { label: '2-Car Garage (Insulated)', url: '/spaces/2-car-garage-insulated-mini-split-size/' },
  { label: '2-Car Garage (Uninsulated)', url: '/spaces/2-car-garage-uninsulated-mini-split-size/' },
  { label: '30×40 Pole Barn Shop', url: '/spaces/pole-barn-30x40-mini-split-btu-sizing/' },
  { label: '36k 3-Zone (9k+9k+18k)', url: '/multizone/36k-3-zone-mini-split-9k-9k-18k/' },
  { label: '12,000 vs 18,000 BTU Guide', url: '/compare/12000-btu-vs-18000-btu-mini-split/' }
];

// --- 1. Build 84 Square-Footage Pages (/sqft/...) ---
for (const s of sqftPages) {
  const url = `/sqft/${s.slug}/`;
  const siblings = sqftPages.filter(x => x.sqft === s.sqft && x.slug !== s.slug);
  const nearby = sqftPages.filter(x => x.tier === s.tier && x.slug !== s.slug).slice(0, 8);

  const ceilRows = [8, 9, 10, 12, 14].map(c => {
    const raw = Math.round(s.sqft * 22 * (c / 8) * s.insulationFactor * s.climateFactor);
    const rec = [6000, 9000, 12000, 15000, 18000, 24000, 30000, 36000, 42000, 48000, 60000].find(v => v >= raw * 0.96) || 60000;
    return `<tr>
      <td data-label="Ceiling Height" data-sort="${c}"><strong>${c} Feet</strong>${c === s.ceilingFt ? ' (Current)' : ''}</td>
      <td data-label="Air Volume" data-sort="${s.sqft * c}">${(s.sqft * c).toLocaleString()} cu ft</td>
      <td data-label="Calculated Load" data-sort="${raw}">${raw.toLocaleString()} BTU/hr</td>
      <td data-label="Recommended Chassis" data-sort="${rec}"><strong>${rec.toLocaleString()} BTU</strong></td>
      <td data-label="Tonnage" data-sort="${rec}">${(rec / 12000).toFixed(2)} Tons</td>
    </tr>`;
  }).join('');

  const faqs = [
    { q: `What size mini split do I need for ${s.sqft.toLocaleString()} sq ft (${s.tier})?`, a: `For ${s.sqft.toLocaleString()} sq ft with an ${s.ceilingFt}-foot ceiling under ${s.tier} conditions, the calculated cooling load is ${s.rawCoolingBtu.toLocaleString()} BTU/hr, requiring a ${s.recommendedBtu.toLocaleString()} BTU (${s.tonnage}-Ton) inverter mini-split.` },
    { q: `What breaker and wire size does a ${s.recommendedBtu.toLocaleString()} BTU mini split require?`, a: `A ${s.recommendedBtu.toLocaleString()} BTU condenser typically operates on ${s.voltage} power with a ${s.breaker} circuit breaker and ${s.wire} copper wiring. Always confirm the exact MCA and MOP on the outdoor unit nameplate.` },
    { q: `How much does it cost per month to run a mini split in a ${s.sqft.toLocaleString()} sq ft room?`, a: `At 20 SEER2 and $0.16/kWh, a ${s.recommendedBtu.toLocaleString()} BTU variable-inverter mini-split averages ~$${s.monthlyPeakCost}/month during peak summer months (~$${s.annualCost}/year).` }
  ];

  const mainHtml = `
    <section id="hero-panel" class="hero-card">
      <h1>${escapeHtml(s.title)}</h1>
      <p class="hero-sub">Profile: <strong>${escapeHtml(s.tier)}</strong> • Recommended Zones: <strong>${s.zonesRecommended} Zone(s)</strong> • Short-Cycle Risk: <strong>${escapeHtml(s.shortCycleRisk)}</strong>.</p>
      <div class="kpi-grid">
        <div class="kpi-box highlight"><div class="kpi-label">Recommended Size</div><div class="kpi-val" id="out-btu">${s.recommendedBtu.toLocaleString()} BTU</div><div class="kpi-sub">Raw load: <span id="out-raw">${s.rawCoolingBtu.toLocaleString()} BTU/hr</span></div></div>
        <div class="kpi-box"><div class="kpi-label">HVAC Tonnage</div><div class="kpi-val" id="out-tons">${s.tonnage} Tons</div><div class="kpi-sub">Heating design: ${s.rawHeatingBtu.toLocaleString()} BTU</div></div>
        <div class="kpi-box"><div class="kpi-label">Breaker &amp; Voltage</div><div class="kpi-val" id="out-breaker">${s.breaker}</div><div class="kpi-sub">${s.voltage} • ${s.wire}</div></div>
        <div class="kpi-box"><div class="kpi-label">Est. Operating Cost</div><div class="kpi-val" id="out-cost">$${s.annualCost}/yr</div><div class="kpi-sub">~$${s.monthlyPeakCost}/mo peak @ 20 SEER2</div></div>
      </div>
    </section>

    <section class="card isolated-widget" id="hvac-calculator">
      <h2 style="margin-top:0">Live Manual-J Inspired BTU, Ceiling &amp; SEER2 Calculator</h2>
      <div class="calc-grid">
        <div class="field"><label for="inp-sqft">Room Area (Sq Ft)</label><input id="inp-sqft" type="number" min="50" max="5000" value="${s.sqft}"></div>
        <div class="field"><label for="inp-ceil">Ceiling Height (Feet)</label><input id="inp-ceil" type="number" min="7" max="20" step="0.5" value="${s.ceilingFt}"></div>
        <div class="field"><label for="inp-ins">Insulation Quality</label>
          <select id="inp-ins">
            <option value="0.85">Spray Foam / Tight New Build (0.85×)</option>
            <option value="1.0" ${s.insulationFactor === 1.0 ? 'selected' : ''}>Standard Insulated Room (1.00×)</option>
            <option value="1.25" ${s.insulationFactor >= 1.2 ? 'selected' : ''}>Poorly Insulated / Garage (1.25×)</option>
            <option value="1.45">Glass Sunroom / Metal Wall (1.45×)</option>
          </select>
        </div>
        <div class="field"><label for="inp-clim">Climate Zone</label>
          <select id="inp-clim">
            <option value="1.12" ${s.climateFactor === 1.12 ? 'selected' : ''}>Hot South / Desert (Zone 1–2)</option>
            <option value="1.0" ${s.climateFactor === 1.0 ? 'selected' : ''}>Moderate Mixed (Zone 3–4)</option>
            <option value="1.22" ${s.climateFactor >= 1.2 ? 'selected' : ''}>Cold Winter Hyper-Heat (Zone 5–7)</option>
          </select>
        </div>
        <div class="field"><label for="inp-seer">Unit Efficiency (SEER2)</label><input id="inp-seer" type="number" min="14" max="32" value="20"></div>
        <div class="field"><label for="inp-rate">Electric Rate ($/kWh)</label><input id="inp-rate" type="number" min="0.06" max="0.60" step="0.01" value="0.16"></div>
      </div>
      <div id="out-verdict" class="alert-banner ok"></div>
      ${renderThermalSvg(s.sqft, s.ceilingFt, s.recommendedBtu, s.tonnage)}
      ${renderAffiliateCards(s.recommendedBtu, s.breaker)}
    </section>

    <div class="ad-slot ad-incontent" data-refresh="true" aria-label="In-Content Advertisement"><span>In-Content Display Ad Unit (336×280)</span></div>

    <section class="card deferred-section" id="sizing-table">
      <h2 style="margin-top:0">${s.sqft.toLocaleString()} Sq Ft Ceiling-Height BTU Multiplier Table</h2>
      <div class="table-container">
        <table data-sortable>
          <thead><tr>
            <th aria-sort="none"><button class="sort-btn" type="button">Ceiling Height ↕</button></th>
            <th aria-sort="none"><button class="sort-btn" type="button">Air Volume ↕</button></th>
            <th aria-sort="none"><button class="sort-btn" type="button">Thermal Load ↕</button></th>
            <th aria-sort="none"><button class="sort-btn" type="button">Recommended BTU ↕</button></th>
            <th aria-sort="none"><button class="sort-btn" type="button">Tonnage ↕</button></th>
          </tr></thead>
          <tbody>${ceilRows}</tbody>
        </table>
      </div>
    </section>

    <section class="card deferred-section">
      <h2 style="margin-top:0">Other ${s.sqft.toLocaleString()} Sq Ft Scenarios &amp; Nearby Sizes</h2>
      <div class="link-grid">
        ${[...siblings, ...nearby].map(n => `<a class="link-chip" href="/sqft/${n.slug}/">${escapeHtml(n.shortLabel)}<small>${n.recommendedBtu.toLocaleString()} BTU • ${n.tonnage} Ton</small></a>`).join('')}
      </div>
    </section>

    <section class="card deferred-section">
      <h2 style="margin-top:0">Frequently Asked Questions</h2>
      ${faqs.map(f => `<div class="faq-item"><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`).join('')}
    </section>`;

  writePage(`sqft/${s.slug}/index.html`, renderLayout({
    title: s.title,
    description: `${s.sqft.toLocaleString()} sq ft mini split sizing (${s.tier}): needs ${s.recommendedBtu.toLocaleString()} BTU (${s.tonnage} Tons), ${s.breaker} breaker, ~$${s.monthlyPeakCost}/mo peak electricity.`,
    canonicalPath: url,
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Sq Ft Sizing', url: '/#sqft' }, { name: s.shortLabel, url }],
    jsonLdGraph: [
      { '@type': 'WebApplication', name: s.title, url: `${SITE_URL}${url}`, applicationCategory: 'UtilitiesApplication' },
      buildDatasetSchema(s.title, `HVAC BTU, tonnage, electrical breaker, and SEER2 operating cost dataset for ${s.shortLabel}`, url),
      { '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
    ],
    mainHtml,
    sidebarLinks: defaultSidebar
  }));
}

// --- 2. Build 52 Room, Garage, Sunroom & Barn Space Guides (/spaces/...) ---
for (const sp of spaces) {
  const url = `/spaces/${sp.slug}/`;
  const related = spaces.filter(x => x.category === sp.category && x.slug !== sp.slug).slice(0, 6);

  const mainHtml = `
    <section id="hero-panel" class="hero-card">
      <h1>${escapeHtml(sp.name)} Mini Split Size: BTU, Tonnage &amp; Breaker</h1>
      <p class="hero-sub">Category: <strong>${escapeHtml(sp.category)}</strong> • Envelope: <strong>${sp.sqft.toLocaleString()} sq ft × ${sp.ceilingFt}' Ceiling</strong> • Recommended Zones: <strong>${sp.zonesRecommended}</strong>.</p>
      <div class="alert-banner ok"><strong>HVAC Engineer Field Note:</strong> ${escapeHtml(sp.engineeringNote)}</div>
      <div class="kpi-grid">
        <div class="kpi-box highlight"><div class="kpi-label">Recommended BTU</div><div class="kpi-val" id="out-btu">${sp.recommendedBtu.toLocaleString()} BTU</div><div class="kpi-sub">Calculated: <span id="out-raw">${sp.rawCoolingBtu.toLocaleString()} BTU/hr</span></div></div>
        <div class="kpi-box"><div class="kpi-label">Tonnage</div><div class="kpi-val" id="out-tons">${sp.tonnage} Tons</div><div class="kpi-sub">Running draw: ~${sp.runningWatts}W</div></div>
        <div class="kpi-box"><div class="kpi-label">Breaker &amp; Wire</div><div class="kpi-val" id="out-breaker">${sp.breaker}</div><div class="kpi-sub">${sp.voltage} • ${sp.wire}</div></div>
        <div class="kpi-box"><div class="kpi-label">Est. Energy Cost</div><div class="kpi-val" id="out-cost">$${sp.annualCost}/yr</div><div class="kpi-sub">~$${sp.monthlyPeakCost}/mo peak</div></div>
      </div>
    </section>

    <section class="card isolated-widget" id="hvac-calculator">
      <h2 style="margin-top:0">Fine-Tune Your ${escapeHtml(sp.name)} Load</h2>
      <div class="calc-grid">
        <div class="field"><label for="inp-sqft">Area (Sq Ft)</label><input id="inp-sqft" type="number" min="50" max="5000" value="${sp.sqft}"></div>
        <div class="field"><label for="inp-ceil">Ceiling Height (Ft)</label><input id="inp-ceil" type="number" min="7" max="20" step="0.5" value="${sp.ceilingFt}"></div>
        <div class="field"><label for="inp-ins">Insulation Factor</label>
          <select id="inp-ins">
            <option value="0.85">Spray Foam / Basement (0.85×)</option>
            <option value="1.0" selected>Standard Insulated (1.00×)</option>
            <option value="1.25">Uninsulated Garage / Bonus Room (1.25×)</option>
            <option value="1.45">Glass Sunroom / Greenhouse (1.45×)</option>
          </select>
        </div>
        <div class="field"><label for="inp-clim">Climate Zone</label>
          <select id="inp-clim">
            <option value="1.12">Hot South (Zone 1–2)</option>
            <option value="1.0" selected>Moderate (Zone 3–4)</option>
            <option value="1.22">Cold Winter Hyper-Heat (Zone 5–7)</option>
          </select>
        </div>
        <div class="field"><label for="inp-seer">SEER2 Rating</label><input id="inp-seer" type="number" min="14" max="32" value="20"></div>
        <div class="field"><label for="inp-rate">Electric Rate ($/kWh)</label><input id="inp-rate" type="number" min="0.06" max="0.60" step="0.01" value="0.16"></div>
      </div>
      <div id="out-verdict" class="alert-banner ok"></div>
      ${renderThermalSvg(sp.sqft, sp.ceilingFt, sp.recommendedBtu, sp.tonnage)}
      ${renderAffiliateCards(sp.recommendedBtu, sp.breaker)}
    </section>

    <div class="ad-slot ad-incontent" data-refresh="true" aria-label="In-Content Advertisement"><span>In-Content Display Ad Unit (336×280)</span></div>

    <section class="card deferred-section" id="sizing-table">
      <h2 style="margin-top:0">Related ${escapeHtml(sp.category)} Sizing Guides</h2>
      <div class="link-grid">
        ${related.map(r => `<a class="link-chip" href="/spaces/${r.slug}/">${escapeHtml(r.name)}<small>${r.recommendedBtu.toLocaleString()} BTU • ${r.breaker}</small></a>`).join('')}
      </div>
    </section>`;

  writePage(`spaces/${sp.slug}/index.html`, renderLayout({
    title: `${sp.name} Mini Split BTU Sizing Guide`,
    description: `${sp.name} mini split sizing: requires ${sp.recommendedBtu.toLocaleString()} BTU (${sp.tonnage} Ton), ${sp.breaker} circuit, and costs ~$${sp.monthlyPeakCost}/mo peak.`,
    canonicalPath: url,
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Rooms & Garages', url: '/#spaces' }, { name: sp.name, url }],
    jsonLdGraph: [
      { '@type': 'WebApplication', name: sp.name, url: `${SITE_URL}${url}`, applicationCategory: 'UtilitiesApplication' },
      buildDatasetSchema(sp.name, sp.engineeringNote, url)
    ],
    mainHtml,
    sidebarLinks: defaultSidebar
  }));
}

// --- 3. Build 60 Multi-Zone Condenser & Head Combination Pages (/multizone/...) ---
for (const m of multizone) {
  const url = `/multizone/${m.slug}/`;
  const related = multizone.filter(x => x.zones === m.zones && x.slug !== m.slug).slice(0, 8);

  const headRows = m.heads.map((h, i) => `<tr>
    <td data-label="Zone Port" data-sort="${i + 1}"><strong>Zone ${i + 1} Indoor Head</strong></td>
    <td data-label="Nominal Capacity" data-sort="${h}">${h.toLocaleString()} BTU</td>
    <td data-label="Est. Room Coverage" data-sort="${h}">${Math.round(h / 24)} – ${Math.round(h / 18)} sq ft</td>
    <td data-label="Share of Condenser" data-sort="${Math.round((h / m.totalHeadBtu) * 100)}">${Math.round((h / m.totalHeadBtu) * 100)}%</td>
  </tr>`).join('');

  const mainHtml = `
    <section id="hero-panel" class="hero-card">
      <h1>${escapeHtml(m.title)}</h1>
      <p class="hero-sub">Best Fit: <strong>${escapeHtml(m.useCase)}</strong> • Diversity Ratio: <strong>${m.diversityRatioPct}%</strong> (${escapeHtml(m.statusText)}).</p>
      <div class="kpi-grid">
        <div class="kpi-box highlight"><div class="kpi-label">Outdoor Condenser</div><div class="kpi-val">${m.condenserBtu.toLocaleString()} BTU</div><div class="kpi-sub">${(m.condenserBtu / 12000).toFixed(2)} Tons (${m.zones} Zones)</div></div>
        <div class="kpi-box"><div class="kpi-label">Combined Indoor Heads</div><div class="kpi-val">${m.totalHeadBtu.toLocaleString()} BTU</div><div class="kpi-sub">${m.diversityRatioPct}% Connected Ratio</div></div>
        <div class="kpi-box"><div class="kpi-label">Max Coverage Area</div><div class="kpi-val">~${m.maxCoverageSqFt.toLocaleString()} sq ft</div><div class="kpi-sub">Total conditioned footprint</div></div>
        <div class="kpi-box"><div class="kpi-label">Electrical Circuit</div><div class="kpi-val">${m.breaker}</div><div class="kpi-sub">${m.voltage} • ${m.wire}</div></div>
      </div>
      <div class="alert-banner ${m.diversityRatioPct <= 120 ? 'ok' : ''}"><strong>Multi-Zone Diversity Rule:</strong> Most Mitsubishi, Daikin, Fujitsu, and MRCOOL multi-zone condensers allow connected indoor head totals up to <strong>125%–130%</strong> of outdoor condenser capacity because bedrooms and living spaces rarely peak simultaneously.</div>
    </section>

    <section class="card" id="sizing-table">
      <h2 style="margin-top:0">Zone-by-Zone Head Allocation Breakdown</h2>
      <div class="table-container">
        <table data-sortable>
          <thead><tr>
            <th aria-sort="none"><button class="sort-btn" type="button">Zone ↕</button></th>
            <th aria-sort="none"><button class="sort-btn" type="button">Head BTU ↕</button></th>
            <th aria-sort="none"><button class="sort-btn" type="button">Room Sq Ft ↕</button></th>
            <th aria-sort="none"><button class="sort-btn" type="button">Load Share ↕</button></th>
          </tr></thead>
          <tbody>${headRows}</tbody>
        </table>
      </div>
      ${renderAffiliateCards(m.condenserBtu, m.breaker)}
    </section>

    <div class="ad-slot ad-incontent" data-refresh="true" aria-label="In-Content Advertisement"><span>In-Content Display Ad Unit (336×280)</span></div>

    <section class="card deferred-section">
      <h2 style="margin-top:0">Other ${m.zones}-Zone Mini Split Configurations</h2>
      <div class="link-grid">
        ${related.map(r => `<a class="link-chip" href="/multizone/${r.slug}/">${escapeHtml(r.shortLabel)}<small>${r.diversityRatioPct}% Ratio • ${r.breaker}</small></a>`).join('')}
      </div>
    </section>`;

  writePage(`multizone/${m.slug}/index.html`, renderLayout({
    title: m.title,
    description: `${m.shortLabel} multi-zone mini split specs: ${m.diversityRatioPct}% connected ratio, covers ~${m.maxCoverageSqFt} sq ft, requires ${m.breaker} (${m.wire}).`,
    canonicalPath: url,
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'Multi-Zone Matrices', url: '/#multizone' }, { name: m.shortLabel, url }],
    jsonLdGraph: [
      { '@type': 'WebApplication', name: m.title, url: `${SITE_URL}${url}`, applicationCategory: 'UtilitiesApplication' },
      buildDatasetSchema(m.title, `Multi-zone mini-split diversity ratio and breaker sizing dataset for ${m.shortLabel}`, url)
    ],
    mainHtml,
    sidebarLinks: defaultSidebar
  }));
}

// --- 4. Build 40 BTU Comparison, SEER2 & Electrical Breaker Pages (/compare/...) ---
for (const c of comparisons) {
  const url = `/compare/${c.slug}/`;
  const related = comparisons.filter(x => x.slug !== c.slug).slice(0, 8);

  const mainHtml = `
    <section id="hero-panel" class="hero-card">
      <h1>${escapeHtml(c.title)}</h1>
      <p class="hero-sub">${escapeHtml(c.summary)}</p>
      <div class="kpi-grid">
        <div class="kpi-box highlight"><div class="kpi-label">Option A Spec</div><div class="kpi-val">${c.btuA.toLocaleString()} BTU</div><div class="kpi-sub">${c.tonsA} Tons • ${c.breakerA}</div></div>
        <div class="kpi-box"><div class="kpi-label">Option B Spec</div><div class="kpi-val">${c.btuB.toLocaleString()} BTU</div><div class="kpi-sub">${c.tonsB} Tons • ${c.breakerB}</div></div>
        <div class="kpi-box"><div class="kpi-label">Option A Draw / Wire</div><div class="kpi-val">~${c.wattsA}W</div><div class="kpi-sub">${c.wireA}</div></div>
        <div class="kpi-box"><div class="kpi-label">Option B Draw / Wire</div><div class="kpi-val">~${c.wattsB}W</div><div class="kpi-sub">${c.wireB}</div></div>
      </div>
    </section>

    <section class="card" id="sizing-table">
      <h2 style="margin-top:0">Side-by-Side Technical Specification Matrix</h2>
      <div class="table-container">
        <table>
          <thead><tr><th>Parameter</th><th>Option A (${c.btuA.toLocaleString()} BTU)</th><th>Option B (${c.btuB.toLocaleString()} BTU)</th></tr></thead>
          <tbody>
            <tr><td data-label="Parameter"><strong>Cooling Tonnage</strong></td><td data-label="Option A">${c.tonsA} Tons</td><td data-label="Option B">${c.tonsB} Tons</td></tr>
            <tr><td data-label="Parameter"><strong>Typical Sq Ft Coverage</strong></td><td data-label="Option A">${Math.round(c.btuA / 24)} – ${Math.round(c.btuA / 18)} sq ft</td><td data-label="Option B">${Math.round(c.btuB / 24)} – ${Math.round(c.btuB / 18)} sq ft</td></tr>
            <tr><td data-label="Parameter"><strong>Breaker Size (MOP)</strong></td><td data-label="Option A">${c.breakerA}</td><td data-label="Option B">${c.breakerB}</td></tr>
            <tr><td data-label="Parameter"><strong>Copper Wire Gauge</strong></td><td data-label="Option A">${c.wireA}</td><td data-label="Option B">${c.wireB}</td></tr>
            <tr><td data-label="Parameter"><strong>Avg Running Watts</strong></td><td data-label="Option A">~${c.wattsA} W</td><td data-label="Option B">~${c.wattsB} W</td></tr>
          </tbody>
        </table>
      </div>
      ${renderAffiliateCards(c.btuB, c.breakerB)}
    </section>

    <div class="ad-slot ad-incontent" data-refresh="true" aria-label="In-Content Advertisement"><span>In-Content Display Ad Unit (336×280)</span></div>

    <section class="card deferred-section">
      <h2 style="margin-top:0">More Mini-Split Engineering &amp; SEER2 Guides</h2>
      <div class="link-grid">
        ${related.map(r => `<a class="link-chip" href="/compare/${r.slug}/">${escapeHtml(r.shortLabel)}</a>`).join('')}
      </div>
    </section>`;

  writePage(`compare/${c.slug}/index.html`, renderLayout({
    title: c.title,
    description: c.summary,
    canonicalPath: url,
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: 'SEER2 & Comparisons', url: '/#compare' }, { name: c.shortLabel, url }],
    jsonLdGraph: [
      { '@type': 'WebApplication', name: c.title, url: `${SITE_URL}${url}`, applicationCategory: 'UtilitiesApplication' },
      buildDatasetSchema(c.title, c.summary, url)
    ],
    mainHtml,
    sidebarLinks: defaultSidebar
  }));
}

// --- 5. Master Homepage (/) + 4 Compliance Pages + 404 ---
const homeMain = `
  <section id="hero-panel" class="hero-card">
    <h1>Mini-Split BTU, Tonnage, Garage Sizing &amp; Multi-Zone Matrix</h1>
    <p class="hero-sub">Calculate exact <strong>ACCA Manual-J inspired cooling &amp; heating BTU</strong>, prevent humidity short-cycling, verify 208/230V breaker &amp; wire gauge specs, and compare 20+ SEER2 operating costs across 241 pre-engineered pages.</p>
    <div class="kpi-grid">
      <div class="kpi-box highlight"><div class="kpi-label">Recommended Size</div><div class="kpi-val" id="out-btu">12,000 BTU</div><div class="kpi-sub">Raw load: <span id="out-raw">11,000 BTU/hr</span></div></div>
      <div class="kpi-box"><div class="kpi-label">HVAC Tonnage</div><div class="kpi-val" id="out-tons">1.00 Tons</div></div>
      <div class="kpi-box"><div class="kpi-label">Breaker &amp; Voltage</div><div class="kpi-val" id="out-breaker">15A–20A</div></div>
      <div class="kpi-box"><div class="kpi-label">Est. Operating Cost</div><div class="kpi-val" id="out-cost">$65/yr</div></div>
    </div>
  </section>

  <section class="card isolated-widget" id="hvac-calculator">
    <h2 style="margin-top:0">Master Room &amp; Garage Mini-Split BTU Calculator</h2>
    <div class="calc-grid">
      <div class="field"><label for="inp-sqft">Room Area (Sq Ft)</label><input id="inp-sqft" type="number" min="50" max="5000" value="500"></div>
      <div class="field"><label for="inp-ceil">Ceiling Height (Feet)</label><input id="inp-ceil" type="number" min="7" max="20" step="0.5" value="8"></div>
      <div class="field"><label for="inp-ins">Insulation Quality</label>
        <select id="inp-ins">
          <option value="0.85">Spray Foam / Tight New Build (0.85×)</option>
          <option value="1.0" selected>Standard Insulated Room (1.00×)</option>
          <option value="1.25">Uninsulated Garage / Bonus Room (1.25×)</option>
          <option value="1.45">Glass Sunroom / Metal Wall (1.45×)</option>
        </select>
      </div>
      <div class="field"><label for="inp-clim">Climate Zone</label>
        <select id="inp-clim">
          <option value="1.12">Hot South / Desert (Zone 1–2)</option>
          <option value="1.0" selected>Moderate Mixed (Zone 3–4)</option>
          <option value="1.22">Cold Winter Hyper-Heat (Zone 5–7)</option>
        </select>
      </div>
      <div class="field"><label for="inp-seer">Unit Efficiency (SEER2)</label><input id="inp-seer" type="number" min="14" max="32" value="20"></div>
      <div class="field"><label for="inp-rate">Electric Rate ($/kWh)</label><input id="inp-rate" type="number" min="0.06" max="0.60" step="0.01" value="0.16"></div>
    </div>
    <div id="out-verdict" class="alert-banner ok"></div>
    ${renderThermalSvg(500, 8, 12000, 1.0)}
  </section>

  <section class="card deferred-section" id="sqft">
    <h2 style="margin-top:0">Square-Footage Mini-Split BTU Charts (84 Pages)</h2>
    <div class="link-grid">
      ${sqftPages.filter(s => s.insulationFactor === 1.0 && s.climateFactor === 1.0).map(s => `<a class="link-chip" href="/sqft/${s.slug}/">${escapeHtml(s.shortLabel)}<small>${s.recommendedBtu.toLocaleString()} BTU • ${s.tonnage} Ton</small></a>`).join('')}
    </div>
  </section>

  <section class="card deferred-section" id="spaces">
    <h2 style="margin-top:0">Garage, Bonus Room, Sunroom &amp; Pole Barn Guides (52 Pages)</h2>
    <div class="link-grid">
      ${spaces.slice(0, 24).map(sp => `<a class="link-chip" href="/spaces/${sp.slug}/">${escapeHtml(sp.name)}<small>${sp.recommendedBtu.toLocaleString()} BTU • ${sp.breaker}</small></a>`).join('')}
    </div>
  </section>

  <section class="card deferred-section" id="multizone">
    <h2 style="margin-top:0">Multi-Zone Condenser &amp; Head Combinations (60 Pages)</h2>
    <div class="link-grid">
      ${multizone.slice(0, 24).map(m => `<a class="link-chip" href="/multizone/${m.slug}/">${escapeHtml(m.shortLabel)}<small>${m.diversityRatioPct}% Ratio • ~${m.maxCoverageSqFt} sq ft</small></a>`).join('')}
    </div>
  </section>

  <section class="card deferred-section" id="compare">
    <h2 style="margin-top:0">BTU Comparisons, SEER2 Payback &amp; Breaker Guides (40 Pages)</h2>
    <div class="link-grid">
      ${comparisons.slice(0, 24).map(c => `<a class="link-chip" href="/compare/${c.slug}/">${escapeHtml(c.shortLabel)}</a>`).join('')}
    </div>
  </section>`;

writePage('index.html', renderLayout({
  title: 'Mini-Split BTU Calculator, Garage Sizing, Multi-Zone & SEER2 Matrix',
  description: 'Calculate exact mini-split BTU, HVAC tonnage, 230V breaker size, multi-zone diversity ratios, and SEER2 operating costs across 241 room and garage guides.',
  canonicalPath: '/',
  breadcrumbs: [{ name: 'Home', url: '/' }],
  jsonLdGraph: [
    { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_URL}/` },
    buildDatasetSchema('MiniSplitBTUMatrix HVAC Sizing Dataset', 'Room & garage square-footage BTU sizing, multi-zone condenser ratios, and SEER2 operating cost datasets.', '/')
  ],
  mainHtml: homeMain,
  sidebarLinks: defaultSidebar
}));

const compliancePages = [
  { slug: 'about', title: 'ACCA Thermal Sizing Methodology', body: `<p><strong>${SITE_NAME}</strong> models room cooling and heating loads starting from a 22 BTU/sq ft baseline at 8-foot ceilings, scaled proportionally for ceiling volume, insulation R-value, IECC climate zone, and internal appliance/electronics heat gains (3.412 BTU/hr per Watt).</p>` },
  { slug: 'privacy-policy', title: 'Privacy Policy', body: `<p>${SITE_NAME} runs all BTU and SEER2 calculations locally in your browser without collecting personal data. Advertising partners such as Google AdSense may use cookies for relevant display ads.</p>` },
  { slug: 'terms', title: 'Terms of Use & HVAC Disclaimer', body: `<p>Sizing charts and breaker specifications on ${SITE_NAME} are intended for preliminary planning. Always verify equipment nameplate MCA/MOP ratings and consult a licensed HVAC technician or electrician before installation.</p>` },
  { slug: 'contact', title: 'Contact MiniSplitBTUMatrix', body: `<p>Questions about multi-zone diversity ratios or commercial heat-load modeling? Email <strong>hvac@minisplitbtumatrix.com</strong>.</p>` }
];

for (const cp of compliancePages) {
  writePage(`${cp.slug}/index.html`, renderLayout({
    title: cp.title,
    description: `${cp.title} for ${SITE_NAME}.`,
    canonicalPath: `/${cp.slug}/`,
    breadcrumbs: [{ name: 'Home', url: '/' }, { name: cp.title, url: `/${cp.slug}/` }],
    jsonLdGraph: [{ '@type': 'WebPage', name: cp.title, url: `${SITE_URL}/${cp.slug}/` }],
    mainHtml: `<section id="hero-panel" class="hero-card"><h1>${escapeHtml(cp.title)}</h1>${cp.body}</section>`,
    sidebarLinks: defaultSidebar
  }));
}

writePage('404.html', renderLayout({
  title: 'Page Not Found (404)',
  description: 'The requested mini-split sizing page could not be found.',
  canonicalPath: '/404.html',
  breadcrumbs: [{ name: 'Home', url: '/' }, { name: '404', url: '/404.html' }],
  jsonLdGraph: [{ '@type': 'WebPage', name: '404 Not Found' }],
  mainHtml: `<section id="hero-panel" class="hero-card"><h1>404 — Sizing Guide Not Found</h1><p>Use the search bar above or return to the <a href="/">MiniSplitBTUMatrix Calculator</a>.</p></section>`,
  sidebarLinks: defaultSidebar
}));

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map(u => `  <url><loc>${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`;
writePage('sitemap.xml', sitemapXml);
writePage('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
writePage('ads.txt', `# Replace pub-0000000000000000 with your Google AdSense Publisher ID\ngoogle.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n`);
writePage('_headers', `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: SAMEORIGIN\n`);
writePage('_redirects', `/index.html / 301\n`);
writePage('.assetsignore', `wrangler.jsonc\nsrc/\n`);
writePage('wrangler.jsonc', JSON.stringify({ name: 'minisplit-btu-matrix', compatibility_date: '2025-09-27', assets: { directory: './', not_found_handling: '404-page' } }, null, 2));
writePage('src/build.js', `console.log('[MiniSplitBTUMatrix] Pre-built static dist assets ready for Cloudflare deployment.');\n`);

console.log(`[MiniSplitBTUMatrix SSG] Built ${sitemapUrls.length} static HTML pages (+ 404.html) in dist/!`);
