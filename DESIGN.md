# DESIGN.md — Watch Later Design System

> **Aesthetic Archetype:** Cinematic Linear Dark × Apple TV Entertainment Canvas  
> **Brand POV:** Minimal, ultra-dense software craft meets cinematic media sanctuary.  
> **Core Canvas:** Deep Obsidian (`#090A0F`), Slate Surface Panels (`#12151F`), glowing Neon Cyan (`#00F0FF`) & Warm Amber (`#F59E0B`) highlights, balanced with multi-layer ink typography.

---

## 1. Color Tokens & Semantic Surfaces

| Token | Hex Value | Semantic Purpose |
|:---|:---|:---|
| `--wl-canvas` | `#090A0F` | Primary deep obsidian background canvas |
| `--wl-surface-1` | `#12151F` | Slate card panels, interactive containers |
| `--wl-surface-2` | `#181C2A` | Elevated cards, hovering dialogs, pill tracks |
| `--wl-surface-subtle` | `rgba(255, 255, 255, 0.03)` | Inset backdrops and subtle borders |
| `--wl-border-hairline` | `rgba(255, 255, 255, 0.08)` | Hairline dividers and crisp separation |
| `--wl-border-active` | `rgba(0, 240, 255, 0.35)` | Active glow borders (Neon Cyan) |
| `--wl-ink` | `#F7F8F8` | Primary high-contrast display text |
| `--wl-ink-muted` | `#D0D6E0` | Secondary body text and titles |
| `--wl-ink-subtle` | `#8A8F98` | Microcopy, captions, labels, beat counters |
| `--wl-ink-tertiary` | `#5C616B` | Inactive pagination, timestamps, hairline marks |
| `--wl-accent-cyan` | `#00F0FF` | Neon cyan focal pulse, active indicator dots |
| `--wl-accent-amber` | `#F59E0B` | Warm golden takeaway badges and capture tags |

---

## 2. Typography Scale & Layout Rules

* **Display XL (Hero Headline):**
  * Size: `clamp(2.5rem, 6vw, 4.5rem)`
  * Weight: `800` (Bold / Black)
  * Tracking: `-0.035em`
  * Leading: `1.08`
  * Layout: `text-wrap: balance`

* **Display LG (Section Titles):**
  * Size: `clamp(1.85rem, 4vw, 3rem)`
  * Weight: `700`
  * Tracking: `-0.025em`
  * Leading: `1.15`
  * Layout: `text-wrap: balance`

* **Card Title & Pillars:**
  * Size: `1.25rem` (`20px`)
  * Weight: `600`
  * Tracking: `-0.015em`

* **Monospace Data Microcopy:**
  * Size: `0.75rem` (`12px`)
  * Font: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
  * Tabular: `tabular-nums`

---

## 3. Optical Alignment & Ambient Glow

* **Logo Presentation:**
  * Ambient radial glow behind wordmark (`bg-gradient-to-r from-cyan-500/20 via-amber-500/10 to-transparent blur-xl`)
  * Crisp vertical centering with header CTA pill
* **Concentric Radii:**
  * Outer card: `rounded-2xl` (`16px`) -> Inner pill/callout: `rounded-xl` (`12px`) -> Badge: `rounded-full`
