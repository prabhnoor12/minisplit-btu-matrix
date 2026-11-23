/**
 * MiniSplitBTUMatrix — Verified ACCA Manual J Inspired Thermal Load & Mini-Split Sizing Seeder
 * Generates 236 high-search-volume items (+ 5 core/compliance pages = 241 total static HTML pages):
 *  - 84 Square-Footage & Ceiling-Height BTU Sizing Pages (/sqft/...)
 *  - 52 Garage, Bonus Room, Sunroom, Pole Barn & Specialty Space Guides (/spaces/...)
 *  - 60 Multi-Zone Condenser & Head Combination Matrices (/multizone/...)
 *  - 40 BTU Head-to-Head, SEER2 Operating Cost & Electrical Breaker Guides (/compare/...)
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const STANDARD_SIZES = [6000, 9000, 12000, 15000, 18000, 24000, 30000, 36000, 42000, 48000, 60000];

function pickStandardBtu(rawBtu) {
  for (const s of STANDARD_SIZES) {
    if (s >= rawBtu * 0.96) return s;
  }
  return 60000;
}

function getElectricalSpec(btu) {
  if (btu <= 9000) return { voltage: '115V or 208/230V', breaker: '15A', wire: '14 AWG Copper (12 AWG rec.)', runningWatts: 680 };
  if (btu <= 12000) return { voltage: '115V or 208/230V', breaker: '15A–20A', wire: '12 AWG Copper', runningWatts: 920 };
  if (btu <= 18000) return { voltage: '208/230V', breaker: '20A Double-Pole', wire: '12 AWG Copper (12/2 + G)', runningWatts: 1380 };
  if (btu <= 24000) return { voltage: '208/230V', breaker: '25A–30A Double-Pole', wire: '10 AWG Copper (10/2 + G)', runningWatts: 1850 };
  if (btu <= 30000) return { voltage: '208/230V', breaker: '30A Double-Pole', wire: '10 AWG Copper', runningWatts: 2350 };
  if (btu <= 36000) return { voltage: '208/230V', breaker: '35A–40A Double-Pole', wire: '8 AWG Copper', runningWatts: 2850 };
  if (btu <= 48000) return { voltage: '208/230V', breaker: '45A–50A Double-Pole', wire: '8 AWG THHN / 6 AWG Romex', runningWatts: 3750 };
  return { voltage: '208/230V', breaker: '60A Double-Pole', wire: '6 AWG Copper THHN', runningWatts: 4650 };
}

function computeHvac(sqft, ceilingFt, insulationFactor, climateFactor, sunFactor = 1.0, internalHeatBtu = 0) {
  // Base ACCA rule: 22 BTU/sq ft at 8ft ceiling, average insulation, Zone 3-4
  const heightMult = ceilingFt / 8;
  const rawCoolingBtu = Math.round(sqft * 22 * heightMult * insulationFactor * climateFactor * sunFactor + internalHeatBtu);
  const rawHeatingBtu = Math.round(rawCoolingBtu * 1.18); // Cold-climate hyper-heat sizing buffer
  const recommendedBtu = pickStandardBtu(rawCoolingBtu);
  const tonnage = +(recommendedBtu / 12000).toFixed(2);
  const elec = getElectricalSpec(recommendedBtu);

  // Annual cooling + shoulder-season operating cost at 20 SEER2, $0.16/kWh, 1,100 equiv full-load hours
  const annualKwh = Math.round((recommendedBtu / 20 / 1000) * 1100 * 0.62); // inverter partial-load modulation
  const annualCost = Math.round(annualKwh * 0.16);
  const monthlyPeakCost = Math.round((elec.runningWatts / 1000) * 0.65 * 8 * 30 * 0.16);
  const zonesRecommended = sqft <= 850 ? 1 : sqft <= 1500 ? 2 : sqft <= 2200 ? 3 : 4;

  return {
    sqft, ceilingFt, rawCoolingBtu, rawHeatingBtu, recommendedBtu, tonnage,
    voltage: elec.voltage, breaker: elec.breaker, wire: elec.wire, runningWatts: elec.runningWatts,
    annualKwh, annualCost, monthlyPeakCost, zonesRecommended,
    shortCycleRisk: recommendedBtu > rawCoolingBtu * 1.35 ? 'High (Humidity / Short-Cycling Risk)' : 'Low (Inverter Modulates Down to 30%)'
  };
}

// 1. 84 Square-Footage BTU Sizing Pages (28 Square Footages × 3 Insulation/Climate Tiers)
const sqftList = [
  150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800,
  900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1800, 2000, 2200, 2400, 2500, 3000
];

const sqftPages = [];
for (const sf of sqftList) {
  // Tier A: Standard Insulated Living Space (8ft ceiling)
  const mStd = computeHvac(sf, 8, 1.0, 1.0);
  sqftPages.push({
    slug: `${sf}-sq-ft-mini-split-size-btu-calculator`,
    title: `What Size Mini Split for ${sf.toLocaleString()} Sq Ft? Exact BTU, Tonnage & Breaker Guide`,
    shortLabel: `${sf.toLocaleString()} Sq Ft (Standard 8' Ceiling)`,
    tier: 'Standard Insulated Room (8 ft Ceiling)',
    insulationFactor: 1.0, climateFactor: 1.0,
    ...mStd
  });
  // Tier B: Poorly Insulated / Garage / Hot Climate (+30% Thermal Load)
  const mHot = computeHvac(sf, 9, 1.25, 1.12);
  sqftPages.push({
    slug: `${sf}-sq-ft-uninsulated-garage-or-hot-climate-mini-split-btu`,
    title: `${sf.toLocaleString()} Sq Ft Garage or Hot-Climate Mini Split BTU Sizing (9' Ceiling)`,
    shortLabel: `${sf.toLocaleString()} Sq Ft (Garage / Hot Climate)`,
    tier: 'Uninsulated Garage / Southern Climate (9 ft Ceiling)',
    insulationFactor: 1.25, climateFactor: 1.12,
    ...mHot
  });
  // Tier C: Cold-Climate Hyper-Heat (-13°F) Sizing
  const mCold = computeHvac(sf, 8, 1.05, 1.22);
  sqftPages.push({
    slug: `${sf}-sq-ft-cold-climate-hyper-heat-mini-split-btu`,
    title: `${sf.toLocaleString()} Sq Ft Cold-Climate Heat Pump Mini Split Size (-13°F Heating BTU)`,
    shortLabel: `${sf.toLocaleString()} Sq Ft (Cold-Climate Heating)`,
    tier: 'Cold-Climate Hyper-Heat Pump (Zone 5–7 Winter)',
    insulationFactor: 1.05, climateFactor: 1.22,
    ...mCold
  });
}

// 2. 52 High-Intent Room, Garage, Sunroom, Barn & Specialty Space Guides (/spaces/...)
const spaceTemplates = [
  { slug: '1-car-garage-mini-split-size-btu', name: '1-Car Garage (12×22 / 264 Sq Ft)', category: 'Garages & Workshops', sf: 264, ceil: 9, ins: 1.30, clim: 1.05, heat: 500, note: 'Uninsulated steel garage doors radiate massive afternoon solar heat. Adding an R-8 foam door kit cuts required cooling BTU by 25%.' },
  { slug: '2-car-garage-insulated-mini-split-size', name: '2-Car Insulated Garage (20×22 / 440 Sq Ft)', category: 'Garages & Workshops', sf: 440, ceil: 9, ins: 1.05, clim: 1.05, heat: 800, note: 'An insulated 2-car garage with R-13 walls and insulated door stays comfortable year-round on a single 12,000 to 18,000 BTU 230V inverter head.' },
  { slug: '2-car-garage-uninsulated-mini-split-size', name: '2-Car Uninsulated Garage (24×24 / 576 Sq Ft)', category: 'Garages & Workshops', sf: 576, ceil: 10, ins: 1.38, clim: 1.08, heat: 1200, note: 'Without ceiling insulation, attic roof deck radiation can push a 24×24 garage over 110°F. Size up to 24,000 BTU (2-Ton) or blow R-30 cellulose above the ceiling first.' },
  { slug: '3-car-garage-mini-split-btu-size', name: '3-Car Garage & Home Gym (24×36 / 864 Sq Ft)', category: 'Garages & Workshops', sf: 864, ceil: 10, ins: 1.18, clim: 1.05, heat: 1500, note: 'For a 36-foot wide 3-car garage, either mount one 24,000–30,000 BTU high-throw wall head on the short end wall or use a dual-zone 12k+12k setup for even airflow.' },
  { slug: 'detached-workshop-garage-24x30-mini-split', name: '24×30 Detached Woodworking Shop (720 Sq Ft)', category: 'Garages & Workshops', sf: 720, ceil: 10, ins: 1.12, clim: 1.05, heat: 1800, note: 'Clean the mini-split washable mesh filters every 2 weeks in woodworking shops, and mount the indoor head away from table-saw dust plumes.' },
  { slug: 'pole-barn-30x40-mini-split-btu-sizing', name: '30×40 Insulated Pole Barn Shop (1,200 Sq Ft, 12\' Ceiling)', category: 'Pole Barns & Metal Buildings', sf: 1200, ceil: 12, ins: 1.15, clim: 1.05, heat: 2000, note: 'High 12-foot ceilings increase air volume by 50% over standard rooms. Pair a 36,000 BTU mini-split (or dual 18k heads) with two 60" HVLS ceiling fans for winter destratification.' },
  { slug: 'pole-barn-40x60-mini-split-hvac-sizing', name: '40×60 Metal Building / Barndominium Shop (2,400 Sq Ft, 14\' Ceiling)', category: 'Pole Barns & Metal Buildings', sf: 2400, ceil: 14, ins: 1.15, clim: 1.05, heat: 3000, note: 'A 2,400 sq ft high-bay shop needs 5 to 6 tons of capacity—best served by two independent 36,000 BTU single-zone units for redundancy and lower installation cost.' },
  { slug: 'metal-building-20x30-spray-foam-mini-split', name: '20×30 Spray-Foamed Steel Shop (600 Sq Ft, 10\' Ceiling)', category: 'Pole Barns & Metal Buildings', sf: 600, ceil: 10, ins: 0.85, clim: 1.05, heat: 1000, note: 'Closed-cell 2" spray foam creates an airtight thermal envelope—do NOT oversize or the unit will short-cycle and leave the shop clammy.' },
  { slug: 'she-shed-office-10x12-mini-split-size', name: '10×12 Backyard Office / She-Shed (120 Sq Ft)', category: 'Sheds, Cabins & ADUs', sf: 120, ceil: 8, ins: 1.0, clim: 1.05, heat: 600, note: 'Use a 6,000 BTU or 9,000 BTU variable-inverter mini-split (115V) that can throttle down to 2,200 BTU/hr so it dehumidifies properly without freezing you out.' },
  { slug: 'backyard-studio-shed-12x16-mini-split-btu', name: '12×16 Backyard Studio & Gym Shed (192 Sq Ft)', category: 'Sheds, Cabins & ADUs', sf: 192, ceil: 9, ins: 1.05, clim: 1.05, heat: 800, note: 'A 9,000 BTU 115V DIY inverter mini-split handles a 12×16 studio effortlessly on a standard 15A dedicated circuit.' },
  { slug: 'tiny-house-on-wheels-240-sq-ft-mini-split', name: '240 Sq Ft Tiny House on Wheels (Lofted Ceiling)', category: 'Sheds, Cabins & ADUs', sf: 240, ceil: 10, ins: 1.0, clim: 1.08, heat: 800, note: 'Position the 9,000 BTU wall head high enough to sweep cool air across the sleeping loft where heat traps.' },
  { slug: 'adu-guest-house-500-sq-ft-mini-split', name: '500 Sq Ft Backyard ADU / In-Law Suite', category: 'Sheds, Cabins & ADUs', sf: 500, ceil: 8, ins: 0.95, clim: 1.05, heat: 1000, note: 'Open-plan 500 sq ft ADUs work great on one 12,000 BTU head; if there is a closed bedroom door, upgrade to a 18k dual-zone (9k + 6k/9k).' },
  { slug: 'adu-guest-house-800-sq-ft-mini-split', name: '800 Sq Ft 1-Bedroom Detached ADU', category: 'Sheds, Cabins & ADUs', sf: 800, ceil: 9, ins: 0.95, clim: 1.05, heat: 1400, note: 'A 2-zone 18,000 BTU outdoor condenser driving a 12,000 BTU living-room head and a 6,000/9,000 BTU bedroom head provides whisper-quiet 19 dB sleep comfort.' },
  { slug: 'shipping-container-home-20ft-mini-split', name: '20-Foot Conex Shipping Container Office (160 Sq Ft)', category: 'Sheds, Cabins & ADUs', sf: 160, ceil: 8, ins: 1.15, clim: 1.10, heat: 600, note: 'Steel walls conduct solar heat rapidly; paint the roof white elastomeric and install 2" closed-cell spray foam before mounting a 9,000 BTU 115V head.' },
  { slug: 'shipping-container-home-40ft-mini-split', name: '40-Foot High-Cube Shipping Container Home (320 Sq Ft)', category: 'Sheds, Cabins & ADUs', sf: 320, ceil: 9.5, ins: 1.10, clim: 1.08, heat: 900, note: 'Because a 40-foot container is a narrow 8-foot tunnel, mount a 12,000 BTU head on one end wall or use two 6,000 BTU heads if partitioned.' },
  { slug: 'sunroom-four-season-200-sq-ft-mini-split', name: '200 Sq Ft Glass Sunroom / Florida Room', category: 'Sunrooms & Additions', sf: 200, ceil: 9, ins: 1.45, clim: 1.15, heat: 1200, note: 'Wall-to-wall glass triples solar heat gain compared to drywall. A 200 sq ft sunroom needs 12,000 BTU (where a normal bedroom only needs 6,000 BTU).' },
  { slug: 'sunroom-four-season-350-sq-ft-mini-split', name: '350 Sq Ft Three-Season / Four-Season Sunroom', category: 'Sunrooms & Additions', sf: 350, ceil: 9, ins: 1.48, clim: 1.15, heat: 1500, note: 'Size for peak west-facing afternoon solar gain: 15,000 to 18,000 BTU with low-E window film cuts summer runtime by 30%.' },
  { slug: 'enclosed-porch-screen-room-250-sq-ft-mini-split', name: '250 Sq Ft Enclosed Back Porch Conversion', category: 'Sunrooms & Additions', sf: 250, ceil: 8, ins: 1.35, clim: 1.10, heat: 800, note: 'Insulate the floor joists underneath the porch with R-19 rigid foam board so winter cold does not radiate through the floor.' },
  { slug: 'bonus-room-over-garage-frog-400-sq-ft-mini-split', name: '400 Sq Ft Bonus Room Over Garage (FROG)', category: 'Sunrooms & Additions', sf: 400, ceil: 8, ins: 1.25, clim: 1.08, heat: 900, note: 'Rooms over unconditioned garages suffer heat gain from 5 exposed sides (floor, roof knee walls, and gables). A dedicated 12,000 BTU mini-split fixes hot upstairs rooms permanently.' },
  { slug: 'bonus-room-over-garage-600-sq-ft-mini-split', name: '600 Sq Ft Large Bonus Room / Media Room Over Garage', category: 'Sunrooms & Additions', sf: 600, ceil: 8.5, ins: 1.25, clim: 1.08, heat: 1400, note: 'Media projectors, gaming PCs, and knee-wall attics add substantial sensible heat—use an 18,000 BTU wall or ceiling-cassette head.' },
  { slug: 'finished-attic-bedroom-350-sq-ft-mini-split', name: '350 Sq Ft Finished Attic / Cape Cod Loft Bedroom', category: 'Sunrooms & Additions', sf: 350, ceil: 7.5, ins: 1.22, clim: 1.08, heat: 700, note: 'Where sloped rafters prevent high-wall mounting, use a low-wall floor-console mini-split head under the knee wall.' },
  { slug: 'finished-basement-600-sq-ft-mini-split', name: '600 Sq Ft Finished Basement Rec Room', category: 'Basements & Living Spaces', sf: 600, ceil: 8, ins: 0.78, clim: 0.95, heat: 800, note: 'Earth-bermed basements have 25% lower cooling loads than upstairs rooms, but high latent humidity. Choose a 12,000 BTU inverter with dedicated Dry Mode.' },
  { slug: 'finished-basement-1000-sq-ft-mini-split', name: '1,000 Sq Ft Walkout Basement Apartment', category: 'Basements & Living Spaces', sf: 1000, ceil: 8, ins: 0.85, clim: 1.0, heat: 1200, note: 'An 18,000 BTU single-zone or 2-zone (9k+9k) heat pump handles both winter heating and summer dehumidification quietly.' },
  { slug: 'master-bedroom-300-sq-ft-mini-split-size', name: '300 Sq Ft Primary Bedroom Suite', category: 'Basements & Living Spaces', sf: 300, ceil: 9, ins: 0.95, clim: 1.0, heat: 600, note: 'Never oversize a bedroom unit! A 9,000 BTU inverter running at low speed operates at 19 dB (quieter than a whisper) and maintains 45% relative humidity.' },
  { slug: 'small-bedroom-150-sq-ft-mini-split-size', name: '150 Sq Ft Guest Bedroom / Nursery', category: 'Basements & Living Spaces', sf: 150, ceil: 8, ins: 0.95, clim: 1.0, heat: 400, note: 'Select a 6,000 BTU or 7,000 BTU head (or 9,000 BTU high-turndown inverter) to avoid cold, clammy short-cycling.' },
  { slug: 'open-living-room-kitchen-700-sq-ft-mini-split', name: '700 Sq Ft Open-Concept Living Room & Kitchen', category: 'Basements & Living Spaces', sf: 700, ceil: 9, ins: 1.0, clim: 1.05, heat: 2200, note: 'Cooking ovens, refrigerators, and dishwashers add ~2,200 to 4,000 BTU/hr of internal heat gain—factor kitchen heat into your sizing!' },
  { slug: 'vaulted-great-room-900-sq-ft-mini-split', name: '900 Sq Ft Vaulted-Ceiling Great Room (14\' Peak)', category: 'Basements & Living Spaces', sf: 900, ceil: 12, ins: 1.05, clim: 1.05, heat: 1400, note: 'Mount the 24,000 BTU indoor head at 8 to 9 feet height (not at the 14-foot peak) so conditioned air circulates through the occupied zone.' },
  { slug: 'home-gym-garage-conversion-400-sq-ft-mini-split', name: '400 Sq Ft Garage Home Gym & Fitness Studio', category: 'Garages & Workshops', sf: 400, ceil: 9, ins: 1.15, clim: 1.05, heat: 2400, note: 'Each exercising adult emits ~1,200 BTU/hr of sensible + latent sweat heat! Add 1,200 BTU per person working out simultaneously.' },
  { slug: 'server-room-it-closet-100-sq-ft-mini-split', name: '100 Sq Ft Server Room / Home Lab Rack (2 kW Heat Load)', category: 'Specialty & Commercial', sf: 100, ceil: 8, ins: 1.0, clim: 1.0, heat: 6824, note: 'Every 1,000 Watts of server/UPS draw equals 3,412 BTU/hr of 24/7 sensible heat! A 2 kW rack requires a 12,000 BTU low-ambient cooling mini-split rated to operate down to -5°F outdoors.' },
  { slug: 'crypto-mining-or-data-closet-5kw-mini-split', name: '150 Sq Ft High-Density IT / 4 kW Equipment Room', category: 'Specialty & Commercial', sf: 150, ceil: 8, ins: 1.0, clim: 1.0, heat: 13650, note: '4 kW of continuous electronics generates 13,648 BTU/hr before room envelope heat—requires an 18,000 BTU commercial low-ambient cooling unit.' },
  { slug: 'indoor-grow-room-400-sq-ft-led-mini-split', name: '400 Sq Ft Indoor LED Grow Room (4,000W Lighting)', category: 'Specialty & Commercial', sf: 400, ceil: 9, ins: 1.0, clim: 1.0, heat: 13650, note: 'LED grow fixtures convert almost 100% of electrical input into heat (3.412 BTU/Watt) plus high plant transpiration moisture—pair a 24,000 BTU mini-split with a dedicated commercial dehumidifier.' },
  { slug: 'wine-cellar-120-sq-ft-cooling-vs-mini-split', name: '120 Sq Ft Wine Cellar (55°F Setpoint Trap)', category: 'Specialty & Commercial', sf: 120, ceil: 8, ins: 0.90, clim: 1.0, heat: 500, note: 'WARNING: Standard residential mini-splits stop cooling at 61°F–62°F! True 55°F wine storage requires a dedicated wine cooling unit or a CoolBot-controlled system.' },
  { slug: 'greenhouse-hobby-200-sq-ft-mini-split', name: '200 Sq Ft Polycarbonate Four-Season Greenhouse', category: 'Specialty & Commercial', sf: 200, ceil: 9, ins: 1.65, clim: 1.15, heat: 1500, note: 'Twin-wall polycarbonate has only ~R-1.6 insulation value, creating extreme winter heat loss and summer solar gain; requires 18,000 BTU.' },
  { slug: 'log-cabin-off-grid-600-sq-ft-mini-split', name: '600 Sq Ft Off-Grid Solar Log Cabin', category: 'Sheds, Cabins & ADUs', sf: 600, ceil: 10, ins: 1.10, clim: 1.15, heat: 800, note: 'High-efficiency 25+ SEER2 inverter mini-splits soft-start with almost zero inrush current, making them ideal for off-grid LiFePO4 battery + hybrid solar inverters.' },
  { slug: 'barndominium-living-quarters-1500-sq-ft', name: '1,500 Sq Ft Barndominium Living Space (Multi-Zone)', category: 'Pole Barns & Metal Buildings', sf: 1500, ceil: 10, ins: 0.95, clim: 1.05, heat: 1800, note: 'Best served by a 36,000 BTU 3-zone or 4-zone hyper-heat system (e.g., 18k great room + 9k primary + 9k guest bedroom).' },
  { slug: 'mobile-home-single-wide-900-sq-ft-mini-split', name: '900 Sq Ft Single-Wide Manufactured / Mobile Home', category: 'Basements & Living Spaces', sf: 900, ceil: 8, ins: 1.18, clim: 1.05, heat: 1200, note: 'Bypassing leaky underbelly mobile-home ductwork with a 2-zone 24,000 BTU mini-split (12k living + 9k bedroom) cuts electric bills by 35%–50%.' },
  { slug: 'double-wide-mobile-home-1500-sq-ft-mini-split', name: '1,500 Sq Ft Double-Wide Manufactured Home', category: 'Basements & Living Spaces', sf: 1500, ceil: 8, ins: 1.15, clim: 1.05, heat: 1800, note: 'A 36,000 BTU 3-zone system (18k living/kitchen + 9k master + 9k bedrooms) replaces failing package units without crawl-space duct losses.' },
  { slug: 'rv-fifth-wheel-stationary-350-sq-ft-mini-split', name: '350 Sq Ft Stationary RV / Park Model Mini-Split', category: 'Sheds, Cabins & ADUs', sf: 350, ceil: 7.5, ins: 1.28, clim: 1.12, heat: 800, note: 'Replacing loud 72 dB roof RV AC units with a 12,000 BTU inverter mini-split cuts noise by 75% and drops power draw from 1,800W to ~550W.' },
  { slug: 'historic-radiator-home-1200-sq-ft-retrofit', name: '1,200 Sq Ft Historic Home (No Ductwork AC Retrofit)', category: 'Basements & Living Spaces', sf: 1200, ceil: 9.5, ins: 1.20, clim: 1.05, heat: 1400, note: 'Ideal for 1920s–1950s boiler/radiator homes: a 3-zone 30,000 BTU mini-split adds silent central-grade AC without tearing open plaster walls.' },
  { slug: 'coffee-shop-retail-storefront-1000-sq-ft', name: '1,000 Sq Ft Retail Storefront / Salon / Office', category: 'Specialty & Commercial', sf: 1000, ceil: 10, ins: 1.15, clim: 1.08, heat: 4500, note: 'Commercial foot traffic, storefront glass, display lighting, and espresso/hair-dryer loads add 4,000+ BTU/hr—step up to 36,000 BTU.' },
  { slug: 'barbershop-salon-studio-500-sq-ft-mini-split', name: '500 Sq Ft Salon / Barbershop Suite', category: 'Specialty & Commercial', sf: 500, ceil: 9, ins: 1.10, clim: 1.05, heat: 3000, note: 'Blow dryers and frequent door openings justify an 18,000 BTU ceiling cassette or high-wall inverter unit.' },
  { slug: 'detached-music-studio-300-sq-ft-mini-split', name: '300 Sq Ft Soundproof Recording & Podcast Studio', category: 'Specialty & Commercial', sf: 300, ceil: 8, ins: 0.90, clim: 1.0, heat: 1800, note: 'Choose a whisper-quiet 19 dB Mitsubishi/Daikin/Fujitsu 9,000 BTU wall unit—soundproofed double-drywall rooms trap amplifier & computer heat.' },
  { slug: 'dog-kennel-grooming-building-400-sq-ft', name: '400 Sq Ft Insulated Dog Kennel & Grooming Barn', category: 'Specialty & Commercial', sf: 400, ceil: 8, ins: 1.10, clim: 1.08, heat: 1600, note: 'Install washable pre-filter screens to trap pet hair before it reaches the evaporator coil fins.' },
  { slug: 'auto-detailing-bay-600-sq-ft-mini-split', name: '600 Sq Ft Auto Detailing & Ceramic Coating Bay', category: 'Garages & Workshops', sf: 600, ceil: 11, ins: 1.15, clim: 1.05, heat: 1500, note: 'Ceramic coatings require 60°F–75°F and <50% humidity to flash properly. An 18,000–24,000 BTU inverter with Dry Mode keeps curing conditions locked in.' },
  { slug: 'wood-drying-or-cigar-lounge-300-sq-ft', name: '300 Sq Ft Backyard Cigar Lounge / Man Cave', category: 'Sheds, Cabins & ADUs', sf: 300, ceil: 9, ins: 1.10, clim: 1.05, heat: 1000, note: 'When running a 400 CFM exhaust fan for smoke removal, outdoor makeup air adds significant cooling load—upsize from 9k to 12k–15k BTU.' },
  { slug: 'pool-house-cabana-450-sq-ft-mini-split', name: '450 Sq Ft Pool House & Changing Cabana', category: 'Sunrooms & Additions', sf: 450, ceil: 9, ins: 1.15, clim: 1.12, heat: 1000, note: 'Wet swimmers and frequent door openings drive high indoor humidity; specify a 15,000 BTU unit with GoldFin/BlueFin anti-corrosion coil coating.' },
  { slug: 'garage-apartment-over-2-car-550-sq-ft', name: '550 Sq Ft Carriage House / Garage Apartment', category: 'Sheds, Cabins & ADUs', sf: 550, ceil: 8.5, ins: 1.15, clim: 1.05, heat: 1200, note: 'A 15,000 to 18,000 BTU hyper-heat unit provides both summer AC and sub-zero winter heating without running gas lines.' },
  { slug: 'two-story-home-1800-sq-ft-whole-house', name: '1,800 Sq Ft Whole-House Multi-Zone Mini-Split Retrofit', category: 'Basements & Living Spaces', sf: 1800, ceil: 8.5, ins: 1.0, clim: 1.05, heat: 2000, note: 'Split across two outdoor condensers (e.g., 24k downstairs + 24k upstairs) for higher SEER2 efficiency and 100% backup redundancy.' },
  { slug: 'two-story-home-2400-sq-ft-whole-house', name: '2,400 Sq Ft Whole-House Heat Pump Mini-Split System', category: 'Basements & Living Spaces', sf: 2400, ceil: 9, ins: 1.0, clim: 1.05, heat: 2400, note: 'Typically requires 48,000 to 60,000 BTU total across 5 to 6 indoor zones (2 outdoor condensers strongly outperform a single 5-zone branch-box unit).' },
  { slug: 'ranch-home-1400-sq-ft-3-bedroom-mini-split', name: '1,400 Sq Ft 3-Bedroom Ranch Home Mini-Split Layout', category: 'Basements & Living Spaces', sf: 1400, ceil: 8, ins: 1.0, clim: 1.05, heat: 1600, note: 'Classic layout: 18,000 BTU main living/kitchen zone plus three 6,000–9,000 BTU bedroom heads (36,000 BTU total outdoor capacity).' },
  { slug: 'home-office-200-sq-ft-computer-heat-load', name: '200 Sq Ft Home Office (Dual PC / Studio Lights)', category: 'Basements & Living Spaces', sf: 200, ceil: 8, ins: 1.0, clim: 1.05, heat: 2000, note: 'A gaming workstation + 3 monitors + key lights adds ~2,000 BTU/hr—making a 9,000 BTU quiet inverter the ideal pick for a 200 sq ft office.' },
  { slug: 'laundry-mudroom-addition-180-sq-ft', name: '180 Sq Ft Mudroom & Laundry Room Addition', category: 'Sunrooms & Additions', sf: 180, ceil: 8, ins: 1.10, clim: 1.05, heat: 1200, note: 'Clothes dryers dump heat and moisture; a 9,000 BTU 115V head keeps the addition comfortable independent of the main house thermostat.' }
];

const spaces = spaceTemplates.map(sp => ({
  slug: sp.slug, name: sp.name, category: sp.category, engineeringNote: sp.note,
  ...computeHvac(sp.sf, sp.ceil, sp.ins, sp.clim, 1.0, sp.heat)
}));

// 3. 60 Multi-Zone Condenser & Head Combination Pages (/multizone/...)
const multizoneConfigs = [];
const mzTemplates = [
  // 2-Zone (18k, 24k, 27k, 30k)
  { cond: 18000, heads: [9000, 9000], use: '2 Bedrooms or Small ADU (Up to 800 Sq Ft)' },
  { cond: 18000, heads: [6000, 12000], use: '1 Bedroom + Living Room Studio (Up to 850 Sq Ft)' },
  { cond: 18000, heads: [9000, 12000], use: 'Slightly Over-Connected 2-Zone ADU (116% Ratio)' },
  { cond: 24000, heads: [9000, 9000], use: 'Cold-Climate 2-Zone Reserve Capacity (Up to 900 Sq Ft)' },
  { cond: 24000, heads: [9000, 12000], use: 'Master Suite + Living Room (Up to 1,050 Sq Ft)' },
  { cond: 24000, heads: [12000, 12000], use: 'Balanced 2-Zone Garage + Bonus Room (Up to 1,150 Sq Ft)' },
  { cond: 24000, heads: [9000, 15000], use: 'Bedroom + Open Kitchen/Living (Up to 1,150 Sq Ft)' },
  { cond: 24000, heads: [9000, 18000], use: 'Large Great Room + Bedroom (112% Diversity Ratio)' },
  { cond: 24000, heads: [12000, 15000], use: 'Dual-Zone Workshop & Office (112% Diversity Ratio)' },
  { cond: 24000, heads: [12000, 18000], use: '2-Zone High-Diversity Split (125% Max Ratio)' },
  { cond: 27000, heads: [9000, 18000], use: 'Exact 100% Match Great Room + Suite (Up to 1,300 Sq Ft)' },
  { cond: 27000, heads: [12000, 15000], use: 'Exact 100% Match 2-Story Split (Up to 1,300 Sq Ft)' },
  { cond: 30000, heads: [12000, 18000], use: 'Large 2-Zone Shop + Living Space (Up to 1,450 Sq Ft)' },
  { cond: 30000, heads: [15000, 15000], use: 'Twin 15k Zones for Large Open Floorplan (Up to 1,450 Sq Ft)' },
  { cond: 36000, heads: [18000, 18000], use: 'Twin 18k Pole Barn or 2-Floor Heavy Load (Up to 1,750 Sq Ft)' },
  // 3-Zone (24k, 27k, 30k, 36k, 42k)
  { cond: 24000, heads: [6000, 9000, 9000], use: '3-Bedroom Upstairs Cooling Zone (Up to 1,100 Sq Ft)' },
  { cond: 24000, heads: [9000, 9000, 9000], use: '3 Small Bedrooms on 24k Condenser (112% Ratio)' },
  { cond: 24000, heads: [6000, 6000, 12000], use: '2 Offices + Living Area (Up to 1,100 Sq Ft)' },
  { cond: 27000, heads: [9000, 9000, 9000], use: 'Exact 100% Match 3-Bedroom Upstairs (Up to 1,250 Sq Ft)' },
  { cond: 27000, heads: [6000, 9000, 12000], use: '1,250 Sq Ft 2-Bedroom Condo / Cottage' },
  { cond: 27000, heads: [9000, 9000, 12000], use: '3-Zone Cottage (111% Diversity Ratio)' },
  { cond: 30000, heads: [9000, 9000, 12000], use: 'Exact 100% Match 1,400 Sq Ft Ranch Home' },
  { cond: 30000, heads: [6000, 12000, 12000], use: 'Office + Master + Living Room (Up to 1,400 Sq Ft)' },
  { cond: 30000, heads: [9000, 12000, 12000], use: '3-Zone 1,450 Sq Ft Home (110% Ratio)' },
  { cond: 30000, heads: [9000, 9000, 18000], use: 'Large Living Room + 2 Bedrooms (120% Ratio)' },
  { cond: 36000, heads: [9000, 9000, 18000], use: 'Most Popular 3-Zone Ranch System (Up to 1,700 Sq Ft)' },
  { cond: 36000, heads: [12000, 12000, 12000], use: 'Balanced 3-Zone Triplex / 3-Bay Shop (Up to 1,700 Sq Ft)' },
  { cond: 36000, heads: [9000, 12000, 15000], use: '3-Zone 1,700 Sq Ft Family Home' },
  { cond: 36000, heads: [9000, 12000, 18000], use: '3-Zone Open Floorplan (108% Diversity Ratio)' },
  { cond: 36000, heads: [12000, 12000, 18000], use: '3-Zone Large Home / Barndo (117% Ratio)' },
  { cond: 42000, heads: [12000, 12000, 18000], use: 'Exact 100% Match 2,000 Sq Ft 3-Zone Home' },
  { cond: 42000, heads: [9000, 15000, 18000], use: '3-Zone Main Floor + Upstairs + Bonus Room' },
  { cond: 42000, heads: [12000, 15000, 15000], use: '3-Zone Heavy-Load Commercial / Residence' },
  { cond: 48000, heads: [12000, 18000, 18000], use: '3-Zone Large Pole Barn / 2,300 Sq Ft Home' },
  { cond: 48000, heads: [15000, 15000, 18000], use: '3-Zone Commercial Office / Open Barndominium' },
  // 4-Zone (30k, 36k, 42k, 48k)
  { cond: 30000, heads: [6000, 6000, 9000, 9000], use: '4-Bedroom Upstairs Zone (Up to 1,350 Sq Ft)' },
  { cond: 30000, heads: [9000, 9000, 9000, 9000], use: '4 Small Rooms on 30k Condenser (120% Ratio)' },
  { cond: 36000, heads: [9000, 9000, 9000, 9000], use: 'Exact 100% Match 4-Bedroom Whole Upstairs' },
  { cond: 36000, heads: [6000, 9000, 9000, 12000], use: '3 Bedrooms + Main Living Area (Up to 1,650 Sq Ft)' },
  { cond: 36000, heads: [9000, 9000, 9000, 12000], use: 'Popular 4-Zone 1,700 Sq Ft Home (108% Ratio)' },
  { cond: 36000, heads: [6000, 6000, 12000, 12000], use: '2 Bedrooms + Living + Basement (Up to 1,650 Sq Ft)' },
  { cond: 36000, heads: [9000, 9000, 12000, 12000], use: '4-Zone 1,800 Sq Ft Home (117% Ratio)' },
  { cond: 36000, heads: [6000, 9000, 9000, 18000], use: 'Great Room + 3 Bedrooms (117% Ratio)' },
  { cond: 42000, heads: [9000, 9000, 12000, 12000], use: 'Exact 100% Match 4-Zone 2,000 Sq Ft Home' },
  { cond: 42000, heads: [6000, 9000, 12000, 15000], use: '4-Zone 2,000 Sq Ft Split-Level Home' },
  { cond: 42000, heads: [9000, 9000, 9000, 18000], use: '4-Zone 2,050 Sq Ft Ranch (107% Ratio)' },
  { cond: 42000, heads: [9000, 12000, 12000, 15000], use: '4-Zone 2,150 Sq Ft Home (114% Ratio)' },
  { cond: 48000, heads: [12000, 12000, 12000, 12000], use: 'Exact 100% Match 4-Zone 2,300 Sq Ft Home' },
  { cond: 48000, heads: [9000, 9000, 12000, 18000], use: 'Exact 100% Match Great Room + 3 Suites' },
  { cond: 48000, heads: [9000, 12000, 12000, 18000], use: '4-Zone 2,400 Sq Ft Home (106% Ratio)' },
  { cond: 48000, heads: [12000, 12000, 12000, 18000], use: '4-Zone Large Colonial / Barndo (112% Ratio)' },
  { cond: 48000, heads: [9000, 12000, 18000, 18000], use: '4-Zone High-Diversity Split (119% Ratio)' },
  // 5-Zone (36k, 42k, 48k, 60k)
  { cond: 36000, heads: [6000, 6000, 9000, 9000, 9000], use: '5-Zone Small Room Retrofit (108% Ratio)' },
  { cond: 42000, heads: [6000, 9000, 9000, 9000, 12000], use: '5-Zone 2,000 Sq Ft Colonial (107% Ratio)' },
  { cond: 48000, heads: [9000, 9000, 9000, 9000, 12000], use: 'Exact 100% Match 5-Zone 2,300 Sq Ft Home' },
  { cond: 48000, heads: [6000, 9000, 9000, 12000, 12000], use: 'Exact 100% Match 4-Bed + Living Area' },
  { cond: 48000, heads: [9000, 9000, 9000, 12000, 15000], use: '5-Zone 2,500 Sq Ft Home (112% Ratio)' },
  { cond: 48000, heads: [9000, 9000, 9000, 12000, 18000], use: '5-Zone 2,600 Sq Ft Home (119% Ratio)' },
  { cond: 60000, heads: [9000, 9000, 12000, 12000, 18000], use: 'Exact 100% Match 5-Zone 2,900 Sq Ft Home' },
  { cond: 60000, heads: [12000, 12000, 12000, 12000, 18000], use: '5-Zone 3,000+ Sq Ft Commercial / Estate (110% Ratio)' }
];

for (const mz of mzTemplates) {
  const totalHeadBtu = mz.heads.reduce((a, b) => a + b, 0);
  const ratioPct = Math.round((totalHeadBtu / mz.cond) * 100);
  const headSlug = mz.heads.map(h => `${h / 1000}k`).join('-');
  const condK = mz.cond / 1000;
  const elec = getElectricalSpec(mz.cond);
  const estSqFt = Math.round(mz.cond / 22);
  multizoneConfigs.push({
    slug: `${condK}k-${mz.heads.length}-zone-mini-split-${headSlug}`,
    title: `${condK},000 BTU ${mz.heads.length}-Zone Mini Split (${mz.heads.map(h => h / 1000 + 'k').join(' + ')}): Sq Ft, Ratio & Breaker`,
    shortLabel: `${condK}k BTU ${mz.heads.length}-Zone (${mz.heads.map(h => h / 1000 + 'k').join('+')})`,
    condenserBtu: mz.cond,
    zones: mz.heads.length,
    heads: mz.heads,
    totalHeadBtu,
    diversityRatioPct: ratioPct,
    maxCoverageSqFt: estSqFt,
    useCase: mz.use,
    voltage: elec.voltage,
    breaker: elec.breaker,
    wire: elec.wire,
    statusText: ratioPct <= 105 ? 'Optimal 100% Full Simultaneous Output' : ratioPct <= 125 ? 'Valid Diversity Ratio (Shared Peak Output)' : 'Over-Connected (Upgrade Condenser)'
  });
}

// 4. 40 BTU Head-to-Head, SEER2 Operating Cost & Electrical Breaker Pages (/compare/...)
const compareTemplates = [
  { slug: '9000-btu-vs-12000-btu-mini-split', title: '9,000 BTU vs 12,000 BTU Mini Split: Sq Ft, Amps & Short-Cycling Risk', btuA: 9000, btuB: 12000, summary: 'Use 9,000 BTU for 150–400 sq ft bedrooms/offices to prevent humidity short-cycling; step up to 12,000 BTU for 400–550 sq ft rooms or uninsulated spaces.' },
  { slug: '12000-btu-vs-18000-btu-mini-split', title: '12,000 BTU vs 18,000 BTU Mini Split: 1-Ton vs 1.5-Ton Comparison', btuA: 12000, btuB: 18000, summary: '12,000 BTU often runs on 115V (15A–20A) and covers up to 550 sq ft; 18,000 BTU requires 208/230V (20A double-pole) and handles 600–900 sq ft or 2-car garages.' },
  { slug: '18000-btu-vs-24000-btu-mini-split', title: '18,000 BTU vs 24,000 BTU Mini Split: 2-Car Garage & Great Room Sizing', btuA: 18000, btuB: 24000, summary: '18,000 BTU (1.5-Ton) fits insulated 600–850 sq ft spaces on 12 AWG wire; 24,000 BTU (2-Ton) requires 10 AWG wire / 25A–30A breaker and cools up to 1,200 sq ft.' },
  { slug: '24000-btu-vs-36000-btu-mini-split', title: '24,000 BTU vs 36,000 BTU Mini Split: 2-Ton vs 3-Ton Workshop & Barn Guide', btuA: 24000, btuB: 36000, summary: '24,000 BTU covers ~1,000–1,200 sq ft; 36,000 BTU (3-Ton) handles 1,400–1,800 sq ft pole barns or 3–4 zone homes on an 8 AWG / 35A–40A 230V circuit.' },
  { slug: '115v-vs-230v-mini-split-efficiency-and-wiring', title: '115V vs 230V Mini Split: Efficiency, Breaker Size & Cold-Weather Performance', btuA: 12000, btuB: 12000, summary: '230V mini-splits draw half the amperage of 115V units, run cooler on long wire runs, and are standard for hyper-heat cold-climate models above 12,000 BTU.' },
  { slug: 'single-zone-vs-multi-zone-mini-split-efficiency', title: 'Two Single-Zone Mini Splits vs One Dual-Zone: Cost, SEER2 & Redundancy', btuA: 24000, btuB: 24000, summary: 'Two 12,000 BTU single-zone units typically deliver 3–5 higher SEER2 points, lower minimum turndown (less short-cycling), and full backup if one condenser fails.' },
  { slug: '9000-btu-mini-split-amps-breaker-wire-size', title: '9,000 BTU Mini Split Amps, Breaker Size & Wire Gauge Chart (115V & 230V)', btuA: 9000, btuB: 9000, summary: 'A 9,000 BTU inverter draws 5–8A running (MCA ~10A–15A), requiring a 15A breaker and 14 AWG or 12 AWG copper wire.' },
  { slug: '12000-btu-mini-split-amps-breaker-wire-size', title: '12,000 BTU Mini Split Amps, Breaker Size & Wire Gauge Chart (115V & 230V)', btuA: 12000, btuB: 12000, summary: '12,000 BTU 115V units usually specify a 20A breaker (12 AWG); 230V models typically need a 15A double-pole breaker (14/12 AWG).' },
  { slug: '18000-btu-mini-split-amps-breaker-wire-size', title: '18,000 BTU Mini Split Amps, Breaker Size & Wire Gauge Chart (230V)', btuA: 18000, btuB: 18000, summary: '18,000 BTU 230V units specify 20A MOP double-pole breaker with 12/2 Romex or #12 THHN in liquid-tight whip to the outdoor disconnect.' },
  { slug: '24000-btu-mini-split-amps-breaker-wire-size', title: '24,000 BTU Mini Split Amps, Breaker Size & Wire Gauge Chart (230V)', btuA: 24000, btuB: 24000, summary: '24,000 BTU condensers require a 25A or 30A double-pole 230V breaker and 10 AWG copper conductors (verify nameplate MCA & MOP).' },
  { slug: '36000-btu-mini-split-amps-breaker-wire-size', title: '36,000 BTU Mini Split Amps, Breaker Size & Wire Gauge Chart (230V)', btuA: 36000, btuB: 36000, summary: '36,000 BTU (3-Ton) condensers typically require a 35A or 40A double-pole 230V breaker with 8 AWG copper conductors.' },
  { slug: '48000-btu-mini-split-amps-breaker-wire-size', title: '48,000 BTU Mini Split Amps, Breaker Size & Wire Gauge Chart (230V)', btuA: 48000, btuB: 48000, summary: '48,000 BTU (4-Ton) multi-zone condensers specify 45A–50A MOP double-pole breakers using #8 AWG THHN or #6 AWG NM-B.' },
  { slug: 'mini-split-operating-cost-per-month-electricity', title: 'How Much Electricity Does a Mini Split Use Per Month? (9k to 36k BTU Cost)', btuA: 12000, btuB: 24000, summary: 'Because inverter compressors throttle to 30%–50% load once the room reaches setpoint, a 12k BTU 20 SEER2 unit costs just $18–$32/month to run.' },
  { slug: 'mini-split-vs-window-ac-electricity-cost', title: 'Mini Split vs Window AC: Electricity Cost, Noise (19 dB vs 55 dB) & ROI', btuA: 12000, btuB: 12000, summary: 'A 22 SEER2 inverter mini-split cuts cooling electricity use by 40%–55% over a standard 11 CEER window AC while adding heat-pump winter heating.' },
  { slug: 'mini-split-vs-electric-baseboard-heating-cost', title: 'Mini Split Heat Pump vs Electric Baseboard Heat: Winter Bill Savings', btuA: 18000, btuB: 18000, summary: 'Electric resistance baseboards have a COP of 1.0 (100% efficiency); a cold-climate mini-split achieves COP 2.8–3.8 (280%–380%), cutting winter electric bills by 60%–70%.' },
  { slug: 'mini-split-vs-propane-garage-heater-cost', title: 'Mini Split Heat Pump vs Propane Garage Heater: Annual Operating Cost', btuA: 24000, btuB: 24000, summary: 'At $2.75/gal propane and $0.15/kWh electricity, a cold-climate mini-split heats a 2-car garage for ~45% less than propane while also providing summer AC.' },
  { slug: 'mini-split-vs-central-ac-cost-and-efficiency', title: 'Ductless Mini Split vs Central Air Conditioning: Duct Loss & SEER2 Guide', btuA: 36000, btuB: 36000, summary: 'Traditional attic ductwork loses 20%–30% of conditioned air to leaks and conduction; ductless mini-splits eliminate duct losses completely.' },
  { slug: 'seer2-16-vs-20-vs-25-payback-calculator', title: '16 SEER2 vs 20 SEER2 vs 25 SEER2 Mini Split: Real Dollar Payback', btuA: 18000, btuB: 18000, summary: 'Jumping from 16 to 20 SEER2 cuts cooling kWh by 20% with a fast 3–4 year payback; 25+ SEER2 shines brightest in hot Southern climates or off-grid solar.' },
  { slug: 'hyper-heat-vs-standard-mini-split-cold-climate', title: 'Hyper-Heat (-13°F) vs Standard Mini Split (5°F): Heating Capacity Drop', btuA: 18000, btuB: 18000, summary: 'Standard heat pumps lose 40%–50% of rated BTU below 15°F; vapor-injected Hyper-Heat units deliver 100% rated BTU down to 5°F and 75%+ down to -13°F.' },
  { slug: 'mitsubishi-vs-daikin-vs-fujitsu-mini-split', title: 'Mitsubishi vs Daikin vs Fujitsu Mini Split: Cold-Climate & Turndown Matrix', btuA: 18000, btuB: 18000, summary: 'All three Japanese tier-1 brands deliver 15–20 year lifespans, ultra-low 19 dB sound floors, and strong winter HSPF2 ratings.' },
  { slug: 'mr-cool-diy-vs-pro-installed-mini-split', title: 'MRCOOL DIY Pre-Charged vs Pro-Installed Mini Split: Cost & Warranty', btuA: 18000, btuB: 18000, summary: 'Pre-charged quick-connect linesets save $2,000–$3,500 in HVAC installation labor for garages and workshops, while pro flare installs optimize line length.' },
  { slug: 'wall-mounted-vs-ceiling-cassette-mini-split', title: 'Wall-Mounted vs 4-Way Ceiling Cassette Mini Split: Airflow & Install Guide', btuA: 18000, btuB: 18000, summary: 'High-wall heads are cheapest and easiest to clean; 1-way and 4-way ceiling cassettes fit cleanly between 16" O.C. joists for flush architectural ceilings.' },
  { slug: 'floor-console-vs-wall-mounted-mini-split', title: 'Floor-Console vs Wall-Mounted Mini Split for Attics & Sunrooms', btuA: 12000, btuB: 12000, summary: 'Floor-mounted consoles fit neatly on 36-inch knee walls and under sunroom windows where high-wall clearance does not exist.' },
  { slug: 'concealed-ducted-mini-split-sizing-guide', title: 'Concealed Short-Ducted Mini Split Sizing & Static Pressure Guide', btuA: 18000, btuB: 18000, summary: 'Slim ducted air handlers hide in closets or drop ceilings to serve 2–3 adjacent rooms quietly with traditional supply registers.' },
  { slug: 'btu-to-tons-hvac-conversion-chart', title: 'BTU to Tons HVAC Conversion Chart (6,000 BTU to 60,000 BTU)', btuA: 12000, btuB: 60000, summary: '1 Ton of refrigeration equals exactly 12,000 BTU/hr (0.5 Ton = 6k, 0.75 Ton = 9k, 1 Ton = 12k, 1.5 Ton = 18k, 2 Ton = 24k, 3 Ton = 36k).' },
  { slug: 'hvac-manual-j-vs-square-foot-rule-of-thumb', title: 'ACCA Manual J Load Calculation vs 20 BTU/Sq Ft Rule of Thumb', btuA: 18000, btuB: 24000, summary: 'The 20 BTU/sq ft rule breaks down in sunrooms, high-ceiling pole barns, and uninsulated garages—ceiling height, insulation R-value, and climate zone must be factored in.' },
  { slug: 'mini-split-oversizing-humidity-short-cycling-trap', title: 'Why Oversizing a Mini Split Causes Clammy Rooms & Mold (Turndown Trap)', btuA: 12000, btuB: 18000, summary: 'An oversized AC cools the air in 5 minutes before the coil can condense moisture—always check Minimum BTU Turndown capacity on the submittal sheet.' },
  { slug: 'mini-split-dry-mode-dehumidification-guide', title: 'Mini Split Dry Mode vs Standalone Dehumidifier: Energy & Humidity', btuA: 12000, btuB: 12000, summary: 'Dry Mode slows the indoor blower fan to super-chill the coil and pull 2–4 pints/hour of moisture—ideal for humid basements and summer shoulders.' },
  { slug: 'mini-split-line-set-length-limits-refrigerant', title: 'Mini Split Line Set Length Limits (Min 10 ft, Max 82–164 ft) & Pre-Charge', btuA: 12000, btuB: 24000, summary: 'Most condensers are pre-charged for 25 ft of lineset; shorter runs under 10 ft cause vibration noise, while longer runs require adding 0.16–0.32 oz/ft of R-410A or R-454B.' },
  { slug: 'r410a-vs-r454b-vs-r32-mini-split-refrigerant', title: 'R-410A vs R-454B vs R-32 Mini Split Refrigerants (2025–2026 EPA Transition)', btuA: 18000, btuB: 18000, summary: 'Low-GWP A2L refrigerants (R-454B and R-32) replace R-410A in new equipment with 5%–8% better heat transfer and similar pressure ratings.' },
  { slug: 'mini-split-generator-wattage-running-and-surge', title: 'What Size Generator or Power Station Runs a Mini Split? (Zero Surge Myth)', btuA: 12000, btuB: 18000, summary: 'Because inverter mini-splits ramp up softly via DC variable-frequency drives, a 12,000 BTU unit has virtually ZERO starting surge and runs on a 2,000W inverter generator.' },
  { slug: 'solar-powered-mini-split-battery-sizing', title: 'Running a Mini Split on Solar Panels & LiFePO4 Batteries (Off-Grid Math)', btuA: 12000, btuB: 12000, summary: 'A 12,000 BTU 22 SEER2 inverter averages 450W–650W after cooldown—easily powered by 1,200W of solar panels and a 5 kWh 48V LiFePO4 battery bank.' },
  { slug: 'mini-split-condensate-drain-pump-vs-gravity', title: 'Mini Split Condensate Drain Gravity Slope vs Mini Pump Sizing', btuA: 12000, btuB: 18000, summary: 'Always prioritize gravity drainage (1/4" per foot downward slope) on exterior walls; use an ultra-quiet Aspen/Sauermann condensate pump only for interior walls.' },
  { slug: 'mini-split-snow-stand-vs-wall-bracket-clearance', title: 'Cold-Climate Mini Split Snow Stand Height & Defrost Drainage Clearance', btuA: 18000, btuB: 24000, summary: 'Elevate outdoor heat pump condensers 12" to 24" above average local snowpack on heavy risers so winter defrost water drains freely without freezing the coil.' },
  { slug: 'mini-split-disconnect-box-and-whip-nec-code', title: 'NEC 440.14 Mini Split Outdoor Disconnect Box & Whip Wiring Requirements', btuA: 18000, btuB: 24000, summary: 'NEC 440.14 requires a lockable non-fused or fused disconnect switch within sight of and within 50 feet of the outdoor condenser unit.' },
  { slug: 'ceiling-height-btu-multiplier-8ft-10ft-12ft-16ft', title: 'High Ceiling BTU Multiplier Chart (8 ft vs 10 ft vs 12 ft vs 16 ft)', btuA: 18000, btuB: 36000, summary: 'Every additional 2 feet of ceiling height adds 25% more air volume to condition—a 12-foot ceiling needs ~1.40× to 1.50× the BTU of an 8-foot room.' },
  { slug: 'hvac-climate-zone-btu-map-zones-1-to-7', title: 'US IECC Climate Zone BTU Multiplier Chart (Zone 1 Miami to Zone 7 Minnesota)', btuA: 18000, btuB: 24000, summary: 'Zone 1–2 hot/humid states size for peak cooling & latent dehumidification; Zone 5–7 northern states size for -5°F to -15°F design heating loads.' },
  { slug: '6000-btu-vs-9000-btu-bedroom-mini-split', title: '6,000 BTU vs 9,000 BTU Mini Split for Small Bedrooms (100–250 Sq Ft)', btuA: 6000, btuB: 9000, summary: 'For tight 120–200 sq ft bedrooms, a 6,000 BTU head prevents temperature overshoot; check minimum modulation BTU before choosing 9,000 BTU.' },
  { slug: '15000-btu-vs-18000-btu-mini-split-comparison', title: '15,000 BTU vs 18,000 BTU Mini Split: Best Size for 600–750 Sq Ft Rooms', btuA: 15000, btuB: 18000, summary: '15,000 BTU bridges the gap between 12k and 18k for 550–700 sq ft living rooms, often offering lower minimum turndown than 18k chassis.' },
  { slug: '30000-btu-vs-36000-btu-mini-split-comparison', title: '30,000 BTU vs 36,000 BTU Mini Split: 2.5-Ton vs 3-Ton Capacity & Amps', btuA: 30000, btuB: 36000, summary: '30,000 BTU fits 30A/10 AWG circuits for ~1,300–1,500 sq ft; 36,000 BTU steps up to 35A–40A/8 AWG for up to 1,800 sq ft or 4-zone layouts.' }
];

const comparisons = compareTemplates.map(c => {
  const eA = getElectricalSpec(c.btuA);
  const eB = getElectricalSpec(c.btuB);
  return {
    slug: c.slug, title: c.title, shortLabel: c.title.split(':')[0],
    btuA: c.btuA, btuB: c.btuB, summary: c.summary,
    tonsA: +(c.btuA / 12000).toFixed(2), tonsB: +(c.btuB / 12000).toFixed(2),
    breakerA: eA.breaker, breakerB: eB.breaker,
    wireA: eA.wire, wireB: eB.wire,
    wattsA: eA.runningWatts, wattsB: eB.runningWatts
  };
});

fs.writeFileSync(path.join(DATA_DIR, 'sqft.json'), JSON.stringify(sqftPages, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'spaces.json'), JSON.stringify(spaces, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'multizone.json'), JSON.stringify(multizoneConfigs, null, 2));
fs.writeFileSync(path.join(DATA_DIR, 'comparisons.json'), JSON.stringify(comparisons, null, 2));

console.log(`[MiniSplitBTUMatrix Seed] Generated:
  - ${sqftPages.length} Square-Footage BTU Sizing Pages
  - ${spaces.length} Garage, Bonus Room, Sunroom & Barn Space Guides
  - ${multizoneConfigs.length} Multi-Zone Condenser & Head Matrices
  - ${comparisons.length} BTU Comparison, SEER2 & Breaker Guides
  Total Data Pages: ${sqftPages.length + spaces.length + multizoneConfigs.length + comparisons.length} (+ 5 Core/Compliance = ${sqftPages.length + spaces.length + multizoneConfigs.length + comparisons.length + 5} Pages)`);
