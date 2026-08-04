# Design — misstore

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

The token values live in [`src/assets/tokens.css`](src/assets/tokens.css) and are
imported at the top of `src/assets/main.css`. *(Hallmark's default location is the
project root; on a Vite project the tokens must sit inside `src/` to be bundled by
the `@import`, so they live in `src/assets/` instead.)*

## Genre

**modern-minimal.** The structure is a dense marketplace — filter rail, result
grid, spec-sheet detail page. The surface language stays soft: 16/12/8 px radii and
a rounded humanist display face, carried over from Misskey's own web UI. Density
from one register, warmth from the other.

## Audience and job

Misskey users — including people who don't run NoteDeck yet — and the people who
publish extensions here. The page's job is **discovery**, not conversion: surfacing
kinds of extension a visitor wasn't looking for. Install is the second action, not
the first. Inside NoteDeck the store is reached as a column with a tab list, so
**item detail pages are a primary landing surface**, not a leaf.

## Macrostructure family

- **Home** — *Ecosystem Index.* Several discovery surfaces, each a **different cut**
  of the registry. Never the same cut repeated per type. Reveal: none.
- **List pages** — *Catalogue.* Uniform grid of one kind of thing; the filter bar
  and the result count are the page's controls.
- **Detail pages** — *Workbench.* Source, permissions, integrity and install are the
  content. No marketing copy, no enrichment.

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

Rules:

- **Text on accent is `--accent-ink`, never white.** White on the lime is ~2.3:1 and
  fails WCAG AA.
- Neutrals carry 0.002–0.004 chroma at the anchor hue. No pure `#000` / `#fff`.
- The accent covers ≤ 5 % of any viewport. It marks state and counts, nothing else.
- No gradient fills. No `background-clip: text`. No coloured glow, on any surface.

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
- **Reveal pattern: none.** No scroll-triggered fades, no entrance staggers, no
  `fade-in-up`. The content is simply there.
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

- **Primary:** solid `--accent` fill, `--accent-ink` label, `--radius-2xs`, no
  shadow. Hover darkens to `--accent-strong`; active drops 1 px.
- **Secondary:** `--surface` fill with a hairline `--border`. Same geometry.
- Labels are one line at every width (`white-space: nowrap`), imperative, short.

## Nav and footer

- **Nav: N1b**, preserved. The masked notch bar is inherited NoteDeck chrome and is
  brand, not slop. It aligns to `--content-width`, same inline padding as the
  content column. Do not rotate it for variety.
- **Footer: Ft2 inline single line.** One band: wordmark, one sentence, three links.
  Never Ft3 index columns.

## Per-page allowances

- No page uses hero enrichment. No illustration, no demo video, no abstract
  background. The registry is the content.
- No page invents a metric. The registry has counts, dates, authors, categories and
  tags — and nothing else. There are no download counts, no ratings, no "featured"
  flag, so **no page may display one.**
- No page re-draws UI chrome. Code blocks use a typographic header, not a fake
  window with traffic lights.

## What pages MUST share

The wordmark, the accent and its ≤ 5 % budget, the display + body fonts, the CTA
voice, the nav, the footer, the spacing scale, the motion stance.

## What pages MAY differ on

The macrostructure, within its page-type family. The rail composition on the home
page. The sidebar contents on a detail page.

## Diversification — inverted

This is a `designed-as-app` project. Hallmark's rotation rule does **not** apply:
consecutive pages must *share* theme, accent and type pairing. A page that drifts
from this file is the defect, not the variety.
