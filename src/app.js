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
})();
