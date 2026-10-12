# Design — misstore

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

The token values live in [`src/assets/tokens.css`](src/assets/tokens.css) and are
imported at the top of `src/assets/main.css`. *(Hallmark's default location is the
project root; on a Vite project the tokens must sit inside `src/` to be bundled by
the `@import`, so they live in `src/assets/` instead.)*

## Genre

**hub-marketplace.** Two references, one register each:

- **misskey-hub-next / NoteDeck landing** supplies the *surface language*: a flat
  `#eee`-class paper with 16 px rounded panels floating on it, acrylic cards with
  the punched corner, the `#9ad11b` chip, the accent gradient on the wordmark,
  CTAs and section underlines, the dots band, the hero card the next row overlaps.
  The vocabulary lives in `src/assets/hub.css`; the values in `tokens.css`
  (`--accent-grad`, `--chip`, `--panel`, `--hero-bg`, `--acrylic`, `--tint`,
  `--dots`).
- **VS Code Marketplace** supplies the *skeleton*: hero search, one "newest" rail
  per kind with a "see all ›", a catalogue head (title + count, search, server,
  "Sort by"), a detail banner with a vertical-bar subtitle and an **Installation**
  block, a right sidebar of key-value rows.

Density from the marketplace, warmth and brand from the hub. Nunito display face
and 16/12/8 px radii are shared by both.

## Audience and job

Misskey users — including people who don't run NoteDeck yet — and the people who
publish extensions here. The page's job is **discovery**, not conversion: surfacing
kinds of extension a visitor wasn't looking for. Install is the second action, not
the first. Inside NoteDeck the store is reached as a column with a tab list, so
**item detail pages are a primary landing surface**, not a leaf.

## Macrostructure family

- **Home** — *Hub Front.* A hero card (Hub `section_top`): three-word tagline with
  the last word in gradient, a chip + one sentence, the cross-kind hero search
  (Marketplace), a gradient-rimmed notice pill pointing at CONTRIBUTING. Five
  acrylic **kind cards** overlap its lower edge (Hub `keyFeatures` / `getStarted`):
  icon, name + count chip, one line, an accent pill. Then one newest rail **per
  type** (5 items, "すべて見る ›"), headed by the gradient underline. A dots band
  with the "投稿する" panel closes the page. The search cut replaces kind cards and
  rails while a query is active; the hero stays so the input stays. Reveal: none.
- **List pages** — *Marketplace Catalogue.* Catalogue head (kind title + count chip,
  one-line blurb, search pill, server pill), then the filter row (pills, result
  count, "Sort by") and the uniform grid.
- **Detail pages** — *Workbench.* A panel banner — icon 128, name, a vertical-bar
  subtitle (author | category chip | version | license | updated), description,
  Copy, and an **Installation** block (hint, host input, accent Install). Source
  below; key-value sidebar (zebra rows), permissions and integrity to the right.
  No marketing copy, no enrichment.

## Theme — NoteDeck brand, preserved

The accent is NoteDeck's leaf-green. It is not a Hallmark catalog theme and must
not be swapped for one.

| Token | Dark | Light |
| --- | --- | --- |
| `--bg` | `oklch(21.8% 0.004 125.6)` | `oklch(97.0% 0.003 125.6)` |
| `--text` | `oklch(94.9% 0.002 125.6)` | `oklch(25.2% 0.004 125.6)` |
| `--text-muted` | `oklch(66.0% 0.002 125.6)` | `oklch(52.0% 0.004 125.6)` |
| `--accent` | `oklch(70.8% 0.179 125.6)` | same |
| `--accent-ink` | `oklch(22.0% 0.030 125.6)` | same |
| `--focus` | `oklch(78.0% 0.170 125.6)` | `oklch(52.0% 0.150 125.6)` |

Hub layer (same hue, Hub's hard-coded values re-expressed in OKLCH, see
`tokens.css` "Hub layer"): `--accent-grad` (#86b300 → #4ab300), `--chip` (#9ad11b)
with `--chip-ink`, `--panel` (#f7f7f7 / #222), `--hero-bg` (#ddd / #222),
`--acrylic` (#fff6 / #3336), `--tint`, `--dots`, `--shadow-accent`.

Rules:

- **Text on accent is `--accent-ink`, never white.** White on the lime is ~2.3:1 and
  fails WCAG AA. This also applies to `.btn-accent` — the Hub puts white there, we
  do not. Chips use `--chip-ink` (black), which is the Hub's own pattern.
- Neutrals carry 0.002–0.004 chroma at the anchor hue. No pure `#000` / `#fff`.
- The accent gradient appears in exactly four places: the wordmark's second half,
  `.btn-accent`, `.u-line` section underlines, the `.notice` rim. Nowhere else; no
  gradient on surfaces, cards or text blocks. The gradient word in the tagline is
  the one allowed `.text-gradient` outside the wordmark.
- The accent (solid or gradient) still covers ≤ 5 % of any viewport.
- `--shadow-accent` is allowed on one primary CTA per viewport (`.btn-accent.shadow`).
  No other coloured shadow.

## Typography

- **Display:** Nunito 700/800, roman. Tracking `-0.01em` to `-0.02em`.
- **Body:** system stack including Hiragino Sans / BIZ UDGothic (the app is
  Japanese-first).
- **Mono:** `--font-mono`. Never re-declare a mono stack inline.
- Scale is `--text-2xs` … `--text-4xl`, whole pixels only. **No half-pixel sizes.**
- Body base is `--text-md` (14 px) — the density the marketplace register needs.
- Headings are roman. Never italic.

## Spacing

4-point named scale, `--space-3xs` … `--space-3xl`, in `tokens.css`. Pages use named
tokens, never raw values. Section padding varies deliberately by rail; do not pad
every band identically.

## Motion

- Easings: `--ease-out` `cubic-bezier(0.16, 1, 0.3, 1)`, plus `--ease-in` and
  `--ease-in-out`. `--ease-decel` is an alias of `--ease-out`.
- Durations: `--duration-fast` 100 ms (press), `--duration-base` 150 ms (hover,
  colour), `--duration-slow` 280 ms (drawer).
- **Three primitives, app-wide:** hover-tint · press-tick · skeleton-pulse.
  `.btn-accent` slides its gradient on hover — that is a hover-tint, not a fourth.
  The one exception is the hero icon's heartbeat (`hero-heartbeat`, 1.6 s), the
  same brand gesture as the NoteDeck landing; reduced motion stops it.
- **Reveal pattern: none.** No scroll-triggered fades, no entrance staggers, no
  `fade-in-up`. The Hub's `vFadeIn`, the animated underline, the spinning hero
  blobs and the parallax are deliberately **not** carried over; the blob is static,
  the underline is always drawn. The content is simply there.
- **One signal per hover.** A card changes its border colour. Not the border *and*
  a lift *and* a shadow *and* a background.
- Reduced motion: `prefers-reduced-motion: reduce` collapses everything to ≤ 0.01 s.

## Microinteractions stance

- Silent success. The copy button swaps its own label; no toast.
- Focus rings appear instantly and are **never** transitioned. One global
  `:focus-visible` rule; components only adjust `outline-offset` when they clip.
- `:focus-visible`, never `:focus`, on inputs. Never `outline: none` without a
  replacement ring.
- State is never carried by colour alone — the active nav tab has an underline, the
  active filter pill has a fill *and* an ink flip.

## CTA voice

- **Primary (page-level):** `.btn.btn-accent` — Hub GButton pill, gradient fill,
  `--accent-ink` label, optional `.shadow`. Hover slides the gradient; active drops
  1 px. Used for Install on detail pages, the kind-card "一覧を見る", the contribute
  CTA.
- **Primary (in-card):** `.vsx-btn-primary` — the compact segmented footer button;
  unchanged.
- **Secondary:** `.btn-plain` (page-level) or `.vsx-btn` (compact). `--surface`
  fill with a hairline `--border`.
- Labels are one line at every width (`white-space: nowrap`), imperative, short.

## Nav and footer

- **Nav: N1b**, preserved. The masked notch bar is inherited NoteDeck chrome and is
  brand, not slop. It aligns to `--content-width`, same inline padding as the
  content column. Do not rotate it for variety.
- **Footer: Hub GFooter.** Centred: wordmark, one sentence, one row of links, ©.
  Never Ft3 index columns.

## Per-page allowances

- Only the home hero carries enrichment, and only the Hub's: the app icon, one
  static blob. No illustration, no demo video, no screenshots elsewhere. The
  registry is the content.
- No page invents a metric. The registry has counts, dates, authors, categories and
  tags — and nothing else. There are no download counts, no ratings, no "featured"
  flag, so **no page may display one.**
- No page re-draws UI chrome. Code blocks use a typographic header, not a fake
  window with traffic lights.

## What pages MUST share

The wordmark, the accent and its ≤ 5 % budget, the Hub layer tokens, the display +
body fonts, the CTA voice, the chip, the nav, the footer, the spacing scale, the
motion stance.

## What pages MAY differ on

The macrostructure, within its page-type family. The rail composition on the home
page. The sidebar contents on a detail page.

## Diversification — inverted

This is a `designed-as-app` project. Hallmark's rotation rule does **not** apply:
consecutive pages must *share* theme, accent and type pairing. A page that drifts
from this file is the defect, not the variety.
