# MiniSplitBTUMatrix — 241-Page Room & Garage Mini-Split BTU, Multi-Zone & SEER2 Calculator

**MiniSplitBTUMatrix (`https://minisplitbtumatrix.com`)** is a zero-dependency, 241-page static HTML/CSS/Vanilla JS programmatic SEO and display-ad monetization platform for mini-split BTU sizing, ceiling-height volume multipliers, uninsulated garages, bonus rooms, pole barns, multi-zone condenser diversity ratios, and SEER2 operating costs.

## Page Inventory (241 Pre-Rendered Static HTML Pages)

| Route | Pages | Target Search Intent |
| :--- | :---: | :--- |
| `/sqft/{slug}/` | **84 Pages** | *"what size mini split for 500 sq ft"*, *"1000 sq ft mini split BTU"*, *"cold climate hyper-heat sizing"* |
| `/spaces/{slug}/` | **52 Pages** | *"2-car garage mini split size"*, *"30x40 pole barn mini split BTU"*, *"sunroom & bonus room over garage"* |
| `/multizone/{slug}/` | **60 Pages** | *"36k 3-zone mini split 9k+9k+18k"*, *"24k dual-zone 9k+12k diversity ratio"* |
| `/compare/{slug}/` | **40 Pages** | *"12000 vs 18000 BTU mini split"*, *"18k BTU breaker & wire size"*, *"mini split vs baseboard heating cost"* |
| `/`, `/404.html`, `/about/`, `/privacy-policy/`, `/terms/`, `/contact/` | **5 Pages** | Master Interactive Hub + AdSense Compliance Pages |

## Commands

```bash
npm run seed
npm run build
```

## Cloudflare Workers / Pages Deployment

- **Build command**: `npm run build`
- **Deploy command**: `npx wrangler deploy` (or publish `./dist` directly on Cloudflare Pages)
