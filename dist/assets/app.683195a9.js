/* MiniSplitBTUMatrix — Interactive Thermal BTU, Tonnage, SEER2 Cost & Sortable Table Engine */
(() => {
  // 1. Adaptive Color-Scheme Toggle via <meta name="color-scheme">
  const metaScheme = document.querySelector('meta[name="color-scheme"]');
  const themeBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('minisplit-theme');
  if (savedTheme && metaScheme) metaScheme.setAttribute('content', savedTheme);
  if (themeBtn && metaScheme) {
    const syncLabel = () => {
      const cur = metaScheme.getAttribute('content');
      themeBtn.textContent = cur === 'dark' ? '☀️ Light' : cur === 'light' ? '🌓 Auto' : '🌙 Dark';
    };
    syncLabel();
    themeBtn.addEventListener('click', () => {
      const cur = metaScheme.getAttribute('content');
      const next = cur === 'light dark' ? 'dark' : cur === 'dark' ? 'light' : 'light dark';
      metaScheme.setAttribute('content', next);
      localStorage.setItem('minisplit-theme', next);
      syncLabel();
    });
  }

  // 2. Global Quick-Jump Search Bar (<search> + <datalist>)
  const jumpInput = document.getElementById('quick-jump');
  if (jumpInput) {
    jumpInput.addEventListener('change', () => {
      const val = jumpInput.value.trim();
      const opts = document.querySelectorAll('#hvac-pages-list option');
      for (const opt of opts) {
        if (opt.value === val && opt.dataset.url) {
          window.location.href = opt.dataset.url;
          return;
        }
      }
    });
  }

  // 3. Live Manual-J Inspired BTU, Tonnage, Breaker & SEER2 Calculator
  const calcEl = document.getElementById('hvac-calculator');
  if (calcEl) {
    const STANDARD_SIZES = [6000, 9000, 12000, 15000, 18000, 24000, 30000, 36000, 42000, 48000, 60000];
    const pickBtu = raw => STANDARD_SIZES.find(s => s >= raw * 0.96) || 60000;
    const getElec = btu => {
      if (btu <= 9000) return { v: '115V / 230V', brk: '15A', wire: '14/12 AWG', w: 680 };
      if (btu <= 12000) return { v: '115V / 230V', brk: '15A–20A', wire: '12 AWG', w: 920 };
      if (btu <= 18000) return { v: '208/230V', brk: '20A 2-Pole', wire: '12 AWG', w: 1380 };
      if (btu <= 24000) return { v: '208/230V', brk: '25A–30A 2-Pole', wire: '10 AWG', w: 1850 };
      if (btu <= 30000) return { v: '208/230V', brk: '30A 2-Pole', wire: '10 AWG', w: 2350 };
      if (btu <= 36000) return { v: '208/230V', brk: '35A–40A 2-Pole', wire: '8 AWG', w: 2850 };
      if (btu <= 48000) return { v: '208/230V', brk: '45A–50A 2-Pole', wire: '8/6 AWG', w: 3750 };
      return { v: '208/230V', brk: '60A 2-Pole', wire: '6 AWG', w: 4650 };
    };

    const inpSqft = document.getElementById('inp-sqft');
    const inpCeil = document.getElementById('inp-ceil');
    const inpIns = document.getElementById('inp-ins');
    const inpClim = document.getElementById('inp-clim');
    const inpSeer = document.getElementById('inp-seer');
    const inpRate = document.getElementById('inp-rate');

    const outBtu = document.getElementById('out-btu');
    const outTons = document.getElementById('out-tons');
    const outBreaker = document.getElementById('out-breaker');
    const outCost = document.getElementById('out-cost');
    const outRaw = document.getElementById('out-raw');
    const outVerdict = document.getElementById('out-verdict');
    const svgRoomLabel = document.getElementById('svg-room-label');
    const svgBtuLabel = document.getElementById('svg-btu-label');

    const recalc = () => {
      const sf = Math.max(50, parseFloat(inpSqft?.value || '500'));
      const ceil = Math.max(7, parseFloat(inpCeil?.value || '8'));
      const ins = parseFloat(inpIns?.value || '1.0');
      const clim = parseFloat(inpClim?.value || '1.0');
      const seer = Math.max(13, parseFloat(inpSeer?.value || '20'));
      const rate = Math.max(0.05, parseFloat(inpRate?.value || '0.16'));

      const rawBtu = Math.round(sf * 22 * (ceil / 8) * ins * clim);
      const recBtu = pickBtu(rawBtu);
      const tons = (recBtu / 12000).toFixed(2);
      const elec = getElec(recBtu);

      const annualKwh = Math.round((recBtu / seer / 1000) * 1100 * 0.62);
      const annualCost = Math.round(annualKwh * rate);
      const monthlyPeak = Math.round((elec.w / 1000) * 0.65 * 8 * 30 * rate);

      if (outBtu) outBtu.textContent = `${recBtu.toLocaleString()} BTU`;
      if (outTons) outTons.textContent = `${tons} Tons`;
      if (outBreaker) outBreaker.textContent = `${elec.brk} (${elec.v})`;
      if (outCost) outCost.textContent = `$${annualCost}/yr (~$${monthlyPeak}/mo)`;
      if (outRaw) outRaw.textContent = `${rawBtu.toLocaleString()} BTU/hr`;

      if (outVerdict) {
        const oversize = recBtu > rawBtu * 1.32;
        if (oversize) {
          outVerdict.className = 'alert-banner';
          outVerdict.innerHTML = `<strong>Oversizing / Humidity Short-Cycling Alert:</strong> Your calculated load is <strong>${rawBtu.toLocaleString()} BTU/hr</strong>, while ${recBtu.toLocaleString()} BTU sits >32% higher. Choose a variable-speed inverter with low minimum modulation (30% turndown) so the room stays dry instead of cold and clammy.`;
        } else if (clim >= 1.20) {
          outVerdict.className = 'alert-banner';
          outVerdict.innerHTML = `<strong>Cold-Climate Hyper-Heat Required:</strong> Standard mini-splits lose 40% capacity below 15°F. Specify a <strong>Hyper-Heat (-13°F)</strong> ${recBtu.toLocaleString()} BTU chassis (${elec.brk} / ${elec.wire} circuit) for reliable winter heating.`;
        } else {
          outVerdict.className = 'alert-banner ok';
          outVerdict.innerHTML = `<strong>Optimal Inverter Match:</strong> A <strong>${recBtu.toLocaleString()} BTU (${tons}-Ton)</strong> ${seer} SEER2 inverter mini-split matches your ${rawBtu.toLocaleString()} BTU/hr load cleanly on a <strong>${elec.brk} (${elec.wire})</strong> circuit (~$${monthlyPeak}/mo peak).`;
        }
      }
      if (svgRoomLabel) svgRoomLabel.textContent = `${sf.toLocaleString()} sq ft × ${ceil}' Ceiling`;
      if (svgBtuLabel) svgBtuLabel.textContent = `${recBtu.toLocaleString()} BTU (${tons} Ton)`;
    };

    [inpSqft, inpCeil, inpIns, inpClim, inpSeer, inpRate].forEach(el => {
      if (el) { el.addEventListener('input', recalc); el.addEventListener('change', recalc); }
    });
    recalc();
  }

  // 4. Sortable Tables using Element.prototype.moveBefore() + View Transitions
  document.querySelectorAll('table[data-sortable]').forEach(table => {
    const tbody = table.querySelector('tbody');
    const headers = table.querySelectorAll('th[aria-sort]');
    headers.forEach((th, colIdx) => {
      const btn = th.querySelector('.sort-btn');
      if (!btn || !tbody) return;
      btn.addEventListener('click', () => {
        const curDir = th.getAttribute('aria-sort');
        const nextDir = curDir === 'ascending' ? 'descending' : 'ascending';
        headers.forEach(h => h.setAttribute('aria-sort', 'none'));
        th.setAttribute('aria-sort', nextDir);

        const rows = Array.from(tbody.querySelectorAll('tr'));
        rows.sort((a, b) => {
          const av = a.children[colIdx]?.dataset.sort ?? a.children[colIdx]?.textContent.trim() ?? '';
          const bv = b.children[colIdx]?.dataset.sort ?? b.children[colIdx]?.textContent.trim() ?? '';
          const an = parseFloat(av.replace(/[^0-9.-]/g, ''));
          const bn = parseFloat(bv.replace(/[^0-9.-]/g, ''));
          const cmp = (!Number.isNaN(an) && !Number.isNaN(bn)) ? an - bn : av.localeCompare(bv);
          return nextDir === 'ascending' ? cmp : -cmp;
        });

        const applyOrder = () => {
          rows.forEach(row => {
            if (typeof tbody.moveBefore === 'function') tbody.moveBefore(row, null);
            else tbody.append(row);
          });
        };
        if (typeof table.startViewTransition === 'function') table.startViewTransition(applyOrder);
        else applyOrder();
      });
    });
  });

  // 5. 35-Second Active-View Ad Refresh Loop
  const adSlots = document.querySelectorAll('.ad-slot[data-refresh="true"]');
  if (adSlots.length && 'IntersectionObserver' in window) {
    const visible = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
    }, { threshold: 0.5 });
    adSlots.forEach(s => io.observe(s));
    setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      visible.forEach(slot => {
        slot.dataset.impressions = String(parseInt(slot.dataset.impressions || '1', 10) + 1);
      });
    }, 35000);
  }
  // 6. Retention & Dwell-Time Suite: Payback Simulator, BOM Checklist, Share/Print & Saved Binder
  const payRoot = document.getElementById('payback-simulator');
  const payCurrent = document.getElementById('pay-current');
  const payInstall = document.getElementById('pay-install');
  const syncPayback = () => {
    if (!payRoot || !payCurrent || !payInstall) return;
    const btuTxt = document.getElementById('out-btu')?.textContent || payRoot.dataset.btu || '12000';
    const btu = Math.max(6000, parseInt(btuTxt.replace(/[^0-9]/g, ''), 10) || 12000);
    const rate = Math.max(0.06, parseFloat(document.getElementById('inp-rate')?.value || '0.16'));
    const installCost = Math.max(400, parseFloat(payInstall.value || '1600'));
    // Annual heating/cooling thermal load in MMBtu scaled to unit capacity
    const annualMmbtu = (btu / 12000) * 14.5;
    // Mini-split average seasonal COP ~3.1
    const miniSplitAnnual = Math.round(((annualMmbtu * 293.07) / 3.1) * rate);
    const multipliers = { baseboard: 3.1, window: 2.15, propane: 2.25, oil: 2.45 };
    const oldAnnual = Math.round(miniSplitAnnual * (multipliers[payCurrent.value] || 2.5));
    const annualSavings = Math.max(85, oldAnnual - miniSplitAnnual);
    const fiveYrNet = annualSavings * 5 - installCost;
    const yrs = (installCost / annualSavings).toFixed(1);

    const elA = document.getElementById('pay-annual');
    const el5 = document.getElementById('pay-5yr');
    const elY = document.getElementById('pay-years');
    if (elA) elA.textContent = `$${annualSavings.toLocaleString()}/yr`;
    if (el5) el5.textContent = `${fiveYrNet >= 0 ? '+' : ''}$${fiveYrNet.toLocaleString()}`;
    if (elY) elY.textContent = `${yrs} yrs`;
  };
  if (payRoot) {
    payCurrent?.addEventListener('change', syncPayback);
    payInstall?.addEventListener('input', syncPayback);
    ['inp-sqft', 'inp-ceil', 'inp-ins', 'inp-clim', 'inp-seer', 'inp-rate'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', syncPayback);
      document.getElementById(id)?.addEventListener('change', syncPayback);
    });
    syncPayback();
  }

  // URL Query Param Hydrator + Copy Share Link + Print
  const urlParams = new URLSearchParams(window.location.search);
  ['sqft', 'ceil', 'ins', 'clim', 'seer', 'rate'].forEach(k => {
    if (urlParams.has(k)) {
      const el = document.getElementById('inp-' + k);
      if (el) { el.value = urlParams.get(k); el.dispatchEvent(new Event('input', { bubbles: true })); }
    }
  });
  document.getElementById('btn-copy-link')?.addEventListener('click', (e) => {
    const q = new URLSearchParams();
    ['sqft', 'ceil', 'ins', 'clim', 'seer', 'rate'].forEach(k => {
      const v = document.getElementById('inp-' + k)?.value;
      if (v) q.set(k, v);
    });
    const fullUrl = `${window.location.origin}${window.location.pathname}?${q.toString()}`;
    navigator.clipboard?.writeText(fullUrl).then(() => {
      e.target.textContent = '✓ Spec Link Copied!';
      setTimeout(() => { e.target.textContent = '🔗 Copy Shareable Link'; }, 2200);
    });
  });
  document.getElementById('btn-print-sheet')?.addEventListener('click', () => window.print());

  // Interactive BOM Checklist (localStorage per page)
  const bomRoot = document.getElementById('hvac-bom-checklist');
  if (bomRoot) {
    const key = 'minisplit-bom:' + window.location.pathname;
    const rows = Array.from(bomRoot.querySelectorAll('.bom-row'));
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) {}
    const syncBom = () => {
      let checked = 0, sum = 0;
      const next = {};
      rows.forEach(r => {
        const id = r.dataset.bomId;
        const chk = r.querySelector('input[type="checkbox"]');
        const p = Math.max(0, Number(r.querySelector('.bom-price-input')?.value || 0));
        sum += p;
        if (chk?.checked) { checked++; r.classList.add('checked'); } else r.classList.remove('checked');
        next[id] = { checked: !!chk?.checked, price: p };
      });
      const prog = document.getElementById('bom-progress-txt');
      const tot = document.getElementById('bom-grand-total');
      if (prog) prog.textContent = `${checked} / ${rows.length} Checked`;
      if (tot) tot.textContent = `$${sum.toLocaleString()}`;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch (_) {}
    };
    rows.forEach(r => {
      const id = r.dataset.bomId;
      const chk = r.querySelector('input[type="checkbox"]');
      const inp = r.querySelector('.bom-price-input');
      if (saved[id]) {
        if (chk) chk.checked = !!saved[id].checked;
        if (inp && typeof saved[id].price === 'number') inp.value = String(saved[id].price);
      }
      chk?.addEventListener('change', syncBom);
      inp?.addEventListener('input', syncBom);
    });
    syncBom();
  }

  // Saved HVAC Zones Project Binder Drawer (localStorage site-wide)
  const BINDER_KEY = 'minisplit-binder-v1';
  const drawer = document.getElementById('project-binder-drawer');
  const backdrop = document.getElementById('binder-backdrop');
  const countEl = document.getElementById('binder-count');
  const listEl = document.getElementById('binder-items-list');
  const getBinder = () => { try { return JSON.parse(localStorage.getItem(BINDER_KEY) || '[]'); } catch (_) { return []; } };
  const setBinder = arr => { try { localStorage.setItem(BINDER_KEY, JSON.stringify(arr)); } catch (_) {} };
  const renderBinder = () => {
    const items = getBinder();
    if (countEl) countEl.textContent = String(items.length);
    if (!listEl) return;
    if (!items.length) {
      listEl.innerHTML = '<p style="font-size:0.84rem;color:var(--text-muted)">No saved rooms yet. Click <strong>📌 Save Zone to Binder</strong> on any room or garage page to build your multi-room HVAC plan.</p>';
      return;
    }
    listEl.innerHTML = items.map((it, i) => `
      <div class="binder-item">
        <strong>${it.label}</strong>
        <div style="font-family:var(--font-mono);margin:4px 0">${it.spec}</div>
        <div style="font-size:0.74rem;color:var(--text-muted)">${it.date}</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <a href="${it.url}" class="action-pill" style="text-decoration:none">Open →</a>
          <button type="button" class="action-pill" data-del-binder="${i}">Delete</button>
        </div>
      </div>`).join('');
  };
  const openDrawer = () => { drawer?.classList.add('open'); backdrop?.classList.add('open'); renderBinder(); };
  const closeDrawer = () => { drawer?.classList.remove('open'); backdrop?.classList.remove('open'); };
  document.getElementById('btn-open-binder')?.addEventListener('click', openDrawer);
  document.getElementById('btn-close-binder')?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);
  document.getElementById('btn-save-zone')?.addEventListener('click', () => {
    const btu = document.getElementById('out-btu')?.textContent || '';
    const brk = document.getElementById('out-breaker')?.textContent || '';
    const label = window.prompt('Name this room/zone (e.g., 2-Car Garage, Master Bedroom):', document.querySelector('h1')?.textContent.slice(0, 38) || 'HVAC Zone');
    if (!label) return;
    const items = getBinder();
    items.unshift({ label: label.trim(), spec: `${btu} • ${brk}`, url: window.location.pathname, date: new Date().toLocaleDateString() });
    setBinder(items.slice(0, 20));
    renderBinder();
    openDrawer();
  });
  listEl?.addEventListener('click', (e) => {
    const del = e.target.closest('button[data-del-binder]');
    if (!del) return;
    const items = getBinder();
    items.splice(Number(del.dataset.delBinder), 1);
    setBinder(items);
    renderBinder();
  });
  renderBinder();
})();
